const { default: mongoose } = require("mongoose");

const guest = mongoose.Schema({
  DID: { type: String, default : ""},
  register_time: { type: Date, default: Date.now },
  profile_image: { type: String },
  username: { type: String },
  mobile: { type: Number },
  email: { type: String },
  password: { type: String },
  classification: { type: String, default : 'personal' },
  customer_type: { type: String, default : '' },
  address: { type: Array },
});

module.exports = mongoose.model("guest", guest);