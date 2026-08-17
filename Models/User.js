const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

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
    profilePic:{
        type : String,
        required:false
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
},
{timestamps: true},//date created and updated
);
//model

const user = mongoose.model('user',userSchema)

module.exports = user;// export user
