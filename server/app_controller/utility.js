require("dotenv").config();
const banner = require("../../database/models/banner");
const introBanner = require("../../database/models/introBanner");
const pincode = require("../../database/models/pincode");
const axios = require("axios");

exports.getBanner = async (req, res) => {
  try {
    let response = await banner.find(
      { web_banner_status: true },
      { web_banner: 1 }
    );
    let bannerArr = response.sort((a, b) => a.sequence_no - b.sequence_no);

    if (response)
      return res.send({
        status: 200,
        message: "Banner List fetched successfully",
        data: {
          first: [...bannerArr],
          second: [...bannerArr],
        },
      });
    else
      return res.send({
        status: 203,
        message: "No banners found.",
        data: {
          first: [],
          second: [],
        },
      });
  } catch (error) {
    console.log("Error>>", error);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};
exports.listMobileIntro = async (req, res) => {
  try {
    let data = await introBanner
      .find(
        { status: true },
        {
          title: 0,
          status: 0,
          __v: 0,
        }
      )
      .limit(10);

    if (data)
      return res.send({
        status: 200,
        message: "Intro banner for mobile fetched successfully.",
        data,
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No banners found for mobile .",
        data,
      });
  } catch (err) {
    // console.log("error>>>", err);
    return res.status(500).send({ message: "Something went wrang !!!" });
  }
};

exports.getPinCode = async (req, res) => {
  try {
    let { pinCode } = req.query;

    if (!pinCode)
      return res.status(203).send({
        status: 203,
        message: "Please provide the pin code.",
        data: {
          pincodeStatus: {},
          pinCodeAddress: {},
        },
      });

    pinCode = parseInt(pinCode) 

    const data = await pincode.findOne(
      {
        pincode: parseInt(pinCode),
        delivery_status: true,
      },
      { pincode: 1, delivery_status: 1, _id: 0 }
    );

    if (data === {})
      return res.status(200).send({
        status: "200",
        message: "Sorry, delivery is not possible on this pincode.",
        data: {
          pincodeStatus: {},
          pinCodeAddress: {},
        },
      });

    let pinData = await axios.get(
      `https://app.zipcodebase.com/api/v1/search?apikey=${process.env.PINCODE}&codes=${pinCode}`
    );

    if (pinData.status !== 200) pinData = {};
    else pinData = pinData.data.results[pinCode][0];

    if (data)
      return res.send({
        status: 200,
        message: "Pincode Details fetched successfully.",
        data: {
          pincodeStatus: data,
          pinCodeAddress: {
            postal_code: pinData.postal_code,
            country_code: pinData.country_code,
            state: pinData.state,
            province: pinData.province,
          },
        },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No Pincode found.",
        data,
      });
  } catch (err) {
    console.log("error>>>", err);
    return res.status(500).send({ message: "Something went wrang !!!" });
  }
};
