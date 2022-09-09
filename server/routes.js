const route = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require('body-parser')
const multer = require('multer')

// CONTROLLER
const user = require("./controller/user");
const product = require("./controller/product");
const cart = require("./controller/cart");


// middleware for the multer setup

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './upload/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + "_" + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    // reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/svg') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
}).fields([{ name: 'profile_image' } ]);


// middleware for encryption
function encode(req, res, next) {
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
        bcrypt.hash(req.body.password, salt, function(err, hash) {
            // console.log(">>>>>", hash);
            if (hash !== null) {
                req.body.password = hash;
                console.log(req.body.password);
                next();
            }
        });
    });
}


// middleware to parse the body 
route.use(bodyParser.urlencoded({ extended: true }));
route.use(bodyParser.json());

// middleware For Authentication

function AuthJwt(req, res, next) {
    // console.log(req.headers)

    if (req.headers.authorization === undefined) return res.sendStatus(401);

    let token = req.headers.authorization.split("Bearer ")[1];

    JWT.verify(token, "asdfijeh9oina3i432i4988*&*&(*&*()()ok5n3la^&*%*&T(bkjh9s8ew9(*H(OH**(H)OM)_(U)N)(Yn39873389(*u4054m5k4n5", (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// =============== User routes =======================

// home route
route.get("/", user.home);

// registration route
route.post("/register", encode, user.register);

// login route
route.post("/login", upload, user.login);

// get user
route.get("/getCustomer", AuthJwt, upload, user.getCustomer);

// update user
route.patch("/updateCustomer", AuthJwt, upload, user.updateCustomer);

// =================== Product routes =======================

// listing product 
route.get("/getProducts",AuthJwt,product.getProducts)

// ==================== Cart routes ==========================

// add item in cart 
route.post("/addCartItem",AuthJwt, cart.addCartItem)

// romove item from cart 
route.get("/removeCartItem",AuthJwt, cart.removeCartItem)

// get item in cart 
route.get("/getCartItem", cart.getCartItem)

// get item details in cart 
route.get("/getProductDetails",AuthJwt, cart.getProductDetails)

// update item details in cart 
route.patch("/updateQuantity",AuthJwt, cart.updateQuantity)

module.exports = route;