const express = require('express');
const router = express.Router();

const {
    getShippingRates
} = require("../Controllers/ShippingController");


router.post("/rates", getShippingRates);

module.exports = router;