const { default: mongoose } = require("mongoose");

const cart = mongoose.Schema({
   CID : {type: String},
   product_id : {type : String},
   quantity : {type : Number}  
})

module.exports = mongoose.model('cart',cart);