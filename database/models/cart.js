const { default: mongoose } = require("mongoose");

const cart = mongoose.Schema({
   CID : {type: String, default : ""},
   product_id : {type : String},
   quantity : {type : Number, default : 1} ,
   DID : {type : String, default : ""}
})

module.exports = mongoose.model('cart',cart);