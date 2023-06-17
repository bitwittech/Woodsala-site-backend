const { json } = require("body-parser");
const user = require("../../database/models/user");

exports.setAddress = async (req, res) => {
  try {
    let {
      DID,
      CID,
      customer_name,
      address,
      pincode,
      mobile,
      city,
      state,
      type,
      email,
    } = req.body;

    if (!CID && !DID)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide the valid ID." });
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

    let check = null;

    if (CID) check = await user.findOne({ CID }, { address: 1 });
    else check = await user.findOne({ DID }, { address: 1 });

    if (!check && CID)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide the valid ID." });

    if (CID)
      check = await user.findOneAndUpdate(
        { CID },
        {
          address: [
            ...check.address,
            {
              customer_name,
              address,
              pincode,
              mobile,
              city,
              state,
              type,
              email,
            },
          ],
        }
      );
    else {
      if (!check)
        check = await user.findOneAndUpdate(
          { DID },
          {
            DID,
            register_time: Date.now(),
            username: customer_name,
            mobile,
            email,
            address: [
              {
                customer_name,
                address,
                pincode,
                mobile,
                city,
                state,
                type,
                email,
              },
            ],
          },
          { upsert: true, new: true }
        );
      else
        check = await user.findOneAndUpdate(
          { DID },
          {
            address: [
              ...check.address,
              {
                customer_name,
                address,
                pincode,
                mobile,
                city,
                state,
                type,
                email,
              },
            ],
          },
          { upsert: true, new: true }
        );
    }

    if (check)
      return res
        .status(200)
        .send({ status: 200, message: "Address added successfully." });
    else
      return res
        .status(203)
        .send({ status: 203, message: "Facing error while adding address." });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ status: 500, message: "Something went wrong." });
  }
};

exports.getAddress = async (req, res) => {
  try {
    let { CID, DID } = req.query;

    if (!CID && !DID)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide a valid ID." });

    let data = await user.findOne(
      { $or: [{ CID }, { DID }] },
      {
        address: 1,
      }
    );

    if (data)
      return res.send({
        status: 200,
        message: "Customer details fetched successfully.",
        data,
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No customer found.",
        data: [],
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};
