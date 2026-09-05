const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
    {
        receiptNumber: {
            type: String,
            required: true,
            unique: true
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        quantity: {
            type: Number,
            required: true
        },

        unitPrice: {
            type: Number,
            required: true
        },

        total: {
            type: Number,
            required: true
        },

        cashier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
            paymentMethod: {
            type: String,
            enum: ["cash", "transfer", "card"],
            required: true
        },

        amountPaid: {
            type: Number,
            required: true
        },

        change: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Sale", saleSchema);