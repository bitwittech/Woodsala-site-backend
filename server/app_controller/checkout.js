let cart = require("../../database/models/cart");
let order = require("../../database/models/order");
let product = require("../../database/models/product");

exports.getOrders = async (req, res) => {
  try {
    let { CID, DID, pageNumber, limit } = req.query;

    if (!CID && !DID)
      return res
        .status(203)
        .send({ status: 203, message: "Missing payload !!!", data: [] });

    let query = {};

    if (CID) query = { CID: String(CID) };
    else query = { DID: String(DID) };

    let data = await order.aggregate([
      {
        $match: {
          $and: [
            query,
            { CID: { $ne: "Not Registered" } },
            { CID: { $ne: "Not Logged In" } },
            { CID: { $ne: "" } },
          ],
        },
      },
      {
        $project: {
          O: 1,
          order_time: 1,
          CID: 1,
          quantity: 1,
          subTotal: 1,
          discount: 1,
          total: 1,
        },
      },
      { $skip: pageNumber > 0 ? (pageNumber - 1) * 10 : 0 },
      { $limit: parseInt(limit) || 5 },
    ]);

    let finalData = [];
    // fetch the product details
    data = await Promise.allSettled(
      data.map(async (row) => {
        let products = Object.keys(row.quantity);

        let data = await product.find(
          { SKU: { $in: [...products] } },
          {
            product_title: 1,
            SKU: 1,
            selling_price: 1,
            product_image: 1,
            featured_image: 1,
          }
        );

        data = data.map((prod) => ({
          ...prod._doc,
          quantity: row.quantity[prod.SKU],
        }));

        delete row.quantity;

        row.product = data;

        return row;
      })
    );

    data = data.map((row) => {
      delete row.status;
      return row.value;
    });

    if (data)
      return res.status(200).send({
        status: 200,
        message: "Order list fetched successfully.",
        data,
      });
    else
      return res.status(203).send({
        status: 203,
        message: "Look like order bucket is empty.",
        data,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Something went wrong !!!",
    });
  }
};
