const crypto = require("crypto");

const Products = require("../Models/Products");
const Order = require("../Models/Order");
const Ship = require("../Models/Ship");

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            items,
            ShippingAddress,
            ShipId,
            courierId,
            
        } = req.body;

        //  VALIDATE ITEMS
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product is required"
            });
        }

        // VALIDATE SHIPPING ADDRESS

        if (!ShippingAddress) {
            return res.status(400).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        const {
            fullName,
            phone,
            address,
            city,
            state,
            country,
            shipbubbleAddressCode
        } = ShippingAddress;

        if (
            !fullName ||
            !phone ||
            !address ||
            !city ||
            !state ||
            !shipbubbleAddressCode
        ) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required"
            });
        }
        // RETRIEVE SHIPPING QUOTE AND SAVE
            if (!ShipId) {
            return res.status(400).json({
                success: false,
                message:
                    "Shipping quote is required"
            });
        }
         const quote =
            await Ship.findOne({
                _id: ShipId,
                user: userId
            });

        if (!quote) {
            return res.status(404).json({
                success: false,
                message:
                    "Shipping quote not found or expired"
            });
        }

        //  FIND SELECTED COURIER AND SERVICE
        const selectedCourier =
            quote.couriers.find(
                courier =>
                    String(courier.courier_id) ===
                    String(courierId)
            );

        if (!selectedCourier) {
            return res.status(400).json({
                success: false,
                message:
                    "Selected shipping option is invalid"
            });
        }
        //RETRIEVE SHIPPING PRICE
      const shippingFee = 
            Number(
            selectedCourier.rate_card_amount ??
            selectedCourier.total
            );

        if (
            Number.isNaN(shippingFee) ||
            shippingFee < 0) 
            {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid shipping price"
            });
        }
        // GET PRODUCTS FROM DATABASE

        const orderItems = [];

        let subtotal = 0;

        for (const item of items) {

            if (
                !item.product ||
                !item.quantity
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Product and quantity are required"
                });
            }

            if (item.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Quantity must be at least 1"
                });
            }

            const product =
                await Products.findById(
                    item.product
                );

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message:
                        `Product not found: ${item.product}`
                });
            }

            // CHECK STOCK

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${product.name} only has ${product.quantity} item(s) left`
                });
            }
            //CONFIRM PRODUCT PRICE
            const itemTotal =
            product.price *
            item.quantity;

            subtotal += itemTotal;

            orderItems.push({
                product: product._id,

                name: product.name,

                price: product.price,

                quantity: item.quantity,

                total: itemTotal
            });
          }
    
        // CALCULATE TOTAL
        const totalAmount =
            subtotal + shippingFee;

        // GENERATE ORDER NUMBER
        const orderNumber =
            `ORD-${Date.now()}-${crypto
                .randomBytes(3)
                .toString("hex")
                .toUpperCase()}`;

        
        // CREATE ORDER
        
        const order =
            await Order.create({

                orderNumber,

                user: userId,

                items: orderItems,

                shippingAddress: {

                    fullName,

                    phone,

                    address,

                    city,

                    state,

                    country:
                        country || "Nigeria",

                    shipbubbleAddressCode
                },

                shipping: {

                    courier:
                        selectedCourier
                            .courier_name,

                    service:
                        selectedCourier
                            .service_type ||
                        null,

                    serviceCode:
                        selectedCourier
                            .service_code ||
                        null,

                    courierId:
                        selectedCourier
                            .courier_id,

                    fee:
                        shippingFee,

                    estimatedDelivery:
                        selectedCourier
                            .delivery_eta ||
                        null,

                    requestToken:
                        quote.requestToken,

                    shipmentId:
                        null,

                    trackingNumber:
                        null
                },

                subtotal,

                shippingFee,

                totalAmount,

                paymentStatus:
                    "pending",

                paymentReference:
                    null,

                paidAt:
                    null,

                orderStatus:
                    "pending"
        });

        // RESPONSE
        
        return res.status(201).json({
            success: true,
            message: "Order created successfully",

            order: {
                id: order._id,
                orderNumber: order.orderNumber,

                items: order.items,

                shippingAddress:
                    order.shippingAddress,

                shipping:
                    order.shipping,

                subtotal:
                    order.subtotal,

                shippingFee:
                    order.shippingFee,

                totalAmount:
                    order.totalAmount,

                paymentStatus:
                    order.paymentStatus,

                orderStatus:
                    order.orderStatus,

                createdAt:
                    order.createdAt
            }
        });

    } catch (error) {

        console.error(
            "CREATE ORDER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error creating order",
            error: error.message
        });
    }
};