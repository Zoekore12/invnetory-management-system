const express = require('express');
const router = express.Router();

const {
    getShippingRates,
    validateShippingAddress,
    createLabel,
    getCategories
} = require("../Controllers/ShippingController");

const authMiddleware = require("../Middleware/authMiddleware");


router.post("/rates",authMiddleware, getShippingRates);

router.post(
    "/validate-address",
    authMiddleware,
    validateShippingAddress
);

router.post(
    "/label",
    authMiddleware,
    createLabel
);

router.get(
    "/categories",
    authMiddleware,
    getCategories
);

module.exports = router;