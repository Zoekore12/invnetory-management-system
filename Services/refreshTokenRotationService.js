const ms = require("ms");

const User = require("../Models/User");
const RefreshToken = require("../Models/refreshToken");

const {
    generateToken,
    generateRefreshToken,
    hashRefreshToken
} = require("../Services/refreshTokenService");


const refreshAccessToken = async (refreshToken) => {

    // Hash the refresh token from the cookie
    const tokenHash = hashRefreshToken(refreshToken);

    // Find the token in MongoDB
    const storedToken = await RefreshToken.findOne({
        tokenHash
    });

    if (!storedToken) {
        throw new Error("Invalid or expired refresh token");
    }

    // Check if token has expired
    if (storedToken.expiresAt < new Date()) {

        await RefreshToken.deleteOne({
            _id: storedToken._id
        });

        throw new Error("Invalid or expired refresh token");
    }

    // Find the user
    const user = await User.findById(
        storedToken.userId
    );

    if (!user) {
        throw new Error("User not found");
    }

    // Generate new access token
    const accessToken = generateToken(user);

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken();

    // Hash the new refresh token
    const newTokenHash = hashRefreshToken(
        newRefreshToken
    );

    // New expiration
    const expiresAt = new Date(
        Date.now() +
        ms(process.env.JWT_REFRESH_EXPIRES_IN)
    );

    // Delete old refresh token
    await RefreshToken.deleteOne({
        _id: storedToken._id
    });

    // Save new refresh token
    await RefreshToken.create({
        userId: user._id,
        tokenHash: newTokenHash,
        expiresAt
    });

    return {
        accessToken,
        newRefreshToken
    };
};


module.exports = {
    refreshAccessToken
};