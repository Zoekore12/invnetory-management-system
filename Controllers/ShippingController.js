const Ship = require("../Models/Ship");

const { logActivity } = require("./activityController");
const {
    fetchShippingRates,
    createShipment
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

            // logActivity
            await logActivity.create({
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