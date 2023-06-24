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

    let check = null;

    if (CID) check = await user.findOne({ CID : String(CID) }, { address: 1 });
    else check = await user.findOne({ DID }, { address: 1 });

    
    console.log(check)
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
    else {
      if (!check)
        {check = await user.find({$or:[{email},{mobile}]}).count()
        
        if(check > 0) return res.status(203).send(
          {
            status : 203,
            message : "Sorry email or mobile already exist.",
            data : []
          }
        )

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
        );}
      else
      {
        check = await user.findOneAndUpdate(
          { DID },
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

    let data = await user.findOne(
      { $and: [{ CID }, { DID }] },
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

exports.getCustomerDetails = async (req,res) =>{
  try {
    let {DID,CID} = req.query;

    if(!DID && !CID)
    return res.status(203).send({
      status :203,
      message : "Missing ID.",
      data : {}
    })

    let data = await user.findOne({CID})

    if(data)
    return res.status(200).send({
      status : 200,
      message : "User details fetched.",
      data
    })
    else
    return res.status(200).send({
      status : 203,
      message : "No details found.  ",
      data : {}
    })
  } catch (error) {
    
  }
}