const { default: mongoose } = require("mongoose");

const cart = mongoose.Schema({
   CID : {type: String},
   product_id : {type : String},
   quantity : {type : Number} ,
   DID : {type : String, default : ""}
})

module.exports = mongoose.model('cart',cart);