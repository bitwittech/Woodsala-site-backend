require("dotenv").config();
const { query } = require("express");
const banner = require("../../database/models/banner");
const introBanner = require("../../database/models/introBanner");
const notification = require("../../database/models/notifications");
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

    pinCode = parseInt(pinCode);

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

// Notifications

exports.sendNotificationsMobile = async (req, res) => {
  try {
    const { title, message, token, CID } = req.body;

    if (!title || !message || !token)
      return res.send(203).status({
        status: 203,
        message: "Missing Payload.",
      });

    // Replace 'YOUR_FCM_SERVER_KEY' with your actual FCM Server Key from the Firebase Console
    const fcmServerKey = process.env.FCM_SERVER_KEY;

    const fcmEndpoint = "https://fcm.googleapis.com/fcm/send";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `key=${fcmServerKey}`,
    };
    const data = {
      to: token,
      notification: {
        title: title,
        body: message,
      },
    };

    // save the notification details in DB for Database records;
    let SaveToDB = notification({
      DID: token,
      CID: CID,
      message,
      title,
    });

    // let SendToDevice = await axios.post(fcmEndpoint, data, { headers });

    SaveToDB = await SaveToDB.save();
      if (SaveToDB) {
        console.log("Push notification sent successfully:");
        return res
          .status(200)
          .send({
            status: 200,
            message: "Push notification sent successfully",
          });
      }

    // the notification to the Firebase then mobile
    // if (SendToDevice) {
    //   SaveToDB = await SaveToDB.save();
    //   if (SaveToDB) {
    //     console.log("Push notification sent successfully:", response.data);
    //     return res
    //       .status(200)
    //       .send({
    //         status: 200,
    //         message: "Push notification sent successfully",
    //       });
    //   }
    // }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Something Went Wrong.",
    });
  }
};

exports.listNotificationsMobile = async (req, res) => {
  try {
    const { token, CID,limit,pageNumber } = req.query;

    if ((!token && !CID))
      return res.status(203).send({
        status: 203,
        message: "Missing Payload.",
      });

      let query = {DID : token}

      if(CID)
      query = {CID}

    // save the notification details in DB for Database records;
    let list = await notification.find(query).sort({createdAt : -1})
    .skip(pageNumber > 0 ? (pageNumber - 1) * (parseInt(limit) || 10) : 0).limit(parseInt(limit)|| 5);

      if (list) {
        return res
          .status(200)
          .send({
            status: 200,
            message: "Push notification listed successfully",
            data : list
          });
      }

  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Something Went Wrong.",
    });
  }
};
