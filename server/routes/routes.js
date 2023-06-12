const route = require("express").Router();

// Middlewares
const {AuthJwt,encode} = require("../middleware/auth")
const {upload} = require("../middleware/url_encode.js")

// CONTROLLER
const user = require(".././controller/user");
const product = require(".././controller/product");
const cart = require(".././controller/cart");
const wishlist = require(".././controller/wishlist");
const blog = require(".././controller/blog");
const contact = require(".././controller/contact");
const  utility  = require(".././controller/utility");


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

route.get('/captcha',user.captcha)


// master check in 
route.post('/master',upload,user.masterCheckIn)


module.exports = route;
