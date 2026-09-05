const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    name:   {
        type : String,
        required: true
    },
    size :{
        type : String,
        required: true
    },
    image :[
        {
            url : {
                type : String,
                default: null
            },
            publicId : {
                type: String,
                default: null
            }
        }
        ],
    description :{
        type : String,
        required: true
    },
    price :{
            type : Number,
            required : true
    },
    quantity:{
        type : Number,
        required: true,
    },
},
{
timestamps: true //Date created and updated
})

//model
const product = mongoose.model('product',productSchema)

module.exports = product;//export product module