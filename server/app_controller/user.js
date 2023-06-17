const { json } = require("body-parser");
const user = require("../../database/models/user");

exports.setAddress = async (req, res) => {
  try {
    let { CID, customer_name, address, pincode, mobile, city, state, type } =
      req.body;

    if (!CID)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide the valid CID." });
    if (
      !customer_name ||
      !address ||
      !pincode ||
      !mobile ||
      !city ||
      !state ||
      !type
    )
      return res.status(203).send({ status: 203, message: "Payload missing." });

    let check = await user.findOne({ CID }, { address: 1 });


    if (!check)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide the valid CID." });

        check.address = check.address.pop('')  

    check = await user.findOneAndUpdate(
      { CID },
      {
        address: [
          ...check.address,
          {customer_name, address, pincode, mobile, city, state, type},
        ],
      }
    );

    if (check)
      return res
        .status(200)
        .send({ status: 200, message: "Address added successfully." });
    else
      return res
        .status(203)
        .send({ status: 203, message: "Facing error while adding address." });
  } catch (error) {
    return res
      .status(500)
      .send({ status: 500, message: "Something went wrong." });
  }
};
