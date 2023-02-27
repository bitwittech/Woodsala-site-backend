const wishlist = require("../../database/models/wishlist");
const product = require("../../database/models/product");

// ==================== This file contains all the wishlist controllers ===================

exports.addWshList = async (req, res) => {
  try {
    // console.log('>>>', req.body)

    if (req.body.CID === "undefined" || req.body.CID === null)
      return res
        .status(203)
        .send({ message: "Please pass valid customer ID. " });

    // let data = wishlist(req.body);

    let data = await wishlist.findOneAndUpdate(
      { CID: req.body.CID, product_id: req.body.product_id },
      req.body,
      { upsert: true }
    );

    if (data) return res.send({ message: "Hurray, added to the Wishlist." });
    return res
      .status(203)
      .send({ message: "Facing some issues with customer ID. " });
  } catch (error) {
    console.log("Error>>>", error);
    res.status(500).send("Something went wrong !!!");
  }
};
exports.removeWshList = async (req, res) => {
  try {
    // console.log(req.query)

    if (req.query.CID === "undefined" || req.query.CID === null)
      return res
        .status(203)
        .send({ message: "Please pass valid customer ID. " });

    let data = await wishlist.findOneAndDelete({
      CID: req.query.CID,
      product_id: req.query.product_id,
    });

    if (data)
      return res.send({ message: "Hurray, item removed from Wishlist." });
    return res
      .status(203)
      .send({ message: "Facing some issues with customer ID. " });
  } catch (error) {
    console.log("Error>>>", error);
    res.status(500).send("Something went wrong !!!");
  }
};
exports.getWishedProduct = async (req, res) => {
  try {
    // console.log(req.query)
    let list = JSON.parse(req.query.list);
    let query = {};

    if (list.length > 0)
      query = {
        $or: [
          ...list.map((row) => {
            return { SKU: row.product_id };
          }),
        ],
      };

    // console.log(JSON.stringify(query))
    let response = await product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$_id",
          SKU: { $first: "$SKU" },
          product_title: { $first: "$product_title" },
          selling_price: { $first: "$selling_price" },
          product_image: { $first: "$product_image" },
          discount_limit: { $first: "$discount_limit" },
          product_description: { $first: "$product_description" },
        },
      },
    ]);

    if (response) {
      return res.send(response);
    }
    return res.send([]);
  } catch (err) {
    console.log("Error>>>>", err);
    res.status(500).send("Something Went Wrong !!!");
  }
};
exports.getWishList = async (req, res) => {
  try {
    // console.log(req.query)
    let response = await wishlist.find({ CID: req.query.CID }, { _id: 0 });
    // console.log(response)
    if (response) return res.send(response);
    return res.send([]);
  } catch (err) {
    console.log("error >>>> ", err);
    res.status(500).send("Something Went Wrong !!!");
  }
};
