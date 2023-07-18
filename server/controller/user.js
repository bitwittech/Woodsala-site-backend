// packages
require("dotenv").config();
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const sdk = require("api")("@servetel/v1.0#14z732fkuc911ee");

// DB modules
const userDB = require("../../database/models/user");
// const { env } = require("process");


// crypt
const Crypt = require("cryptr");
const crypt = new Crypt(process.env.PASS_Secrete);
// ================================================= Apis for User =======================================================
//==============================================================================================================================

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

// for defaulting paging
exports.home = (req, res) => {
  res.send("This Apis is written for the WoodSala!!!");
};

// place an customer

exports.register = async (req, res) => {
  try {
    let { email, mobile, password } = req.body;

    if (!email || !mobile || !password)
      return res.status(203).send({
        status: 203,
        message: "Missing payload !!!",
      });

    // check for the duplicate entries
    let count = await userDB.find({$or : [{email},{mobile}]}).count()

    if(count > 0)
    return res.status(203).send({
      status : 203,
      message : "Duplicate entry detected !!!"
    })
    let data = userDB({ ...req.body, CID: `CID-${uuidv4()}` });

    let response = await data.save(req.body);

    if (response)
      return res.status(200).send({
        status: 200,
        message: "Customer registered successfully.",
        data: { email: response.email, password: req.body.repassword },
      });
    else
      return res.status(200).send({
        status: 200,
        message: "Facing an issue while adding the customer.",
        data: {},
      });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      status: 500,
      message: "Something went wrong !!!",
    });
  }
};

// function for generate JWT

function generateJWT(data) {
  const token = JWT.sign(data, process.env.JWT_Secrete);
  return token;
}

// login
exports.login = async (req, res) => {
  try {
    console.log(req.body)

    let { email, password } = req.body;

    if (!email || !password)
      return res.status(203).send({
        status: 203,
        message: "Missing payload.",
      });

    let data = await userDB.findOne(
      { email: email.toLowerCase() },
      { _id: 0, username: 1, email: 1, CID: 1, DID: 1, password: 1 }
    );
    if (data) {
      let pass = crypt.decrypt(data.password);
        check(pass === password, data, res)
    } else {
      return res.status(203).send({
        status: 203,
        message: "User Not Found !!!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Something went wrong.",
    });
  }
};

// check the password is correct or not

function check(result, userData, res) {
  if (result) {
    let token = generateJWT(userData.toJSON());
    return res.send({
      status: 200,
      message: "Log In Successfully.",
      data: {
        token,
        name: userData.username,
        email: userData.email,
        CID: userData.CID,
        DID: userData.DID,
      },
    });
  } else
    return res.status(203).send({
      status: 203,
      message: "Incorrect credentials !!!",
    });
}

// get customer
exports.getCustomer = async (req, res) => {
  userDB
    .findOne({ CID: req.query.CID }, { _id: 0, password: 0 })
    .then((data) => {
      //// console.log(data)
      return res.status(200).send(data);
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).send(err);
    });
};

// get customer's addresses
exports.getCustomerAddress = async (req, res) => {
  try {
    let data = await userDB.findOne(
      { CID: req.query.CID },
      {
        CID: 0,
        register_time: 0,
        profile_image: 0,
        username: 0,
        mobile: 0,
        email: 0,
        password: 0,
        shipping: 0,
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
    console.log(err);
    return res.status(404).send(err);
  }
};

// update Customer
exports.updateCustomer = async (req, res) => {
  //// console.log('FILES >>> ',req.files)
  //// console.log('Body >>> ',req.body)
  userDB
    .updateOne({ CID: req.body.CID }, req.body)
    .then((response) => {
      res.send("Changes Saved !!!");
    })
    .catch((err) => {
      //// console.log(err)
      res.send(422).send({ message: "Something went wrong !!!" });
    });
};

// route for send Verification Link
exports.sendVerificationLink = async (req, res) => {
  try {
    // making a token from userData in the form of token and verify
    const token = generateJWT(req.body);

    let regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

    let { email, password, mobile } = req.body;

    if (!email || email === "" || !regex.test(email))
      return res.status(203).send({
        status: 203,
        message: "Provided email is not appropriate or missing in payload.",
      });

    if (!password || password === "")
      return res.status(203).send({
        status: 203,
        message: "Please provide the password in payload.",
      });
    
    let checkTheEmail = await userDB.find({$or : [{email},{mobile}]}).count()

    if(checkTheEmail > 0)
    return res.status(203).send({
      status: 203,
      message: `Provided email (${email}) or mobile (${mobile}) number is already registered.`
    });

    // send mail with defined transport object
    let check = await transporter.sendMail({
      from: "woodshala@gmail.com", // sender address
      to: `${email}`, // list of receivers
      subject: "Verification Link from woodshala !!!", // Subject line
      text: "Hello world?", // plain text body
      html: `<h1>Thanks for choosing us !!!</h1>
        // <img alt = 'WoodshalaLogo' src = 'https://woodshala.in/static/media/logo.9d42e1087b29884ef99f.webp' width = '200px'/>
        <p>Hello ${req.body.username}, please <a href = ${
        process.env.OFFICIAL_URL + token
      }>click here</a> to login Woodshala.</p>
        <h5>Note :- This link is valid for one time use only.</h5>
        `, // html body
    });

    if (check)
      return res
        .status(200)
        .send({ status: 200, message: "Verification mail has been sent !!! " });
    else
      return res.status(203).send({
        status: 203,
        message: "Facing an issue while sending the mail.",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Something went wrong.",
    });
  }
};

exports.verify = async (req, res) => {
  try {
    let {token} = req.query;

    if(!token)
    return res.status(203).send({
      status : 203,
      message : "Please provide the token."
    })

    JWT.verify(token, process.env.JWT_Secrete, (err, user) => {
      // console.log(user)
      if (err) return res.status(203).send({ status : 203, message: "False Token" });

      return res.status(200).send({
        status : 200,
        message : "Token verified successfully.",
        data : user
      });
    });
  } catch (error) {
    console.log(error)
    return res.status(500).send({
      status : 500,
      message : "Token verification failed.",
      data : {}
    });
  }
  
};

exports.captcha = async (req, res) => {
  try {
    let { response, key } = JSON.parse(req.query.response);

    request(verificationURL, function (error, response, body) {
      body = JSON.parse(body);

      if (body.success !== undefined && !body.success) {
        return res.json({ responseError: "Failed captcha verification" });
      }
      res.json({ responseSuccess: "Sucess" });
    });
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
};

exports.masterCheckIn = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password)
      res.status(203).send("Please provide Credential !!!");

    let user = { master: "master@woodhshala.com", password: "master@2023" };

    if (user.master === email && user.password === user.password) {
      let masterToken = generateJWT({ email, password });

      return res.send({ message: "Welcome Master", masterToken: masterToken });
    } else {
      return res
        .status(403)
        .send({ message: "You are not allowed to access it." });
    }
  } catch (err) {
    console.log(err);
    return res.sendStatus(500);
  }
};

// userList()
async function userList() {
  let data = await userDB.find({});
  console.log(data);
}

// ================================================= Apis for User Ends =======================================================
