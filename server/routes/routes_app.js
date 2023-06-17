// CONTROLLERS
const product = require("../app_controller/product");
const user = require("../app_controller/user");
const cart = require("../app_controller/cart");
const utility = require("../app_controller/utility");
const { AuthJwt } = require("../middleware/auth");
const { upload } = require("../middleware/url_encode");

require("dotenv").config();
const route = require("express").Router();

// for product
route.get("/getProducts",product.getProduct);
route.get("/getProductDetails",product.getProductDetails);
route.get("/fetchVariants",product.fetchVariants);
route.get("/getCategories",product.listCategories);

// banner
route.get("/getBanner",utility.getBanner);
route.get("/listMobileIntro",utility.listMobileIntro);

//product slider trending adn etc 
route.get("/getCatalog",product.listCatalog);

// set address 
route.patch("/setAddress",AuthJwt,upload,user.setAddress)

// cart

route.post("/addToCart",upload,cart.addCartItem)
route.delete("/removeCartItem",upload,cart.removeCartItem)
route.get("/getCartItem",cart.getCartItem)

// wishlist

route.post("/addToWishlist",upload,cart.addWishlistItem)
route.delete("/removeWishlistItem",upload,cart.removeWishlistItem)
route.get("/getWishlistItem",cart.getWishlistItem)

// checkout 
route.get("/calculate",utility.calculate)

module.exports = route 