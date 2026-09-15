const express = require("express");
const router = express.Router();

const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");

const {createSupplier,updateSupplier,deleteSupplier,getAllSuppliers} = require("../Controllers/SupplierController");

router.post("/", createSupplier);

router.post("/updateSupplier:id",authMiddleware,approvedRoles("Admin","SuperAdmin","StoreKeeper"), updateSupplier);

router.post("/deleteSupplier:id",authMiddleware,approvedRoles("Admin","SuperAdmin"), deleteSupplier);

router.get("/getAllSuppliers", authMiddleware,approvedRoles("Admin","SuperAdmin","StoreKeeper"), getAllSuppliers);

module.exports = router;