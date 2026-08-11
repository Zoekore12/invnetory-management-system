const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./Models/User");

require("dotenv").config();

const seedSuperAdmin = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

    //CHECK IF SUPERADMIN EXISTS

    const superAdminExists = await User.findOne({role:"SuperAdmin"});
    if(superAdminExists){
        console.log("SuperAdmin already exists");
    }
    else{
        // Create SuperAdmin
        const hashPassword = await bcrypt.hash("SuperAdmin123",10);
        const superAdmin = new User({
            name: "SuperAdmin",
            email:"Superadmin@gmail.com",
            gender: "Male",
            phone: "08000000000",
            password: hashPassword,
            role:"SuperAdmin",
            hasAdminAccess:true
        })
        await superAdmin.save();
        console.log("SuperAdmin created successfully");
        console.log("Email: Superadmin@gmail.com");
        console.log("Password: SuperAdmin123");
        process.exit(0);
    }
    }catch(error){
        console.error("Error seeding SuperAdmin:", error);
    }
};


seedSuperAdmin();