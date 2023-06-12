// CONTROLLERS
const product = require("../app_controller/product");
const utility = require("../app_controller/utility");

require("dotenv").config();
const route = require("express").Router();

// for product
route.get("/getProducts",product.getProduct);
route.get("/getProductDetails",product.getProductDetails);
route.get("/fetchVariants",product.fetchVariants);
route.get("/getCategories",product.listCategories);
route.get("/getBanner",utility.getBanner);

module.exports = route 