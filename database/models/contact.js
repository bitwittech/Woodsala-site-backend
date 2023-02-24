const { default: mongoose } = require("mongoose");

const contact = mongoose.Schema({
  reason: { type: String },
  order_no: { type: String },
  customer_name: { type: String },
  email: { type: String },
  mobile_no: { type: Number },
  message: { type: String },
  images: { type: Array, default: [] },
});

module.exports = mongoose.model("contact", contact);
