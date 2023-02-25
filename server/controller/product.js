const { raw } = require("body-parser");
const product = require("../../database/models/product");
const review = require("../../database/models/review");
const nodemailer = require("nodemailer");

let officialURL = "https://woodshala.in";
let localURL = "http://localhost:8000";

// transporter for sending mail

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASS,
  },
});

// for getting the list of the product
exports.getProducts = async (req, res) => {
  // console.log(req.query);
  let filter = {};

  if (req.query.filter !== "undefined") {
    filter = JSON.parse(req.query.filter);
  }
  // //console.log(filter)

  let query = {};
  let filterArray = [];

  if (req.query.category_name !== "undefined")
    filterArray.push({
      category_name: { $regex: req.query.category_name, $options: "i" },
    });

  if (req.query.product_title !== "undefined")
    filterArray.push({
      product_title: { $regex: req.query.product_title, $options: "i" },
    });

  if (filter.price)
    filterArray.push({
      $and: [
        { selling_price: { $gt: filter.price[0] } },
        { selling_price: { $lt: filter.price[1] } },
      ],
    });

  if (filter.length)
    filterArray.push({
      $and: [
        { length_main: { $gt: filter.length[0] } },
        { length_main: { $lt: filter.length[1] } },
      ],
    });

  if (filter.breadth)
    filterArray.push({
      $and: [
        { breadth: { $gt: filter.breadth[0] } },
        { breadth: { $lt: filter.breadth[1] } },
      ],
    });

  if (filter.height)
    filterArray.push({
      $and: [
        { height: { $gt: filter.height[0] } },
        { height: { $lt: filter.height[1] } },
      ],
    });

  if (filter.material.length > 0) {
    filterArray.push({
      $or: filter.material.map((val) => {
        return { primary_material: { $regex: val, $options: "i" } };
      }),
    });
  }

  if (filterArray.length > 0) query = { $or: filterArray };

  console.log(JSON.stringify(query));

  // final aggregation computing
  product
    .aggregate([
      { $match: query },
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
      { $sort: { selling_price: 1 } },
      { $skip: req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * 10 : 0 },
      { $limit: 10 },
    ])
    .then((data) => {
      //   data.map((row) => console.log(row.SKU));
      //   console.log(data.length);
      return res.status(200).send(data);
    })
    .catch((err) => {
      //console.log(err)
      return res.status(500).send({ message: "Something went wrong !!!" });
    });
};

// for getting related product
exports.getRelatedProduct = async (req, res) => {
  ////console.log(req.query)
  let filter = undefined;

  //    //console.log(filter)

  // for proceeding the filter if there is wrong json formate
  if (req.query.filter !== "{}" && req.query.filter) {
    try {
      filter = JSON.parse(req.query.filter);
    } catch {
      filter = undefined;
    }
  }

  ////console.log(filter)

  //    return res.send('all okay')

  product
    .aggregate([
      {
        $match: filter
          ? {
              $or: [
                { category_name: { $regex: filter.category_name } },
                { product_title: { $regex: filter.product_title } },
              ],
            }
          : {},
      },
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
      { $limit: 10 },
    ])
    .then((response) => {
      // //console.log(response)
      return res.send(response);
    })
    .catch((err) => {
      //console.log(err)
      return res.status(500).send(err);
    });
};

exports.getSearchList = async (req, res) => {
  if (req.query.filter === undefined)
    return res.send({ message: "No params are there !!!" });

  product
    .aggregate([
      {
        $match: {
          $or: [
            { category_name: { $regex: req.query.filter, $options: "i" } },
            { product_title: { $regex: req.query.filter, $options: "i" } },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
        },
      },
      { $limit: 10 },
    ])
    .then((response) => {
      // //console.log(response)
      return res.send(response);
    })
    .catch((err) => {
      //console.log(err)
      return res.status(500).send({ message: "Something went wrong !!!" });
    });
};

// for product detail to show

exports.getProductDetails = async (req, res) => {
  if (req.query === {})
    return res.status(406).send({ message: "Please Provide the product id." });

  try {
    // Consider size, material, range,

    // fetching the product
    let productDetail = await product.aggregate([
      { $match: { SKU: req.query.SKU } },
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
          product_image: { $first: "$product_image" },
          featured_image: { $first: "$featured_image" },
          MRP: { $first: "$selling_price" },
          selling_price: { $first: "$selling_price" },
          showroom_price: { $first: "$showroom_price" },
          discount_limit: { $first: "$discount_limit" },
          SKU: { $first: "$SKU" },
          category_name: { $first: "$category_name" },
          sub_category_name: { $first: "$category_name" },
          length_main: { $first: "$length_main" },
          height: { $first: "$height" },
          breadth: { $first: "$breadth" },
          primary_material: { $first: "$primary_material" },
          polish: { $first: "$polish" },
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
    if (productDetail.length > 0) {
      // for getting under the array
      productDetail = productDetail[0];
      let variants = await product.find(
        {
          $and: [
            { ACIN: productDetail.ACIN },
            { $nor: [{ SKU: productDetail.SKU }] },
          ],
        },
        {
          _id: 1,
          SKU: 1,
          length_main: 1,
          breadth: 1,
          height: 1,
          range: 1,
          primary_material: 1,
          product_title: 1,
          category_name: 1,
        }
      );

      let variant_params = {
        size: [],
        range: [],
        material: [],
      };

      if (variants.length > 0) {
        // console.log('Variants >>> ', variants);
        await variants.map((row) => {
          // for size
          variant_params.size.push({
            SKU: [row.SKU],
            category: row.category_name,
            title: row.product_title,
            size: `${
              row.length_main +
              "L" +
              " x " +
              row.breadth +
              "B" +
              " x " +
              row.height +
              " H "
            }`,
          });
          // for material
          if (row.primary_material.length > 0)
            variant_params.material.push({
              SKU: [row.SKU],
              category: row.category_name,
              title: row.product_title,
              material: row.primary_material.join(),
            });
          // range
          if (row.range !== "None")
            variant_params.range.push({
              SKU: [row.SKU],
              category: row.category_name,
              title: row.product_title,
              range: row.range,
            });
        });

        // adding the present one
        variant_params.size.push({
          SKU: [productDetail.SKU],
          category: productDetail.category_name,
          title: productDetail.product_title,
          size: `${
            productDetail.length_main +
            "L" +
            " x " +
            productDetail.breadth +
            "B" +
            " x " +
            productDetail.height +
            " H "
          }`,
        });
        variant_params.material.push({
          SKU: [productDetail.SKU],
          category: productDetail.category_name,
          title: productDetail.product_title,
          material: productDetail.primary_material.join(),
        });
        variant_params.range.push({
          SKU: [productDetail.SKU],
          category: productDetail.category_name,
          title: productDetail.product_title,
          range: productDetail.range,
        });

        // console.log(variant_params)
        return res.send({
          data: productDetail,
          variant: { ...variant_params, show: true },
        });
      } else
        return res.send({
          data: productDetail,
          variant: { ...variant_params, show: false },
        });
    }
    return res.status(203).send({ message: "Product not found !!!" });
  } catch (err) {
    console.log("ERROR>>> ", err);
    return res.send({ message: "Something went wrang !!!" });
  }
};

// for adding a review
exports.addReview = async (req, res) => {
  try {
    console.log("Files >>>", req.files);
    console.log("Files >>>", req.body);

    let imageURLs = [];
    let videoURLs = [];

    if (req.files["review_images"]) {
      if (req.files["review_images"].length > 0) {
        req.files["review_images"].map((file) => {
          if (file.mimetype === "video/mp4")
            return videoURLs.push(`${officialURL}/${file.path}`);
          return imageURLs.push(`${officialURL}/${file.path}`);
        });
      }
    }

    // req.body.review = JSON.parse(req.body.review);

    req.body.review_images = imageURLs;
    req.body.review_videos = videoURLs;

    if (req.body.review === undefined)
      return res.sendStatus(203).send("Review Box cannot be empty.");
    console.log("Final Body >>>", req.body);

    const data = review(req.body);
    const response = await data.save();

    if (response) return res.send({ message: "Review Added Successfully !!!" });

    return res.status(203).send({ message: "Something went wrong." });
  } catch (error) {
    console.log("ERROR>>>", error);
    return res.sendStatus(500);
  }
};

// for listing  reviews
exports.listReview = async (req, res) => {
  try {
    if (!req.query.product_id)
      return res
        .sendStatus(404)
        .send({ message: "Please provide a valid Product ID." });
    review
      .aggregate([
        { $match: { product_id: req.query.product_id } },
        {
          $lookup: {
            from: "customers",
            localField: "CID",
            foreignField: "CID",
            as: "customer",
          },
        },
      ])
      .then((data) => {
        //console.log(data)
        res.send(data);
      });
  } catch (error) {
    //console.log(error)
    res.sendStatus(500);
  }
};

exports.verifyReview = async (req, res) => {
  try {
    console.log(req.body);
    const otp = Math.floor(100000 + Math.random() * 900000);

    // send mail with defined transport object
    let response = await transporter.sendMail({
      from: "woodshala@gmail.com", // sender address
      to: `${req.body.reviewer_email}`, // list of receivers
      subject: "Email Verification from Woodsala !!!", // Subject line
      html: `<h1>Thanks for your valuable review us !!!</h1>
        <p>Hello ${req.body.reviewer_name}, your verification OTP down below.</p>
        <h1 style = {backgroundColor = 'red'}>${otp}</h1>
        `, // html body
    });

    if (response)
      res.status(200).send({
        otp: otp,
        message: "Verification mail has been sent !!! ",
      });
  } catch (err) {
    console.log("Error >> ", err);
    res.status(500).send("Something went Wrong !!!");
  }
};

// adding reply not in use now
exports.addReply = async (req, res) => {
  try {
    console.log("body>>>", req.body);
    let reply = JSON.parse(req.body.reply);

    let old = await review.findOne({ _id: req.body._id }, { review: 1 });

    console.log(old);

    reply = [...old.review, ...reply];

    let response = await review.findOneAndUpdate(
      { _id: req.body._id },
      { review: reply }
    );

    if (response) {
      return res.send("All okay");
    }
  } catch (error) {
    console.log("Error >>>", error);
    res.status(500).send({ message: "Something Went Wrong !!!" });
  }
};
