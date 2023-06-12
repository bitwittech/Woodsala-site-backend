require("dotenv").config();

const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");


// middleware For Authentication

exports.AuthJwt = (req, res, next)=> {
    // async (req,res)(req.headers)
  
    if (req.headers.authorization === undefined) return res.sendStatus(401);
  
    let token = req.headers.authorization.split("Bearer ")[1];
  
    JWT.verify(token, process.env.JWT_Secrete, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  }
  

  // middleware for encryption
exports.encode=(req, res, next)=> {
    const saltRounds = 10;
  
    if (
      req.body.username == undefined ||
      req.body.mobile == undefined ||
      req.body.email == undefined ||
      req.body.password == undefined
    )
      return res
        .status(204)
        .send({ error_massage: "Please enter all the required felids." });
  
    // code to hash the password
  
    bcrypt.genSalt(saltRounds, (err, salt) => {
      bcrypt.hash(req.body.password, salt, function (err, hash) {
        // async (req,res)(">>>>>", hash);
        if (hash !== null) {
          req.body.password = hash;
          next();
        }
      });
    });
  }