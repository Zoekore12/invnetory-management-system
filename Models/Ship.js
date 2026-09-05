const mongoose = require("mongoose");

const shipSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        requestToken: {
            type: String,
            required: true
        },

        senderAddressCode: {
            type: Number,
            required: true
        },

        receiverAddressCode: {
            type: Number,
            required: true
        },

        pickupDate: {
            type: String,
            required: true
        },

        packageItems: {
            type: Array,
            required: true
        },

        packageDimension: {
            type: Object,
            required: true
        },

        couriers: {
            type: Array,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

shipSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports =
    mongoose.models.Ship ||
    mongoose.model("Ship", shipSchema);