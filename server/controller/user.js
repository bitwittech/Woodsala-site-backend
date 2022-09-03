// packages 
const bcrypt = require("bcrypt");
const JWT = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// DB modules 
const userDB = require("../../database/models/user");

// ================================================= Apis for User ======================================================= 
//==============================================================================================================================



// for defaulting paging
exports.home = (req, res) => {
    res.send("This Apis is written for the WoodSala!!!");
};


// place an customer 

exports.register = async(req,res) => {   
    req.body.CID = `CID-${uuidv4()}`
    console.log(req.body);
   const data = userDB(req.body);
    await data.save(req.body)
    .then((response)=>{
       return res.status(200).send({message : 'Customer added successfully !!!'});
    })
    .catch((err)=>{
       return res.status(406).send({message : 'Duplicate entries are not allowed !!!'})
    })
}

// function for generate JWT

function generateJWT(data) {
    
    const token = JWT.sign(data,process.env.JWT_Secrete);
    return token;
}

// login
exports.login = (req, res) => {

    console.log(req.body)
    if (req.body.email === undefined || req.body.password === undefined) return res.status(203).send('Please provides the vaild data')

    userDB
        .findOne({ email: req.body.email })
        .then((data) => {
            console.log(data)
            if (data != null) {
                bcrypt.compare(req.body.password, data.password, function(err, result) {
                    console.log(err,result)
                    if (result === true) {
                        let token = generateJWT(req.body);
                        console.log(data)
                        console.log("User Found !!!", data);
                        return res.send({ message: "Log In Successfully !!!", token, name: data.username, email: data.email, CID : data.CID })

                    } else
                        return res.status(203).send({ message: "User Not Found !!!" })
                });
            } else {
                return res.status(203).send({ message: "User Not Found !!!" })
            }
        })
        .catch((err) => {
            console.log({ message: "User Not Found !!!", err });
            return res.status(203).send({ message: "User Not Found !!!", err })
        })

}

// get customer
exports.getCustomer = (req,res) =>{
    userDB.findOne({CID : req.query.CID})
    .then((data)=>{
        // console.log(data)
        return res.status(200).send(data)
    })
    .catch((err)=>{
        console.log(err)
        return res.status(404).send(err)
    })

}

// update Customer
exports.updateCustomer = (req,res) =>{
    console.log('FILES >>> ',req.files)
    console.log('Body >>> ',req.body)
    userDB.updateOne({CID : req.body.CID},req.body)
    .then((response)=>{
        res.send('Changes Saved !!!')
    })
    .catch((err)=>{
        console.log(err)
        res.send(422).send({message : 'Something went wrong !!!'})
    })

}

// ================================================= Apis for User Ends =======================================================