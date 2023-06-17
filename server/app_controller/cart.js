const cart = require("../../database/models/cart");
const wishlist = require("../../database/models/wishlist");
const product = require("../../database/models/product");

// Cart ======================

exports.addCartItem = async (req, res) => {
  try {
    let { CID, product_id, quantity, DID } = req.body;

    // console.log(CID, product_id, quantity,DID)
    // console.log((!CID || !DID))

    if ((!CID && !DID) || !product_id || !quantity)
      return res.status(203).send({
        status: 203,
        message: "Please provide the proper payload missing.",
      });

    let data = await cart.findOneAndUpdate(
      {
        $and: [
          { $or: [{ CID }, { DID }] },
          { product_id: req.body.product_id },
        ],
      },
      { CID, product_id, quantity, DID },
      { upsert: true, new: true }
    );

    let cartCount = await cart
      .find({ $and: [{ $or: [{ CID }, { DID }] }] })
      .count();

    if (data)
      return res.status(200).send({
        status: 200,
        message: "Produce dumped to the cart.",
        data: { data, cartCount },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "Facing error while dumping the product to the cart.",
        data: { data: [], cartCount: 0 },
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Facing error while dumping the product to the cart.",
      data: [],
    });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { CID, DID, product_id } = req.query;

    console.log(CID, DID);
    if ((!CID && !DID) || !product_id)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload",
      });

    let response = await cart.deleteMany({
      $and: [{ $or: [{ CID, DID }] }, { product_id: req.query.product_id }],
    });
    let cartCount = await cart.find({ $or: [{ CID, DID }] }).count();

    if (response.deletedCount > 0)
      return res.status(200).send({
        status: 200,
        message: "Item removed from the cart !!!",
        data: { cartCount },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No product found",
        data: { cartCount },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};

exports.getCartItem = async (req, res) => {
  try {
    const { CID, DID } = req.query;

    if (!CID && !DID)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload",
      });

    // ,

    let data = await cart.aggregate([
      { $match: { $or: [{ CID }, { DID }] } },
      { $project: { __v: 0 } },
      {
        $lookup: {
          from: "new_products",
          localField: "product_id",
          // pipeline: [
          //   {
          //     $project: {
          //       product_title: 1,
          //       product_image: 1,
          //       category_name: 1,
          //       discount_limit: 1,
          //       selling_price: 1,
          //     },
          //   },
          //   {
          //     $lookup: {
          //       from: "categories",
          //       localField: "category_name",
          //       pipeline: [
          //         {
          //           $project: {
          //             category_name: 1,
          //             discount_limit: 1,
          //           },
          //         },
          //       ],
          //       foreignField: "category_name",
          //       as: "category",
          //     },
          //   },
          // ],
          foreignField: "SKU",
          as: "product",
        },
      },
    ]);


    // let total = data.reduce((sum,row )=>{
    //     if(row.product.length > 0)
    //     {
    //       if(row.product[0].category.length > 0)
    //       {
    //         subtotal+= row.product[0].selling_price
    //         if(row.product[0].discount_limit > row.product[0].category[0].discount_limit)
    //         {
    //           return sum = sum + row.product[0].selling_price - row.product[0].selling_price/100*row.product[0].discount_limit
    //         }
    //         else{
    //           return sum = sum + row.product[0].selling_price - row.product[0].selling_price/100*row.product[0].category[0].discount_limit   
    //         }
    //       }
    //     }
    // },0)
    let subtotal = data.reduce((sum,row )=>{
        if(row.product.length > 0)
        {
            return sum += row.product[0].selling_price * row.quantity
        }
    },0)

    data = data.map(row=>{
      row = {...row,
        product_image : row.product[0].product_image,
        product_title : row.product[0].product_title,
        selling_price : row.product[0].selling_price*row.quantity
      
      }
      delete row.product;
       return row})


    if (data)
      return res.status(200).send({
        status: 200,
        message: "Cart items fetched successfully.",
        data: { data, cartCount: data.length, subtotal },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No product found",
        data: { data, cartCount: data.length },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};

// Wishlist =============================

exports.addWishlistItem = async (req, res) => {
  try {
    let { CID, product_id, quantity, DID } = req.body;

    // console.log(CID, product_id, quantity,DID)
    // console.log((!CID || !DID))

    if ((!CID && !DID) || !product_id || !quantity)
      return res.status(203).send({
        status: 203,
        message: "Please provide the proper payload missing.",
      });

    let data = await wishlist.findOneAndUpdate(
      {
        $and: [
          { $or: [{ CID }, { DID }] },
          { product_id: req.body.product_id },
        ],
      },
      { CID, product_id, quantity, DID },
      { upsert: true, new: true }
    );

    let wishListCount = await wishlist
      .find({ $and: [{ $or: [{ CID }, { DID }] }] })
      .count();

    if (data)
      return res.status(200).send({
        status: 200,
        message: "Produce dumped to the wishlist.",
        data: { data, wishListCount },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "Facing error while dumping the product to the cart.",
        data: { data: [], wishListCount },
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: 500,
      message: "Facing error while dumping the product to the cart.",
      data: [],
    });
  }
};

exports.removeWishlistItem = async (req, res) => {
  try {
    const { CID, DID, product_id } = req.query;

    // console.log(CID, DID);
    if ((!CID && !DID) || !product_id)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload",
      });

    let response = await wishlist.deleteMany({
      $and: [{ $or: [{ CID, DID }] }, { product_id: req.query.product_id }],
    });
    let wishlistCount = await wishlist.find({ $or: [{ CID, DID }] }).count();

    if (response.deletedCount > 0)
      return res.status(200).send({
        status: 200,
        message: "Item removed from the wishlist !!!",
        data: { wishlistCount },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No product found",
        data: { wishlistCount },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};

exports.getWishlistItem = async (req, res) => {
  try {
    const { CID, DID } = req.query;

    if (!CID && !DID)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload",
      });

      let data = await cart.aggregate([
        { $match: { $or: [{ CID }, { DID }] } },
        { $project: { __v: 0 } },
        {
          $lookup: {
            from: "new_products",
            localField: "product_id",
            // pipeline: [
            //   {
            //     $project: {
            //       product_title: 1,
            //       product_image: 1,
            //       category_name: 1,
            //       discount_limit: 1,
            //       selling_price: 1,
            //     },
            //   },
            //   {
            //     $lookup: {
            //       from: "categories",
            //       localField: "category_name",
            //       pipeline: [
            //         {
            //           $project: {
            //             category_name: 1,
            //             discount_limit: 1,
            //           },
            //         },
            //       ],
            //       foreignField: "category_name",
            //       as: "category",
            //     },
            //   },
            // ],
            foreignField: "SKU",
            as: "product",
          },
        },
      ]);
  


    data = data.map(row=>{
      row = {...row,
        product_image : row.product[0].product_image,
        product_title : row.product[0].product_title,
        selling_price : row.product[0].selling_price*row.quantity
      
      }
      delete row.product;
       return row})


    if (data)
      return res.status(200).send({
        status: 200,
        message: "Wishlist items fetched successfully.",
        data: { data, wishlistCount: data.length },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No product found",
        data: { data, wishlistCount: data.length },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};


exports.getCount = async (req, res) => {
  try {
    const { CID, DID } = req.query;

    if (!CID && !DID)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload",
      });

      let CartCount = await cart.find({$od : [{CID},{DID}]}).count()
      let WishCount = await wishlist.find({$od : [{CID},{DID}]}).count()
    

    if (CartCount
      && WishCount)
      return res.status(200).send({
        status: 200,
        message: "Wishlist items fetched successfully.",
        data: { WishCount ,CartCount },
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No product found",
        data: { WishCount ,CartCount },
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Something went wrong !!!" });
  }
};
