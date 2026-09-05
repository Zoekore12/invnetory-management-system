const express = require('express');
const router = express.Router();

//importing middleware
const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");
const upload = require("../Middleware/upload");

//importing product controller
const productController = require('../Controllers/ProductController');

const {createProduct,updateProduct,updateItem,getAllProducts,getProductById,deleteProduct} = require("../Controllers/ProductController");


//define routes
router.post("/createProduct",authMiddleware,approvedRoles("Admin","SuperAdmin"),upload.array("image",2),createProduct);
router.put("/updateProducts/:id",authMiddleware,approvedRoles("Admin","SuperAdmin"),upload.array("image", 2),updateProduct);
router.put("/updateItem/:id",authMiddleware,approvedRoles("Admin","SuperAdmin","StoreKeeper"), upload.array("image", 2),updateItem);
router.get("/getAllProducts",authMiddleware,approvedRoles("Admin","SuperAdmin","StoreKeeper","Cashier"),getAllProducts);
router.get("/getProductById/:id",authMiddleware,approvedRoles("Admin","SuperAdmin","StoreKeeper","Cashier"),getProductById);
router.delete("/deleteProduct/:id",authMiddleware,approvedRoles("Admin","SuperAdmin"),deleteProduct);

//export routes
module.exports = router;

