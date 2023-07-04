const mongoose = require("mongoose");

const review = mongoose.Schema({
  CID: { type: String, default  : "" },
  product_id: { type: String },
  rating: { type: String },
  review: { type: String, default: "" },
  review_title: { type: String },
  review_images: { type: Array, default: [] },
  review_videos: { type: Array, default: [] },
  admin_reply: { type: String, default: "" },
  yourTube_url: { type: String },
  reviewer_name: { type: String },
  reviewer_email: { type: String },
  hide: { type: Boolean, default: true },
  date: { type: Date, default: Date.now() },
},{timestamps : true});

module.exports = mongoose.model("review", review);
