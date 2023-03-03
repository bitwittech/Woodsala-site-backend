const cart = require("../../database/models/cart");
const product = require("../../database/models/product");
const order = require("../../database/models/order");
const abandoned = require("../../database/models/abandoned");
const uuid = require("uuid");

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
  // console.log(req.body)
  await cart
    .findOneAndUpdate(
      { $and: [{ CID: req.body.CID }, { product_id: req.body.product_id }] },
      req.body,
      { upsert: true }
    )
    .then((response) => {
      // console.log(response)
      return res.send({ message: "Item added to the cart !!!" });
    })
    .catch((err) => {
      return res.status(404).send({ message: "Something went wrong !!!" });
    });
};

exports.removeCartItem = async (req, res) => {
  // console.log(req.query);
  // data
  cart
    .deleteMany({
      $and: [{ CID: req.query.CID }, { product_id: req.query.product_id }],
    })
    .then((response) => {
      // // console.log(response)
      if (response.deletedCount > 0)
        return res.send({ message: "Item removed from the cart !!!" });
      else return res.status(404).send({ message: "Something went wrong !!!" });
    })
    .catch((err) => {
      return res.status(404).send({ message: "Something went wrong !!!" });
    });
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
  try {
    // console.log(JSON.parse(req.query.products))
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
              product_description: { $first: "$product_description" },
              MRP: { $first: "$selling_price" },
              selling_price: { $first: "$selling_price" },
              discount_limit: { $first: "$discount_limit" },
              SKU: { $first: "$SKU" },
              category_name: { $first: "$category_name" },
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

    const options = {
      amount: req.body.total * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");

    return res.json(order);
  } catch (error) {
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
    if (digest !== razorpaySignature)
      return res.status(400).json({ msg: "Transaction not legit!" });

    // THE PAYMENT IS LEGIT & VERIFIED
    if (req.body.CID === null) req.body.CID = "Not Registered";

    const data = order(req.body);

    data
      .save()
      .then((response) => {
        //    console.log(response)
        res.send({ message: "Order Added !!!", response });
      })
      .catch((err) => {
        console.log(err);
        res.status(404).send({ message: "Something Went Wrong !!!" });
      });
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
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