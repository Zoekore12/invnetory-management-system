const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },

        tokenHash: {
            type: String,
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

//  Delete expired refresh tokens
refreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

const refreshToken =
    mongoose.models.RefreshToken ||
    mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = refreshToken;