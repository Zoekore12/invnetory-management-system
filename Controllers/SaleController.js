const Product = require("../Models/Products");
const mongoose = require("mongoose");
const Sale = require("../Models/Sales");
const { logActivity } = require("./activityController");

/*exports.createSale = async (req, res) => {
      const {
            productId,
            quantity,
            paymentMethod,
            amountPaid
        } = req.body;

        // Check required fields
        if (
            !productId ||
            !quantity ||
            !paymentMethod ||
            amountPaid === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields"
            });
        }
          // Check quantity
        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }
         const session = await mongoose.startSession();
    try {
        let receipt;
        //session starts
        await session.withTransaction( async () =>{
        // Find product
        const product = await Product.findById(productId).session(session);

        if (!product) {
            throw new Error("Product not found");
        }

        // Check quantity requested against available stock
        if (quantity > product.quantity) {
            throw new Error("Requested quantity exceeds available stock");
        }

        // Get price from database
        const unitPrice = product.price;

        // Calculate total
        const total = unitPrice * quantity;

        // Check payment
        if (amountPaid < total) {
            throw new Error("Amount paid is less than total price");
        }

        // Calculate change
        const change = amountPaid - total;

        // Save old stock
        const oldQuantity = product.quantity;

        // Reduce stock
        product.quantity -= quantity;

        await product.save({ session });

        // Generate receipt number
        const receiptNumber =
            `REC-${Date.now()}`;

        // Create sale
        const sale = await Sale.create([
            {receiptNumber,
            product: product._id,
            quantity,
            unitPrice,
            total,
            cashier: req.user.id,
            paymentMethod,
            amountPaid,
            change
        }], { session });
        const saleId = sale[0];

        // Activity logging
        await logActivity({
            userId: req.user.id,
            action: "CREATE_SALE",
            description: `Sold ${quantity} ${product.name}`,
            resource: "Sale",
            resourceId: saleId,
            data: {
                product: product.name,
                quantity,
                unitPrice,
                total,
                oldStock: oldQuantity,
                newStock: product.quantity,
                receiptNumber,
                paymentMethod,
                amountPaid,
                change
            },
            session
        });

        // respond with sale receipt
        receipt = {
                receiptNumber,
                product: product.name,
                quantity,
                unitPrice,
                total,
                paymentMethod,
                amountPaid,
                change,
                cashier: req.user.id,
                date: saleId.createdAt
            }

        res.status(201).json({
            success: true,
            message: "Sale completed successfully",
            receipt
        });
        })
    } catch (error) {
            if (session.inTransaction()) {
        await session.abortTransaction();
    }
    res.status(500).json({
        success: false,
        message: "Error creating sale",
        error: error.message
    });
    }finally{
       await session.endSession();
    }
};*/
exports.createSale = async (req, res) => {
    const {
        productId,
        quantity,
        paymentMethod,
        amountPaid
    } = req.body;

    // Validate required fields
    if (
        !productId ||
        !quantity ||
        !paymentMethod ||
        amountPaid === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "Product, quantity, payment method and amount paid are required"
        });
    }

    // Validate quantity
    if (quantity <= 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be greater than zero"
        });
    }

    // Validate amount paid
    if (amountPaid < 0) {
        return res.status(400).json({
            success: false,
            message: "Amount paid cannot be negative"
        });
    }

    const session = await mongoose.startSession();

    try {
        let receipt;

        await session.withTransaction(async () => {

            // Find product
            const product = await Product
                .findById(productId)
                .session(session);

            if (!product) {
                throw new Error("Product not found");
            }

            // Check available stock
            if (quantity > product.quantity) {
                throw new Error(
                    `Requested quantity exceeds available stock. Available stock: ${product.quantity}`
                );
            }

            // Get product price
            const unitPrice = product.price;

            // Calculate total
            const total = unitPrice * quantity;

            // Check payment
            if (amountPaid < total) {
                throw new Error(
                    `Amount paid is less than the total price. Total: ${total}`
                );
            }

            // Calculate change
            const change = amountPaid - total;

            // Store old stock for activity log
            const oldQuantity = product.quantity;

            // Reduce stock
            product.quantity -= quantity;

            await product.save({ session });

            // Generate receipt number
            const receiptNumber = `REC-${Date.now()}`;

            // Create sale
            const sale = await Sale.create(
                [
                    {
                        receiptNumber,
                        product: product._id,
                        quantity,
                        unitPrice,
                        total,
                        cashier: req.user.id,
                        paymentMethod,
                        amountPaid,
                        change
                    }
                ],
                { session }
            );

            const saleRecord = sale[0];

            // Log activity
            await logActivity({
                userId: req.user.id,
                action: "CREATE_SALE",
                description: `Sold ${quantity} ${product.name}`,
                resource: "Sale",
                resourceId: saleRecord._id,
                data: {
                    product: product.name,
                    quantity,
                    unitPrice,
                    total,
                    oldStock: oldQuantity,
                    newStock: product.quantity,
                    receiptNumber,
                    paymentMethod,
                    amountPaid,
                    change
                },
                session
            });

            // Prepare receipt
            receipt = {
                receiptNumber,
                product: product.name,
                quantity,
                unitPrice,
                total,
                paymentMethod,
                amountPaid,
                change,
                cashier: req.user.id,
                date: saleRecord.createdAt
            };
        });

        // Only respond after transaction succeeds
        return res.status(201).json({
            success: true,
            message: "Sale completed successfully",
            receipt
        });

    } catch (error) {

        console.error("CREATE SALE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Error creating sale"
        });

    } finally {
        await session.endSession();
    }
};