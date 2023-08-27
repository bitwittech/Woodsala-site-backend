const cart = require("../../database/models/cart");
const product = require("../../database/models/product");
const order = require("../../database/models/order");
const abandoned = require("../../database/models/abandoned");
const cod = require("../../database/models/COD");
const uuid = require("uuid");
const {sendMail} = require('../utils/email.js')
// paymnt get way
const Razorpay = require("razorpay");

// crypto
const crypto = require("crypto");

// for getting the list of the product`
// exports.getProducts = async (req,res)=>{

//     product.find({},{
//         product_title : 1,
//         featured_image : 1,
//         MRP : 1,
//         selling_price : 1,
//         discount_limit : 1
//     }).sort({MRP: 1})
//     .then((data)=>{
//         return res.send(data);
//     })
//     .catch((err)=>{
//         return res.status(500).send({message : 'Something went wrong !!!'})
//     })

// }

exports.addCartItem = async (req, res) => {

  try{
  let response = await cart
    .findOneAndUpdate(
      { $and: [{$or : [{ CID: req.body.CID },{DID : req.sessionID}]}, { product_id: req.body.product_id }] },
      req.body,
      { upsert: true }
    )

      return res.status(200).send({ status : 200,message: "Item added to the cart !!!" });
  }catch(err){
    console.log(err);
    return res.status(500).send({ status : 500, message: "Something went wrong." });
  }
};

exports.removeCartItem = async (req, res) => {
  
  try{

    const {CID,product_id} = req.query;

    if(!product_id) return res.status(203).send('No details Found.')

    let response = await cart.deleteMany({
      $or: [{ CID: req.query.CID},{DID : req.sessionID }, { product_id: req.query.product_id }],
    })

      if (response.deletedCount > 0)
        return res.status(200).send({status : 200, message: "Item removed from the cart !!!" });
      else return res.status(203).send({ status : 203, message: "No product found" });

  }catch(err){
    console.log(err)
      return res.status(500).send({status : 500, message: "Something went wrong !!!" });
    };
};

// get cart item
exports.getCartItem = async (req, res) => {

  cart
    .find(req.query, { _id: 0 })
    .then((response) => {
      // console.log(response)
      return res.send(response);
    })
    .catch((err) => {
      return res.status(404).send({ message: "Something went wrong !!!" });
    });
};

// get cart item
exports.getDetails = async (req, res) => {
  try 
{
     const products = JSON.parse(req.query.products);

    const response = await Promise.all(
      products.map((search) => {
        return product.aggregate([
          { $match: { SKU: search } },
          {
            $group: {
              _id: "$_id",
              product_title: { $first: "$product_title" },
              product_image: { $first: "$product_image" },
              featured_image: { $first: "$featured_image" },
              selling_price: { $first: "$selling_price" },
              discount_limit: { $first: "$discount_limit" },
              SKU: { $first: "$SKU" },
              category_name: { $first: "$category_name" },
              assembly_part: { $first: "$assembly_part" },
              length_main : {$first : "$length_main"},
              breadth : {$first : "$breadth"},
              height : {$first : "$height"},
              polish_time : {$first : "$polish_time"},
              manufacturing_time : {$first : "$manufacturing_time"},
              primary_material : {$first : "$primary_material"},
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "category_name",
              foreignField: "category_name",
              as: "categories",
            },
          },
        ]);
      })
    );

    return res.send(response);
  } catch (err) {
    console.log("Error >> ", err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};

// update quantity
exports.updateQuantity = async (req, res) => {
  // console.log(req.body)
  cart
    .findOneAndUpdate(
      { $and: [{ CID: req.body.CID, product_id: req.body.product_id }] },
      { quantity: req.body.quantity }
    )
    .then((data) => {
      return res.send("Updated Successfully !!!");
    })
    .catch((err) => {});
};
 
// place an order

exports.placeOrder = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });

    const {pay_method_remaining, total, advance_received, limit_without_advance } = req.body

    const amount = (pay_method_remaining === "COD" && limit_without_advance <= total) ?  advance_received : total

    const options = {
      amount: amount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");

    return res.json(order);
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
};

exports.verifyPayment = async (req, res) => {
  try {

    // getting the details back from our font-end
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET); // always put Secret Code as a code salt

    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

    const digest = shasum.digest("hex");

    // console.log(digest,razorpaySignature)
    // comaparing our digest with the actual signature
    // return res.send("ALl okay")
    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: "Transaction not legit!" });

    // THE PAYMENT IS LEGIT & VERIFIED
    if (req.body.CID === null) req.body.CID = "Not Registered";

    // generating other like item fullfil and other
    const extras = {
      product_price : {},
      discount_per_product : {},
      product_parts : {},
      quantity : {},
      items : {}
    }

    if(req.body.product.length > 0)
    {
      req.body.product.map((row)=>{
        Object.assign(extras.quantity,{[row.SKU] : row.qty})
        Object.assign(extras.product_price,{[row.SKU] : row.price})
        Object.assign(extras.product_parts,{[row.SKU] : row.parts || 1})
        Object.assign(extras.discount_per_product,{[row.SKU] : (parseInt(row.discount)/parseInt(row.price))*100})
        Object.assign(extras.items,{[row.SKU] : []})
      })
    }
    else {
      return res.status(500).send({message : "error in simpleOrder APis product unavailable."})
    }


    let data = order({...req.body,...extras});

    const {
      customer_name
      ,customer_email
      ,shipping
      ,billing
      ,quantity
      ,total
      ,advance_received
      ,discount
      ,subTotal
      ,O

    } = req.body

    const mailContent = {
          recipient_mail : customer_email,
          recipient_name : customer_name,
          subject : "Thank you for placeing an order with Woodshala.",
          mailBody :`<h1>Your Order has beeen placed.</h1>
          <p>Here is your order id <strong>${O}</strong> . And futher order and item details.</p>
          <h4>Order Details :-</h4>
          <ul>
          <li><strong>Shipping</strong> : ${shipping}</li>
          <li><strong>Subtotal</strong> : ${subTotal}</li>
          <li><strong>Discount</strong> : ${discount}</li>
          <li><strong>Paid</strong> : ${advance_received}</li>
          <li><strong>Total</strong> : ${total}</li>
          </ul>
          `, 
        }

    data = await data.save() 
      if(data) {
        console.log(data)
        let sendNOtificationMail =  await sendMail(mailContent)
        console.log(sendNOtificationMail)
        return res.send({ message: "Order Added !!!", data, sendMail });
      }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};

// this will use when no pre paid payment (online) needed for COD 
exports.simpleOrder = async (req, res) => {
  try {
    // THE PAYMENT IS LEGIT & VERIFIED
    if (req.body.CID === null) req.body.CID = "Not Registered";

    const extras = {
      product_price : {},
      quantity : {},
      discount_per_product : {},
      product_parts : {},
      items : {}
    }

    if(req.body.product.length > 0)
    {
      req.body.product.map((row)=>{

        Object.assign(extras.quantity,{[row.SKU] : row.qty})
        Object.assign(extras.product_price,{[row.SKU] : row.price})
        Object.assign(extras.product_parts,{[row.SKU] : row.parts || 1})
        Object.assign(extras.discount_per_product,{[row.SKU] : (parseInt(row.discount)/parseInt(row.price))*100})
        Object.assign(extras.items,{[row.SKU] : []})
      })
    }
    else {
      return res.status(500).send({message : "error in simpleOrder APis product unavailable."})
    }

    const products = req.body.product.map(row=>row.SKU)

    let details = ""; 

    let data = order({...req.body,...extras});

    const {
      customer_name
      ,customer_email
      ,shipping
      ,billing
      ,quantity
      ,total
      ,paid
      ,discount
      ,subTotal
      ,O

    } = req.body

    const mailContent = {
          recipient_mail : customer_email,
          recipient_name : customer_name,
          subject : "Thank you for placeing an order with Woodshala.",
          mailBody :`<h1>Your Order has beeen placed.</h1>
          <p>Here is your order id <strong>${O}</strong> . And futher order and item details.</p>
          <h4>Order Details :-</h4>
          <ul>
          <li><strong>Shipping</strong> : ${shipping}</li>
          <li><strong>Subtotal</strong> : ${subTotal}</li>
          <li><strong>Discount</strong> : ${discount}</li>
          <li><strong>Total</strong> : ${total}</li>
          </ul>
          `, 
        }

    data = await data.save()
      if(data) {
        let sendNOtificationMail =  await sendMail(mailContent)
        console.log(sendNOtificationMail)
        return res.send({ message: "Order Added !!!", data, sendMail });
      }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
};
// api for collecting abandoned orders 
exports.placeAbandonedOrders = async(req,res)=>{
  try{
    req.body.uuid = uuid.v4();
    // console.log(req.body)
    // let save it up 
    let response = await abandoned(req.body).save();
    if(response)
    {
      // console.log(response)
      return res.send('Order add as abandoned.')

    }
  }
  catch(err){
    console.log("Error>>",err)
    return res.status(500).send('Something Went Wrong !!!')
  }
}

exports.cod_limit = async(req,res)=>{
  try{
    let response = await cod.find({})
    if(response)
    return res.send(response)
  }
  catch(err){
    console.log(err)
    res.status(500).send({message : 'Something went wrong !!!'})
  }

}

exports.getCartItemWithProduct = async(req, res) => {
  try {
      const { CID } = req.query;
      const DID = req.sessionID;

      console.log(CID,DID)
      // console.log()

      if (!CID && !DID)
          return res.status(203).send({
              status: 203,
              message: "Missing Payload",
          });

      let query = {};

      if (CID !== "undefined") query = { CID: String(CID) };
      else query = { DID };

     
      let data = await cart.aggregate([
        {
          $match: query
        },
        {
          $project : {_id : 0}
        },
        {
          $lookup: {
            from: "new_products", // The name of the products collection
            localField: "product_id", // The field in the cart collection
            foreignField: "SKU", // The field in the new_products collection
            as: "productData" // The name of the field to store the joined product data
          }
        },
        {
          $unwind: "$productData" // Unwind the productData array to get individual product documents
        },
        {
          $lookup: {
            from: "categories", // The name of the categories collection
            localField: "productData.category_name", // The field in the productData
            foreignField: "category_name", // The field in the categories collection
            as: "categoryData" // The name of the field to store the joined category data
          }
        },
        {
          $unwind: "$categoryData" // Unwind the categoryData array to get individual category documents
        },
        {
          $addFields: {
            effectiveDiscount: {
              $min: [
                { $multiply: ["$productData.discount_limit", 0.01] }, // Convert percentage to fraction
                { $multiply: ["$categoryData.discount_limit", 0.01] } // Convert percentage to fraction
              ]
            }
          }
        },
        {
          $project: {
            _id: 0,
            product_id:1,
            CID: 1,
            quantity: 1,
            totalPricePerItem: {
              $multiply: [
                "$quantity",
                {
                  $subtract: [
                    "$productData.selling_price",
                    { $multiply: ["$productData.selling_price", "$effectiveDiscount"] }
                  ]
                }
              ]
            },
            productDetails: {
              _id: "$productData._id",
              SKU:"$productData.SKU",
              title: "$productData.product_title",
              price: "$productData.selling_price",
              length : "$productData.length_main",
              breadth : "$productData.breadth",
              height : "$productData.height",
              product_images : "$productData.product_image",
              material : "$productData.primary_material",
              // productDiscount: "$productData.discount_limit",
              // categoryDiscount: "$categoryData.discount_limit",
              featured_image: "$productData.featured_image",
              effectiveDiscount: "$effectiveDiscount",
              polish_time:"$productData.polish_time",
              manufacturing_time:"$productData.manufacturing_time",
            }
          }
        },
        {
          $group: {
            _id: null,
            cartItems: {
              $push: {
                _id: "$_id",
                CID: "$CID",
                productDetails: "$productDetails",
                quantity: "$quantity",
                totalPricePerItem: "$totalPricePerItem"
              }
            },
            subtotal: { $sum: "$totalPricePerItem" }
          }
        },
        {
          $project: {
            _id: 0,
            cartItems: 1,
            subtotal: 1,
            total: "$subtotal"
          }
        }
      ])

      // console.log(data)

      if (data)
          return res.status(200).send({
              status: 200,
              message: "Cart items fetched successfully.",
              data,
          });
      else
          return res.status(203).send({
              status: 203,
              message: "No product found",
              data: { data, cartCount: data.length },
          });
  } catch (err) {
      console.log(err);
      return res
          .status(500)
          .send({ status: 500, message: "Something went wrong !!!", data: {} });
  }
};
