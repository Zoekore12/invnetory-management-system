const Ship = require("../Models/Ship");

const { logActivity } = require("./activityController");
const {
    fetchShippingRates,
    createShipment,
    validateAddress,
    getPackageCategories
} = require("../Services/shipBubbleService");

exports.getShippingRates = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            senderAddressCode,
            receiverAddressCode,
            pickupDate,
            categoryId,
            packageItems,
            packageDimension,
            serviceType,
            deliveryInstructions
        } = req.body;

        if (
            !senderAddressCode ||
            !receiverAddressCode ||
            !pickupDate ||
            !categoryId ||
            !packageItems ||
            !packageDimension
        ) {
            return res.status(400).json({
                success: false,
                message: "Required shipping information is missing"
            });
        }

        const shippingData = {
            sender_address_code:
                Number(senderAddressCode),

            reciever_address_code:
                Number(receiverAddressCode),

            pickup_date: pickupDate,

            category_id:
                Number(categoryId),

            package_items:
                packageItems,

            package_dimension:
                packageDimension
        };

        if (serviceType) {
            shippingData.service_type =
                serviceType;
        }

        if (deliveryInstructions) {
            shippingData.delivery_instructions =
                deliveryInstructions;
        }

        const result =
            await fetchShippingRates(shippingData);

        if (
            !result ||
            result.status !== "success" ||
            !result.data
        ) {
            return res.status(400).json({
                success: false,
                message:
                    result?.message ||
                    "Unable to retrieve shipping rates"
            });
        }

        const {
            request_token,
            couriers
        } = result.data;

        if (!request_token || !couriers) {
            return res.status(400).json({
                success: false,
                message:
                    "Shipbubble did not return valid shipping rates"
            });
        }

        // Save the complete quote on our server
        const quote =
            await Ship.create({

                user: userId,

                requestToken:
                    request_token,

                senderAddressCode:
                    Number(senderAddressCode),

                receiverAddressCode:
                    Number(receiverAddressCode),

                pickupDate,

                packageItems,

                packageDimension,

                couriers,

                // Shipbubble says request tokens
                // expire after 7 days
                expiresAt:
                    new Date(
                        Date.now() +
                        7 * 24 * 60 * 60 * 1000
                    )
            });
        return res.status(200).json({
            success: true,

            quoteId: quote._id,

            requestToken:
                quote.requestToken,

            couriers
        });

    } catch (error) {

        console.error(
            "SHIPPING RATE ERROR:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve shipping rates"
        });
    }
};
exports.validateShippingAddress = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address
        } = req.body;

        if (!name || !email || !phone || !address) {
            return res.status(400).json({
                success: false,
                message: "Name, email, phone and address are required"
            });
        }

        const result = await validateAddress({
            name,
            email,
            phone,
            address
        });

        if (!result || result.status !== "success") {
            return res.status(400).json({
                success: false,
                message:
                    result?.message ||
                    "Unable to validate address",
                errors: result?.errors || []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Address validated successfully",
            address: result.data
        });

    } catch (error) {
        console.error(
            "ADDRESS VALIDATION ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to validate address",
            error: error.response?.data || error.message
        });
    }
};
exports.createLabel = async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        // 1. Find order
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // 2. Make sure this is the user's order
        if (String(order.user) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to access this order"
            });
        }

        // 3. Make sure payment succeeded
        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Order must be paid before creating shipment"
            });
        }

        // 4. Prevent duplicate shipment
        if (order.shipping.shipmentId) {
            return res.status(400).json({
                success: false,
                message: "Shipment has already been created"
            });
        }

        const shippingData = {
            request_token: order.shipping.requestToken,
            courier_id: order.shipping.courierId
        };

        const result = await createShipment(shippingData);

        if (!result || result.status !== "success") {
            return res.status(400).json({
                success: false,
                message:
                    result?.message ||
                    "Unable to create shipping label",
                errors: result?.errors || []
            });
        }

        // Continue by saving the shipment information...
        
    } catch (error) {
        console.error(
            "CREATE SHIPPING LABEL ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create shipping label",
            error: error.response?.data || error.message
        });
    }
};
exports.getCategories = async (req, res) => {
    try {
        const result = await getPackageCategories();

        if (!result || result.status !== "success") {
            return res.status(400).json({
                success: false,
                message:
                    result?.message ||
                    "Unable to retrieve shipping categories",
                errors: result?.errors || []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Shipping categories retrieved successfully",
            categories: result.data
        });

    } catch (error) {
        console.error(
            "GET SHIPPING CATEGORIES ERROR:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve shipping categories",
            error: error.response?.data || error.message
        });
    }
};
  // logActivity
           /*} await logActivity.create({
                userId: req.user.id,
                action: "SHIPMENT_CREATED",
                description: `Shipment created for order ${order.orderNumber}`,
                resource: "Shipping",
                resourceId: order._id,
                data: {
                    courier: order.shipping.courier,
                    service: order.shipping.service,
                    trackingNumber:
                        order.shipping.trackingNumber,
                    shipmentId:
                        order.shipping.shipmentId
                }
            });*/