let cart = require("../../database/models/cart");
let order = require("../../database/models/order");

exports.getOrders = async (req, res) => {
  try {
    let { CID, DID, pageNumber , limit} = req.query;

    if (!CID && !DID)
      return res
        .status(203)
        .send({ status: 203, message: "Missing payload !!!", data : [] });

    let data = await order.aggregate([
      {
        $match: {
          $and: [
            { $and: [{ CID }, { DID }] },
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
    return res.status(500).send({
      status: 500,
      message: "Something went wrong !!!",
    });
  }
};
