const crypto = require("crypto");

const Order = require("../Models/Order");
const Products = require("../Models/Products");
const User = require("../Models/User");
const {logActivity} = require("./activityController");

const {
    initializeTransaction,
    verifyTransaction
} = require("../Services/PayStackService");

const {
    createShipment
} = require("../Services/shipBubbleService");


// INITIALIZE PAYMENT

exports.initializePayment = async (req, res) => {
    try {

        const userId = req.user.id;

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message:
                    "Order ID is required"
            });
        }

        const order =
            await Order.findOne({
                _id: orderId,
                user: userId
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order not found"
            });
        }

        if (
            order.paymentStatus === "paid"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Order has already been paid"
            });
        }

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found"
            });
        }

        // Paystack amount is in kobo
        const amount =
            Math.round(
                order.totalAmount * 100
            );

        const reference =
            `${order.orderNumber}-${crypto
                .randomBytes(4)
                .toString("hex")}`;

        const result =
            await initializeTransaction({

                email: user.email,

                amount:
                    String(amount),

                currency: "NGN",

                reference,

                metadata: JSON.stringify({
                    orderId:
                        order._id.toString(),

                    orderNumber:
                        order.orderNumber,

                    userId:
                        userId.toString()
                })
            });

        if (!result.status) {
            return res.status(400).json({
                success: false,
                message:
                    result.message ||
                    "Unable to initialize payment"
            });
        }

        order.paymentReference =
            result.data.reference;

        await order.save();

        return res.status(200).json({
            success: true,

            message:
                "Payment initialized",

            authorizationUrl:
                result.data.authorization_url,

            accessCode:
                result.data.access_code,

            reference:
                result.data.reference
        });

    } catch (error) {

        console.error(
            "PAYMENT INITIALIZATION ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to initialize payment"
        });
    }
};


exports.verifyPayment = async (req, res) => {
    try {

        const userId = req.user.id;

        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment reference is required"
            });
        }

        const result =
            await verifyTransaction(
                reference
            );

        if (!result.status) {
            return res.status(400).json({
                success: false,
                message:
                    "Unable to verify payment"
            });
        }

        const transaction =
            result.data;

        // PAYMENT MUST BE SUCCESSFUL TO PROCEED WITH ORDER FULFILLMENT
        if (
            transaction.status !==
            "success"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment was not successful"
            });
        }

        // FIND ORDER

        const order =
            await Order.findOne({
                paymentReference:
                    transaction.reference,

                user: userId
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message:
                    "Order associated with payment not found"
            });
        }

        // PREVENT DOUBLE FULFILLMENT

        if (
            order.paymentStatus ===
            "paid"
        ) {
            return res.status(200).json({
                success: true,
                message:
                    "Payment has already been processed",
                order
            });
        }

        // VERIFY AMOUNT
        const expectedAmount =
            Math.round(
                order.totalAmount * 100
            );

        if (
            Number(transaction.amount) !==
            expectedAmount
        ) {

            console.error(
                "PAYMENT AMOUNT MISMATCH",
                {
                    expected:
                        expectedAmount,

                    received:
                        transaction.amount
                }
            );

            return res.status(400).json({
                success: false,
                message:
                    "Payment amount does not match order amount"
            });
        }

        // REDUCE STOCK

        for (const item of order.items) {

            const updatedProduct =
                await Products.findOneAndUpdate(

                    {
                        _id:
                            item.product,

                        quantity: {
                            $gte:
                                item.quantity
                        }
                    },

                    {
                        $inc: {
                            quantity:
                                -item.quantity
                        }
                    },

                    {
                        new: true
                    }
                );

            if (!updatedProduct) {

                return res.status(409).json({
                    success: false,
                    message:
                        `${item.name} is no longer available in the required quantity`
                });
            }
        }

      
        // MARK ORDER AS PAID

        order.paymentStatus =
            "paid";

        order.paymentReference =
            transaction.reference;

        order.paidAt =
            new Date();

        order.orderStatus =
            "processing";

        // LOG ACTIVITY    
        await logActivity.create({
            userId: req.user.id,
            action: "PAYMENT_SUCCESS",
            description: `Payment successful for order ${order.orderNumber}`,
            resource: "Payment",
            resourceId: order._id,
            data: {
                amount: order.totalAmount,
                reference: order.paymentReference,
                paymentStatus: "paid"
            }
        });    

        await order.save();

    
        // CREATE SHIPBUBBLE SHIPMENT

        try {

            const shipment =
                await createShipment({

                    request_token:
                        order.shipping
                            .requestToken,

                    service_code:
                        order.shipping
                            .serviceCode,

                    courier_id:
                        order.shipping
                            .courierId
                });

            if (
                shipment.status ===
                "success"
            ) {

                order.shipping.shipmentId =
                    shipment.data.order_id;

                order.shipping.trackingNumber =
                    shipment.data
                        .courier
                        ?.tracking_code ||
                    null;

                order.orderStatus =
                    "shipped";

                await order.save();
            }

        } catch (shippingError) {

            // Payment succeeded, so DO NOT mark
            // the payment as failed.

            console.error(
                "SHIPMENT CREATION ERROR:",
                shippingError.response?.data ||
                shippingError.message
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "Payment verified successfully",

            order
        });

    } catch (error) {

        console.error(
            "VERIFY PAYMENT ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Error verifying payment"
        });
    }
};