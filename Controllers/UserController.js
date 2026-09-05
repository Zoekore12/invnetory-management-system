const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ms = require("ms");
const crypto = require("crypto");
const User = require("../Models/User");
const RefreshToken = require("../Models/refreshToken");
const {
    refreshAccessToken
} = require("../Services/refreshTokenRotationService");

const  logActivity  = require("./activityController");

const {sendEmailVerificationCode} = require('../Services/emailService');

const {
    uploadImageToCloudinary,
    deleteImageFromCloudinary
} = require('../Services/cloudinaryService')

const {
    generateToken,
    generateRefreshToken,
    hashRefreshToken
} = require("../Services/refreshTokenService");

//create User
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

        //upload profile pic
        let profilePic = {
                url: null,
                publicId: null
            };
        if (req.file){
                const result = await uploadImageToCloudinary(
            req.file,
            "inventory-users"
            );
            profilePic = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }
        
        const user = new User ({
            name,
            email,
            password: hashedPassword,
            gender,
            phone,
            role: role || "user",
            profilePic,
            hasAdminAccess : hasAdminAccess ?? false,
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationExpires: null

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
        const {name,email,password,gender,phone } = req.body;
        //check for required fields
        if(!name||!email||!password||!gender||!phone){
            return res.status(400).json({
                message : "Please input required field"
            });
        }
        //require profile pic
         if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Profile picture is required"
            });
        }
        //email Check if it unique
        const existingEmail = await User.findOne({email});
        if(existingEmail){
            //Email already verified
            if (existingEmail.emailVerified){
                return res.status(400).json({
                    success: false,
                    message:"email already in use"
                });
            }
            //Email belongs to unverified user, resend verification code
            const vCode = crypto.randomInt(100000, 1000000).toString();
            existingEmail.emailVerificationCode = vCode;
            existingEmail.emailVerificationExpires = new Date(Date.now() + 5 * 60 * 1000);
            await existingEmail.save();
            console.log("Existing unverified user found, verification code resent",vCode);
            try {
                await sendEmailVerificationCode(existingEmail.email, vCode);
                return res.status(200).json({
                    success: true,
                    message: "A new verification code has been sent to your email. Please verify your email to complete registration."
                });
            } catch (emailError) {
                console.error("EMAIL ERROR:", emailError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to send verification email"
                });
            }

        }
        //check for phone number
        const existingPhone = await User.findOne({phone});
        if(existingPhone){
            return res.status(400).json({
                success: false,
                message : "phone number already exist"
            });
        }
        //encrypt Password
        const hashedPassword = await bcrypt.hash(password, 10);
        //generating code for email
         const vCode =
            crypto.randomInt(100000, 1000000).toString();
         console.log("5. Verification code generated");

        // registering new user
        const user = new User ({
            name,
            email,
            password: hashedPassword,
            gender,
            phone,
            role:"User",
            hasAdminAccess :false,
            emailVerified: false,
            emailVerificationCode:vCode,
            emailVerificationExpires:
                new Date(
                    Date.now() + 5 * 60 * 1000
                )

        })
        //upload profile Pic
        if (req.file) {
                    const result = await uploadImageToCloudinary(
                        req.file,
                        "inventory-users"
                    );
                console.log("6. Cloudinary upload completed");
                    user.profilePic = {
                        url: result.secure_url,
                        publicId: result.public_id
                    };
                }
        

        await user.save();
            
        console.log("User saved successfully:", user.email);
        console.log("Verification code:", vCode);

        // Send verification email
        try {
            console.log("Sending verification email to:", email);

            await sendEmailVerificationCode(email, vCode);

            console.log("Verification email sent successfully");

        } catch (emailError) {

            console.error("EMAIL ERROR:", emailError);

            return res.status(500).json({
                success: false,
                message: "User was created but verification email could not be sent",
                error: emailError.message
            });
        }
          // SUCCESS RESPONSE
        return res.status(201).json({
            success: true,
            message: "User registered successfully. A verification code has been sent to your email."
        });

    }catch(error){
        res.status(500).json({
            message:"error registering user",
            error:error.message
        })
    }
}
//login 
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
                message : "Invalid email"
            });
        }
          //if user is active
        if (!user.isActive){
                return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
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
        //email verification
        if (
            user.role === "User" &&
            !user.emailVerified
        ) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in"
            });
        }
        user.lastLoginAt = new Date();

        //save login
        await user.save();
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
//update profile
exports.updateUserProfile = async (req, res) =>{
    try{
        const userId = req.params;
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
//token refresh
exports.refreshToken = async (req, res) => {
    try {

        // Get refresh token from cookie
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        // Use the refresh token service
        const {
            accessToken,
            newRefreshToken
        } = await refreshAccessToken(refreshToken);


        // Replace old refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,

            secure:
                process.env.NODE_ENV === "production",

            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",

            maxAge:
                ms(
                    process.env.JWT_REFRESH_EXPIRES_IN
                )
        });


        // Send new access token
        return res.status(200).json({
            success: true,
            message: "Access token refreshed",
            accessToken
        });

    } catch (error) {

        console.error(
            "Refresh token error:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                error.message ||
                "Invalid or expired refresh token"
        });
    }
}
//log out user
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
//profile picture
exports.updateProfilePicture = async (req, res) => {
    try {
        // Check if an image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a profile picture"
            });
        }

        // Find logged-in user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Delete old profile picture from Cloudinary
        if (user.profilePic?.publicId) {
            await deleteImageFromCloudinary(
                user.profilePic.publicId
            );
        }

        // Upload new profile picture
        const result = await uploadImageToCloudinary(
            req.file,
            "inventory-users"
        );

        // Save new profile picture
        user.profilePic = {
            url: result.secure_url,
            publicId: result.publicId
        };

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            profilePic: user.profilePic
        });

    } catch (error) {
        console.error("Profile picture error:", error);

        res.status(500).json({
            success: false,
            message: "Error updating profile picture",
            error: error.message
        });
    }
};
//email verification
exports.verifyEmail = async (req, res) => {
    try {

        const {
            email,
            vCode
        } = req.body;


        // Check required fields
        if (!email || !vCode) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and verification code are required"
            });
        }


        // Find user
        const user = await User.findOne({
            email
        });


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Already verified
        if (user.emailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }


        // Check if code has expired
        if (
            !user.emailVerificationExpires ||
            user.emailVerificationExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Verification code has expired"
            });
        }


        // Check code
        if (
            user.emailVerificationCode !==
            vCode
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid verification code"
            });
        }


        // Verify email
        user.emailVerified = true;

        user.emailVerificationCode = null;

        user.emailVerificationExpires = null;


        await user.save();


        res.status(200).json({
            success: true,
            message:
                "Email verified successfully"
        });

    } catch (error) {

        console.error(
            "Email verification error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Error verifying email",
            error: error.message
        });
    }
};
//activation and deactivation
exports.reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: "User account is already active"
            });
        }

        user.isActive = true;

        await logActivity({
            userId: req.user.id,
            action: "REACTIVATE_USER",
            description: `Reactivated user ${user.name}`,
            resource: "User",
            resourceId: user._id,
            data: {
                userId: user._id,
                name: user.name,
                role: user.role
            }
        });

        await user.save();


        res.status(200).json({
            success: true,
            message: "User account reactivated successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error reactivating user",
            error: error.message
        });
    }
};
exports.deactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "User account is already deactivated"
            });
        }

        user.isActive = false;

        
        await logActivity({
            userId: req.user.id,
            action: "DEACTIVATE_USER",
            description: `Deactivated user ${user.name}`,
            resource: "User",
            resourceId: user._id,
            data: {
                userId: user._id,
                name: user.name,
                role: user.role
            }
        });

        await user.save();

        res.status(200).json({
            success: true,
            message: "User account deactivated successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deactivating user",
            error: error.message
        });
    }
};