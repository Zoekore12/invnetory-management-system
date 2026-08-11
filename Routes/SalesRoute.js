const express = require("express");

const router = express.Router();

const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");

const {
    createSale
} = require("../Controllers/SaleController");

router.post(
    "/createSale",
    authMiddleware,
    approvedRoles("Cashier", "Admin", "SuperAdmin"),
    createSale
);

module.exports = router;