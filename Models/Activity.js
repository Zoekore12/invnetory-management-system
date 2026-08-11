const mongoose = require('mongoose');
const activitySchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required : true
    },
    action :{
        type : String,
        required : true
    },
    description :{
        type : String,
        required : true
    },
    resource :{
        type : String,
        required : true
    },
    resourceId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Resource"

    },
    data :{
        type : mongoose.Schema.Types.Mixed
    }


})
module.exports = mongoose.model("Activity", activitySchema);