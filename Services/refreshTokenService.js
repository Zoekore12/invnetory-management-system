const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

const hashRefreshToken = (key) => {
    return crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");
};

module.exports = {
    generateToken,
    generateRefreshToken,
    hashRefreshToken
};