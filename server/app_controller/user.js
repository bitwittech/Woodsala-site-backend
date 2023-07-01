const { json } = require("body-parser");
const user = require("../../database/models/user");
const guest = require("../../database/models/guest");
const { v4: uuidV4 } = require("uuid");

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

    let id = Math.random().toString(36).slice(2);

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

    let query = {};
    let check = null;

    if (CID) {
      query = { CID: String(CID) };
      check = await user.findOne(query, { address: 1 });
    } else {
      query = { DID: String(DID) };
      check = await guest.findOne(query, { address: 1 });
    }

    // console.log(check)
    if (!check && CID)
      return res
        .status(203)
        .send({ status: 203, message: "Please provide the valid ID." });

    // this will add the address against registered customer
    if (CID)
      check = await user.findOneAndUpdate(
        { CID: String(CID) },
        {
          address: [
            ...check.address,
            {
              id,
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
    else if (DID) {
      if (!check) {
        // this will create a new customer based on DID with new CID
        check = await guest.findOneAndUpdate(
          { DID: String(DID) },
          {
            DID,
            register_time: Date.now(),
            username: customer_name,
            mobile,
            email,
            address: [
              {
                id,
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
      } else {
        // this will save the data against the DID
        check = await guest.findOneAndUpdate(
          { DID: String(DID) },
          {
            address: [
              ...check.address,
              {
                id,
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

    if (CID) query = { CID: String(CID) };
    else query = { DID: String(DID) };

    let data;
    if (CID)
      data = await user.findOne(query, {
        address: 1,
        CID: 1,
      });
    else if (DID)
      data = await guest.findOne(query, {
        address: 1,
        DID: 1,
      });

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

exports.getCustomerDetails = async (req, res) => {
  try {
    let { DID, CID } = req.query;

    if (!DID && !CID)
      return res.status(203).send({
        status: 203,
        message: "Missing ID.",
        data: {},
      });

    let data;

    if (CID)
      data = await user.findOne({CID})
    else
      data = await guest.findOne({DID})

    if (data)
      return res.status(200).send({
        status: 200,
        message: "User details fetched.",
        data,
      });
    else
      return res.status(200).send({
        status: 203,
        message: "No details found.  ",
        data: {},
      });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      status : 500,
      message : "Something went wrong."
    })
  }
};
