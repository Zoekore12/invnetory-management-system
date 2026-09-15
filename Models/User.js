const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    gender: {
        type:String,
        required:true
    },
    phone:{
        type : String,
        required: true,
        unique: true
    },
    hasAdminAccess :{
        type : Boolean,
        default :false
    },
    role:{
        type:String,
        enum:["SuperAdmin","User","StoreKeeper","Admin","Cashier"],
        default:"User"
    },
     profilePic: {
            url: {
                type: String,
                default: null
            },

            publicId: {
                type: String,
                default: null
            }
    },
    emailVerified: {
    type: Boolean,
    default: false
    },

    emailVerificationCode: {
    type: String,
    default: null
    },

    emailVerificationExpires: {
    type: Date,
    default: null
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
},
{timestamps: true},//date created and updated
);
//model


module.exports =
    mongoose.models.user ||
    mongoose.model("user", userSchema);// export user
