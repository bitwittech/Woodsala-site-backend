const { default: mongoose } = require("mongoose");

const notification = mongoose.Schema(
  {
    CID: { type: String, default: "" },
    DID: { type: String, default: "" },
    title: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  {
    timestamp: true,
  }
);

module.exports = mongoose.model("notification", notification);
