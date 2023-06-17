const { default: mongoose } = require("mongoose");

const wishlist = mongoose.Schema({
  CID: { type: String, default: "" },
  product_id: { type: String },
  quantity: { type: Number },
  DID: { type: String, default: "" },
});

module.exports = mongoose.model("wishlist", wishlist);
