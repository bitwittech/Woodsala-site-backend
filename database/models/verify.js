const mongoose = require("mongoose");

const otp = mongoose.Schema({
    otp : {type : Number, require : true},
    status : {type : Boolean, default : false},
    assignTo : {type : String, require : true},
},{
    timestamps : true
});

module.exports = mongoose.model("otp", otp);
