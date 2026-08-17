const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ms = require("ms");
const crypto = require("crypto");
const User = require("../Models/User");
const RefreshToken = require("../Models/refreshToken");
const {
    refreshTokenRotationService
} = require("../Services/refreshTokenRotationService");


const {
    generateToken,
    generateRefreshToken,
    hashRefreshToken
} = require("../Services/refreshTokenService");

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
        const token = generateToken(user);
        // Generate Refresh Token
        const newRefreshToken = generateRefreshToken();
        // Save refresh token to database
        const tokenHash = hashRefreshToken(newRefreshToken);
        //expires in
        const expiresAt = new Date(Date.now() + ms(process.env.JWT_REFRESH_EXPIRES_IN ));
        //Save token to database
        await RefreshToken.create({
            userId: user._id,
            tokenHash: tokenHash,
            expiresAt: expiresAt
        });
        //cookie refresh 
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
            maxAge: ms(process.env.JWT_REFRESH_EXPIRES_IN)
         });
        //password removal response
         const {password: _,
            refreshToken,
             ...userData 
            } = user.toObject();

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
exports.refreshToken = async (req, res) => {
    try {

        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const tokenHash = hashRefreshToken(refreshToken);

        const storedToken = await RefreshToken.findOne({
            tokenHash: tokenHash
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        if (storedToken.expiresAt < new Date()) {

            await RefreshToken.deleteOne({
                _id: storedToken._id
            });

            return res.status(401).json({
                success: false,
                message: "Refresh token expired"
            });
        }

        const user = await User.findById(
            storedToken.userId
        );
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const accessToken = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Access token refreshed",
            accessToken
        });

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token"
        });
    }
};
exports.logOutUser = async (req, res) => {
    try {

        // Get refresh token from cookie
        const { refreshToken } = req.cookies;

        if (refreshToken) {

            // Hash refresh token
            const tokenHash = hashRefreshToken(
                refreshToken
            );

            // Delete matching token from database
            await RefreshToken.deleteOne({
                tokenHash: tokenHash
            });
        }

        // Clear refresh token cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,

            secure: process.env.NODE_ENV === "production",

            sameSite: process.env.NODE_ENV === "production"
                ? "none"
                : "lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: "Error logging out",
            error: error.message
        });
    }
};