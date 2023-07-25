const mongoose = require("mongoose");

const review = mongoose.Schema({
  CID: { type: String, default  : "" },
  DID: { type: String, default  : "" },
  product_id: { type: String, default : "" },
  rating: { type: Number, default : 0 },
  review: { type: String, default: "" },
  review_title: { type: String, default : "" },
  review_images: { type: Array, default: [] },
  review_videos: { type: Array, default: [] },
  admin_reply: { type: String, default: "" },
  yourTube_url: { type: String, default : "" },
  reviewer_name: { type: String, default : "" },
  reviewer_email: { type: String, default : "" },
  hide: { type: Boolean, default: true },
  date: { type: Date, default: Date.now() },
},{timestamps : true});

module.exports = mongoose.model("review", review);
