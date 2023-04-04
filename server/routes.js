require("dotenv").config();
const route = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const multer = require("multer");

// CONTROLLER
const user = require("./controller/user");
const product = require("./controller/product");
const cart = require("./controller/cart");
const wishlist = require("./controller/wishlist");
const blog = require("./controller/blog");
const contact = require("./controller/contact");
const  utility  = require("./controller/utility");

// middleware for the multer setup

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/svg" ||
    file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// for image
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: fileFilter,
}).fields([
  { name: "images" },
  { name: "profile_image" },
  { name: "review_images" },
]);

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
    bcrypt.hash(req.body.password, salt, function (err, hash) {
      // async (req,res)(">>>>>", hash);
      if (hash !== null) {
        req.body.password = hash;
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
  // async (req,res)(req.headers)

  if (req.headers.authorization === undefined) return res.sendStatus(401);

  let token = req.headers.authorization.split("Bearer ")[1];

  JWT.verify(token, process.env.JWT_Secrete, (err, user) => {
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

//  verification link route
route.post("/sendVerificationLink", upload, user.sendVerificationLink);

// verify token route
route.get("/verify", user.verify);

// login route
route.post("/login", upload, user.login);

// get user
route.get("/getCustomer", user.getCustomer);

// get user address
route.get("/getCustomerAddress", user.getCustomerAddress);

// update user
route.patch("/updateCustomer", AuthJwt, upload, user.updateCustomer);

// update user
route.get("/sendVerificationLink", user.sendVerificationLink);

// =================== Product routes =======================

// listing product
route.get("/getProducts", product.getProducts);

// get details product
route.get("/getProductDetails", product.getProductDetails);

// get getRelatedProduct
route.get("/getRelatedProduct", product.getRelatedProduct);

// get getSearchList
route.get("/getSearchList", product.getSearchList);

// add review
route.post("/addReview", upload, product.addReview);

// list Review
route.get("/listReview", product.listReview);

// list variant
route.get("/fetchVariants", product.fetchVariants);

// get coupon
route.get("/verifyCoupon", product.verifyCoupon);

// ==================== Cart routes ==========================

// add item in cart
route.post("/addCartItem", cart.addCartItem);

// remove item from cart
route.get("/removeCartItem", cart.removeCartItem);

// get item in cart
route.get("/getCartItem", cart.getCartItem);

// get item details in cart
route.get("/getDetails", cart.getDetails);

// update item details in cart
route.patch("/updateQuantity", cart.updateQuantity);

// place order
route.post("/placeOrder", upload, cart.placeOrder);

// simple Order 
route.post("/simpleOrder", upload, cart.simpleOrder);

// abandoned order
route.post("/abandonedOrder", upload, cart.placeAbandonedOrders);

// verify payment
route.post("/verifyPayment", upload, cart.verifyPayment);

// ============== Wishlist ==========

route.post("/addWshList", upload, wishlist.addWshList);

route.delete("/removeWshList", wishlist.removeWshList);

route.get("/getWishedProduct", wishlist.getWishedProduct);

route.get("/getWishList", wishlist.getWishList);

// =================== Curd for Blog  ==================

// get Blog Home
route.get("/getBlogHome", upload, blog.getBlogHome);

// getBlog description
route.get("/getBlog", upload, blog.getBlog);

// ====================== For like Blog =========================
// ==================== Review
// verify review
route.post("/verifyReview", upload, product.verifyReview);

// add reply
route.post("/addReply", upload, product.addReply);

// ============== Contact Us page

route.post("/addContact", upload, contact.addContact);

// get the banner 

route.get('/getBanner',utility.getBanner)

// get the cod 

route.get('/cod_limit',cart.cod_limit)

route.get('/sendOTP',user.sendOTP)

module.exports = route;
