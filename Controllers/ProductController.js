const Product = require("../Models/Products");

const {uploadImageToCloudinary,deleteImageFromCloudinary} = require("../Services/cloudinaryService");
const {logActivity}= require("./activityController");
//creating product
exports.createProduct = async (req, res) =>{
    try{
        const {name, size , description , price , quantity, supplier} = req.body;

        if(
            !name||!size||!description||!price||!quantity||!supplier
        ){
           return res.status(400).json({message: 'please input all required fields'});
        }
        //uploading image
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product image is required"
            });
            }
        const image = await Promise.all(
            req.files.map(async (file) => {
                const result = await uploadImageToCloudinary(file);

                return {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            })
        );

        const product = new Product({
            name,
            size,
            image,
            description,
            price,
            quantity,
            supplier

    });
     // Activity Logging
        await logActivity({
            userId: req.user.id,
            action: "CREATE_PRODUCT",
            description: `Created product ${product.name}`,
            resource: "Product",
            resourceId: product._id,
            data: {
                name: product.name,
                image: product.image,
                size: product.size,
                price: product.price,
                quantity: product.quantity,
                supplier: product.supplier
            }
        });
        await product.save();
        res.status(201).json({message:"product created successfully",product});
    }
    catch(error){
        res.status(500).json({
            message:"error creating product",
            error:error.message
        });
    }
};

//updating product

exports.updateProduct = async (req,res)=>{
    try{
        const {id} = req.params;
        const {name,size,description,price,supplier} = req.body;
        
        const product = await Product.findByIdAndUpdate(id,{name,size,description,price,supplier},{new:true,runValidators:true});
        if(!product){
            return res.status(404).json({message: "Product not found"})
        }
        // Activity Logging
        await logActivity({
            userId: req.user.id,
            action: "Update Product",
            description: `Product ${product.name} updated`,
            resource: "Product",
            resourceId: product._id,
        });
        // Activity Logging
        await logActivity({
            userId: req.user.id,
            action: "UPDATE_PRODUCT",
            description: `Product ${product.name} updated`,
            resource: "Product",
            resourceId: product._id,
        });


        res.status(200).json({message:"Product updated successfully",product});
    }
    catch (error){
        res.status(500).json({
            message:"Error updating Product",
            error: error.message
        });
    }
}

//get products

exports.getAllProducts = async (req,res)=>{
    try{
         const products = await Product.find();

            res.status(200).json({
            success: true,
            count: products.length,
            message: products,
        });

    }catch(error){
        res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}

//get a single product

exports.getProductById = async (req, res)=>{
    try{
        const id = (req.params.id);
        const product = await Product.findById(id);

         if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }
         res.status(200).json({
            success: true,
            message: product,
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
//delete product
exports.deleteProduct = async (req,res)=>{
    try{
        const id = req.params.id;
        const product = await Product.findByIdAndDelete(id);
        if(!product){
            return res.status(404).json({
                success : false,
                message : "Product not found",
            });
        }

         res.status(200).json({
                success : true,
                message : "Product deleted successfully",
            });

    }catch(error){
        res.status(500).json({
            success: false,
            message : error.message,
        });
    }
}
// Update item
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { action} = req.body;
        const quantity = Number(req.body.quantity);
        // Check action
        if (!["add", "remove"].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Action must be either add or remove"
            });
        }

        // Check quantity
        if (!quantity || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        // Find product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Save old quantity
        const oldQuantity = product.quantity;

        // Add stock
        if (action === "add") {
            product.quantity += quantity;
        }

        // Remove stock
        if (action === "remove") {

            if (quantity > product.quantity) {
                return res.status(400).json({
                    success: false,
                    message: "Not enough item available"
                });
            }

            product.quantity -= quantity;
        }

        await product.save();

        // Activity logging
        await logActivity({
            userId: req.user.id,
            action: action === "add"
                ? "ADD_ITEM"
                : "REMOVE_ITEM",

            description: action === "add"
                ? `Added ${quantity} units to ${product.name}`
                : `Removed ${quantity} units from ${product.name}`,

            resource: "Product",

            resourceId: product._id,

            data: {
                oldQuantity,
                quantityChanged: quantity,
                newQuantity: product.quantity
            }
        });

        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            product
        });

    } catch(error){
             res.status(500).json({
            success: false,
            message: "Error updating Item",
            error: error.message
        });
    }
}