require('dotenv').config()
const nodemailer = require("nodemailer");

// let officialURL = "https://woodshala.in";
// let localURL = "http://localhost:8000";

// transporter for sending mail

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS,
  },
});


module.exports = transporter