const Supplier = require("../Models/Supplier");
const Product = require("../Models/Products");

exports.createSupplier = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      contactPerson,
    } = req.body;

    if (!name || !email || !phone || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: "Please input required fields",
      });
    }

    const existingSupplier = await Supplier.findOne({ email });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier already exists",
      });
    }

    const supplier = await Supplier.create({
      name,
      email,
      phone,
      address,
      city,
      state,
      contactPerson,
    });

    await logActivity({
        userId: req.user.id,
        action: "CREATE_SUPPLIER",
        description: `Created supplier ${supplier.name}`,
        resource: "Supplier",
        resourceId: supplier._id,
        data: {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        city: supplier.city,
        state: supplier.state,
        contactPerson: supplier.contactPerson
            }
    });
    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSupplier = async (req, res)=>{
    try{
        const {id} = req.params;
        const {name,email,phone,address,city,state,contactPerson,} = req.body;

        const supplier = await Supplier.findByIdAndUpdate(id,{name,email,phone,address,city,state,contactPerson,},{new:true,runValidators:true});
        if (!supplier){
            return res.status(404).json({message: "Supplier not found"})
        }
        //activity log
        await logActivity({
                userId: req.user.id,
                action: "UPDATE_SUPPLIER",
                description: `Updated supplier ${supplier.name}`,
                resource: "Supplier",
                resourceId: supplier._id,
                data: {
                    name: supplier.name,
                    email: supplier.email,
                    phone: supplier.phone,
                    address: supplier.address,
                    city: supplier.city,
                    state: supplier.state,
                    contactPerson: supplier.contactPerson
                   }
        });
    }catch(error){
        res.status(500).json({
            message:"Error updating Supplier",
            error: error.message
        });
    }
}

exports.deleteSupplier = async (req, res)=>{
    try{
        const {id}= req.params;
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return res.status(404).json({
            success: false,
            message: "Supplier not found",
        });
        }
        const productCount = await Product.countDocuments({
        supplier: supplier._id,
        });

        if (productCount > 0) {
        return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. ${productCount} product(s) are still assigned to this supplier.`,
        });
        }

       //activity log

        await logActivity({
            userId: req.user.id,
            action: "DELETE_SUPPLIER",
            description: `Deleted supplier ${supplier.name}`,
            resource: "Supplier",
            resourceId: supplier._id,
            data: {
                name: supplier.name,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                city: supplier.city,
                state: supplier.state,
                contactPerson: supplier.contactPerson,
            },
        });

        await supplier.deleteOne();
    
         res.status(200).json({
                success : true,
                message : "supplier deleted successfully",
            });
    }catch(error){
        res.status(500).json({
            success: false,
            message : error.message,
        });
    }
}

exports.getAllSuppliers = async(req, res)=>{
    try{
        const supplier= await Supplier.find();
                    res.status(200).json({
                    success: true,
                    count: supplier.length,
                    message: supplier,
                });
    }catch(error){
         res.status(500).json({
            success:false,
            message: error.message,
        });
    }
}