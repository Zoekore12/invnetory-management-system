const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Products purchased
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                // Snapshot of product information
                name: {
                    type: String,
                    required: true
                },

                price: {
                    type: Number,
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                total: {
                    type: Number,
                    required: true
                }
            }
        ],

        // Customer delivery address
        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            country: {
                type: String,
                default: "Nigeria"
            },

            // Shipbubble address code
            shipbubbleAddressCode: {
                type: String,
                default: null
            }
        },

        // Shipbubble information
        shipping: {
            courier: {
                type: String,
                default: null
            },

            service: {
                type: String,
                default: null
            },

            serviceCode: {
                type: String,
                default: null
            },

            courierId: {
                type: String,
                default: null
            },

            fee: {
                type: Number,
                default: 0
            },

            estimatedDelivery: {
                type: String,
                default: null
            },

            requestToken: {
                type: String,
                default: null
            },

            shipmentId: {
                type: String,
                default: null
            },

            trackingNumber: {
                type: String,
                default: null
            }
        },

        subtotal: {
            type: Number,
            required: true
        },

        shippingFee: {
            type: Number,
            required: true,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "failed",
                "refunded"
            ],
            default: "pending"
        },

        paymentReference: {
            type: String,
            default: null
        },

        paidAt: {
            type: Date,
            default: null
        },

        orderStatus: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.models.Order ||
    mongoose.model("Order", orderSchema);