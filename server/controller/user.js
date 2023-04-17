// packages
require("dotenv").config();
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const sdk = require('api')('@servetel/v1.0#14z732fkuc911ee');

// DB modules
const userDB = require("../../database/models/user");
const { env } = require("process");

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
  req.body.CID = `CID-${uuidv4()}`;
  // console.log(req.body);
  const data = userDB(req.body);
  await data
    .save(req.body)
    .then((response) => {
      return res.status(200).send({
        message: "Customer added successfully !!!",
        data: { email: response.email, password: req.body.repassword },
      });
    })
    .catch((err) => {
      return res
        .status(406)
        .send({ message: "Duplicate entries are not allowed !!!" });
    });
};

// function for generate JWT

function generateJWT(data) {
  const token = JWT.sign(data, process.env.JWT_Secrete);
  return token;
}

// login
exports.login = async (req, res) => {
  // console.log(req.body)
  if (req.body.email === undefined || req.body.password === undefined)
    return res.status(203).send("Please provides the valid data");

  userDB
    .findOne({ email: req.body.email })
    .then((data) => {
      // console.log(data)
      if (data != null) {
        bcrypt.compare(
          req.body.password,
          data.password,
          function (err, result) {
            //// console.log(err,result)
            if (result === true) {
              let token = generateJWT(req.body);
              //// console.log(data)
              //// console.log("User Found !!!", data);
              return res.send({
                message: "Log In Successfully !!!",
                token,
                name: data.username,
                email: data.email,
                CID: data.CID,
              });
            } else
              return res.status(203).send({ message: "User Not Found !!!" });
          }
        );
      } else {
        return res.status(203).send({ message: "User Not Found !!!" });
      }
    })
    .catch((err) => {
      console.log({ message: "User Not Found !!!", err });
      return res.status(203).send({ message: "User Not Found !!!", err });
    });
};

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
  userDB
    .findOne(
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
    )
    .then((data) => {
      //// console.log(data)
      return res.status(200).send(data);
    })
    .catch((err) => {
      console.log(err);
      return res.status(404).send(err);
    });
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
  console.log(req.body);

  // making a token from userData in the form of token and verify
  const token = generateJWT(req.body);
  // send mail with defined transport object
  transporter
    .sendMail({
      from: "woodshala@gmail.com", // sender address
      to: `${req.body.email}`, // list of receivers
      subject: "Verification Link from woodshala !!!", // Subject line
      text: "Hello world?", // plain text body
      html: `<h1>Thanks for choosing us !!!</h1>
        // <img alt = 'WoodshalaLogo' src = 'https://woodshala.in/static/media/logo.9d42e1087b29884ef99f.webp' width = '200px'/>
        <p>Hello ${req.body.username}, please <a href = ${
        process.env.OFFICIAL_URL + token
      }>click here</a> to login Woodshala.</p>
        <h5>Note :- This link is valid for one time use only.</h5>
        `, // html body
    })
    .then((response) => {
      // console.log(response)
      res.status(200).send({ message: "Verification mail has been sent !!! " });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({ message: "Something went wrong !!!" });
    });
};

exports.verify = async (req, res) => {
  JWT.verify(req.query.token, process.env.JWT_Secrete, (err, user) => {
    // console.log(user)
    if (err) return res.status(403).send({ message: "False Token" });
    return res.status(200).send(user);
  });
};

exports.captcha =async(req,res)=>{

  try{
    let {response,key} = JSON.parse(req.query.response)
 

    request(verificationURL,function(error,response,body) {
      body = JSON.parse(body);
   
      if(body.success !== undefined && !body.success) {
        return res.json({"responseError" : "Failed captcha verification"});
      }
      res.json({"responseSuccess" : "Sucess"});
    });
  }catch(err){
    console.log(err)
    return res.sendStatus(500)
  }

}

exports.masterCheckIn =async(req,res)=>{

  try{ 

    let {email,password} = req.body

    if(!email || !password) res.status(203).send("Please provide Credential !!!")

    let user = {master : 'master@woodhshala.com', password : "master@2023"}
    
    if(user.master === email && user.password === user.password )
    {
      let masterToken = generateJWT({email,password});

      return res.send({message : "Welcome Master",masterToken : masterToken})
    }
    else{
      return res.status(403).send({message : "You are not allowed to access it."})
    }
  
  }catch(err){
    console.log(err)
    return res.sendStatus(500)
  }

}

// ================================================= Apis for User Ends =======================================================
