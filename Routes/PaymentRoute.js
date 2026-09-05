const express = require("express");

const router = express.Router();

const {
    initializePayment,
    verifyPayment
} = require("../Controllers/PaymentController");

const authMiddleware = require("../Middleware/authMiddleware");

router.post(
    "/initialize",
    authMiddleware,
    initializePayment
);

router.post(
    "/verify",
    authMiddleware,
    verifyPayment
);

module.exports = router;