const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");

//create a User

exports.createUser = async (req,res)=>{
    try{
        const {name,email,password,gender,phone,role,hasAdminAccess } = req.body;
        //check for required fields
        if(!name||!email||!password||!gender||!phone||!role){
            return res.status(400).json({
                message : "Please input required field"
            });
        }
          // Allowed roles
        const allowedRoles = [
            "User",
            "StoreKeeper",
            "Cashier",
            "Admin",
            "SuperAdmin"
        ];

        // Check if requested role is valid
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role specified"
            });
        }

        // Admin cannot create Admin or SuperAdmin
        const adminAllowedRoles = [
            "User",
            "StoreKeeper",
            "Cashier"
        ];

        if (
            req.user.role === "Admin" &&
            !adminAllowedRoles.includes(role)
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin cannot create this role"
            });
        }
        //email Check if it unique
        const existingEmail = await User.findOne({email});
        if (existingEmail){
            return res.status(400).json({
                message:"email already in use"
            });
        }
        //check for phone number
        const existingPhone = await User.findOne({phone});
        if(existingPhone){
            return res.status(400).json({
                message : "phone number already exist"
            });
        }
        //encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10);
        // creating new user

        const user = new User ({
            name,
            email,
            password: hashedPassword,
            gender,
            phone,
            profilePic: req.file ? req.file.path : undefined,
            role: role || "user",
            hasAdminAccess : hasAdminAccess ?? false

        })
        await user.save();
        res.status(200).json({
            success:true,
            message: "User created successfully",user
        });
    }catch(error){
        res.status(500).json({
            message:"error creating user",
            error:error.message
        })
    }
}
//public route for create user
exports.registerUser = async (req,res)=>{
    try{
        const {name,email,password,gender,phone,role,hasAdminAccess } = req.body;
        //check for required fields
        if(!name||!email||!password||!gender||!phone||!role){
            return res.status(400).json({
                message : "Please input required field"
            });
        }
        //email Check if it unique
        const existingEmail = await User.findOne({email});
        if (existingEmail){
            return res.status(400).json({
                message:"email already in use"
            });
        }
        //check for phone number
        const existingPhone = await User.findOne({phone});
        if(existingPhone){
            return res.status(400).json({
                message : "phone number already exist"
            });
        }
        //encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10);
        // creating new user

        const user = new User ({
            name,
            email,
            password: hashedPassword,
            gender,
            phone,
            profilePic: req.file ? req.file.path : undefined,
            role:"user",
            hasAdminAccess :false

        })
        await user.save();
        res.status(200).json({
            success:true,
            message: "User created successfully",user
        });
    }catch(error){
        res.status(500).json({
            message:"error creating user",
            error:error.message
        })
    }
}

//login User
exports.loginUser = async (req, res)=>{
    try{
        const {email,password} = req.body;

        //check required fields
        if(!email||!password){
            return res.status(400).json({
                success: false,
                message: "Please input email and Password"
            });
        }
        //check if user exist
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                success: false,
                message : "User not found"
            });
        }
        //Password Comparison
        const passwordIsMatch = await bcrypt.compare(password, user.password);
        if(!passwordIsMatch){
            return res.status(401).json({
                success:false,
                message: "Password Incorrect"
            })
        }
        //generate JWT 
        const token = jwt.sign({
            id:user._id,
            email:user.email,
            role:user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
        );
        //password removal response
         const {password: _, ...userData } = user.toObject();

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: userData
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: "Error logging in",
            error: error.message
        });
    }
}
exports.updateUserProfile = async (req, res) =>{
    try{
        const userId = req.params.id;
        const {name,email,gender,phone,profilePic} = req.body;
        
        const user = await User.findByIdAndUpdate(userId,{name,email,gender,phone,profilePic},{new:true,runValidators:true}).select("-password");
        if(!user){
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            user
        });
    }catch(error){
        res.status(500).json({
            success: false,
            message: "Error updating user profile",
            error: error.message
        });
    }
}