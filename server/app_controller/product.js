require("dotenv").config();

const categories = require("../../database/models/categories");
const product = require("../../database/models/product");
const catalog = require("../../database/models/catalog");
const reviewDB = require("../../database/models/review");
const otp = require("../../database/models/verify");

// nodemalier instance
const transporter = require("../middleware/email_instance");
// const review = require("../../database/models/");

exports.getProduct = async (req, res) => {
  try {
    let {
      CID,
      DID,
      limit,
      pageNumber,
      category_name,
      product_title,
      price,
      length,
      breadth,
      height,
      material,
    } = req.body;

    console.log(req.body)

    let query_user = [];

    if (CID) query_user = ["$CID", CID];
    else query_user = ["$DID", DID];

    let query = {};
    let filterArray = [];

    if (category_name)
      filterArray.push({
        category_name: { $regex: category_name, $options: "i" },
      });

    if (product_title)
      filterArray.push({
        product_title: {
          $regex: product_title.includes(")")
            ? product_title.split(")")[1]
            : product_title,
          $options: "i",
        },
      });

    if (price) {
      filterArray.push({
        $and: [
          { selling_price: { $gte: price.min } },
          { selling_price: { $lte: price.max } },
        ],
      });
    }
    if (length) {
      filterArray.push({
        $and: [
          { length_main: { $gte: length.min } },
          { length_main: { $lte: length.max } },
        ],
      });
    }

    if (breadth) {
      filterArray.push({
        $and: [
          { breadth: { $gte: breadth.min } },
          { breadth: { $lte: breadth.max } },
        ],
      });
    }
    if (height) {
      filterArray.push({
        $and: [
          { height: { $gte: height.min } },
          { height: { $lte: height.max } },
        ],
      });
    }
    if (material && material.length > 0) {
      filterArray.push({
        $or: material.map((val) => {
          return { primary_material: { $regex: val, $options: "i" } };
        }),
      });
    }

    if (filterArray.length > 0) query = { $and: filterArray };

    // final aggregation computing
    let data = await product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
          product_image: { $first: "$product_image" },
          featured_image: { $first: "$featured_image" },
          length : {$first : "$length_main"},
          breadth : {$first : "$breadth"},
          height : {$first : "$height"},
          primary_material: { $first: "$primary_material" },
          product_description: { $first: "$product_description" },
          selling_price: { $first: "$selling_price" },
          discount_limit: { $first: "$discount_limit" },
          SKU: { $first: "$SKU" },
          category_name: { $first: "$category_name" },
        },
      },
      {
        $lookup: {
          from: "primarymaterials",
          localField: "primary_material",
          pipeline: [
            {
              $group: {
                _id: "$_id",
                name: { $first: "$primaryMaterial_name" },
              },
            },
          ],
          foreignField: "primaryMaterial_name",
          as: "materials",
        },
      },
      {
        $lookup: {
          from: "wishlists",
          let: { product_id: "$SKU" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$product_id"] },
                    { $eq: query_user },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                CID: 0,
                product_id: 0,
                DID: 0,
                __v: 0,
                quantity: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          isWishlist: {
            $cond: {
              if: { $eq: [{ $size: "$wishlist" }, 0] },
              then: false,
              else: true,
            },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_name",
          pipeline: [
            {
              $project: {
                discount_limit: 1,
                category_banner: 1,
                _id: 0,
              },
            },
          ],
          foreignField: "category_name",
          as: "categories",
        },
      },
      { $sort: { selling_price: 1 } },
      { $skip: pageNumber > 0 ? (pageNumber - 1) * (parseInt(limit) || 10) : 0 },
      { $limit: parseInt(limit) || 10 },
    ]);

    let materialFilter = new Set();

    // Discount Limit Comparison ==========
    data.map((row) => {
      if (row.categories[0]) {
        if (row.discount_limit > row.categories[0].discount_limit)
          row.discount_limit = row.categories[0].discount_limit;
      }
      delete row.categories;
      materialFilter.add(JSON.stringify(...row.materials));
      delete row.materials;
      return row;
    });

    // material filter add ==========
    materialFilter = Array.from(materialFilter).map((row) => JSON.parse(row));

    if (data)
      return res.status(200).send({
        message: "Product list fetched successfully.",
        status: 200,
        data: { data, filter: { materialFilter } },
      });
    else
      return res.status(203).send({
        message: "Sorry but not result found for the respective query.",
        status: 203,
        data: [],
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: "Something went wrong !!!",
      error: JSON.stringify(error),
    });
  }
};

exports.getProductDetails = async (req, res) => {
  if (req.query === {})
    return res.status(404).send({ message: "Please Provide the product id." });
  try {
    // Consider size, material, range,

    let { CID, DID, SKU } = req.query;

    // console.log(CID, DID,SKU)
    let query_user = [];

    if (CID) query_user = ["$CID", CID];
    else query_user = ["$DID", DID];

    // fetching the product
    let productDetail = await product.aggregate([
      { $match: { SKU: SKU } },
      {
        $group: {
          _id: "$_id",
          ACIN: { $first: "$ACIN" },
          product_title: { $first: "$product_title" },
          product_image: { $first: "$product_image" },
          featured_image: { $first: "$featured_image" },
          selling_price: { $first: "$selling_price" },
          selling_points: { $first: "$selling_points" },
          showroom_price: { $first: "$showroom_price" },
          discount_limit: { $first: "$discount_limit" },
          SKU: { $first: "$SKU" },
          category_id: { $first: "$category_id" },
          category_name: { $first: "$category_name" },
          sub_category_name: { $first: "$sub_category_name" },
          length_main: { $first: "$length_main" },
          height: { $first: "$height" },
          breadth: { $first: "$breadth" },
          primary_material: { $first: "$primary_material" },
          polish: { $first: "$polish" },
          // fabric: { $first: "$fabric" },
          polish_time: { $first: "$polish_time" },
          manufacturing_time: { $first: "$manufacturing_time" },
          // fitting: { $first: "$fitting" },
          // fitting_name: { $first: "$fitting_name" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_name",
          pipeline: [
            {
              $project: {
                discount_limit: 1,
                _id: 1,
              },
            },
          ],
          foreignField: "category_name",
          as: "categories",
        },
      },
      {
        $lookup: {
          from: "new_products",
          localField: "ACIN",
          pipeline: [
            {
              $match : {SKU : {$ne : SKU}}
            },
            {
              $project: {
                product_image: 1,
                selling_price: 1,
                SKU: 1,
                product_title: 1,
                _id: 1,
              },
            },
          ],
          foreignField: "ACIN",
          as: "variants",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "SKU",
          foreignField: "product_id",
          as: "reviews",
        },
      },
      {
        $addFields: {
          totalReviews: { $size: "$reviews" },
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "SKU",
          pipeline: [
            {
              $project: {
                product_id: 1,
                product_title: 1,
                rating: 1,
                review_title: 1,
                review: 1,
                reviewer_name: 1,
                _id: 1,
              },
            },
            { $sort: { date: -1 } },
            { $limit: 5 },
          ],
          foreignField: "product_id",
          as: "review",
        },
      },
      {
        $lookup: {
          from: "wishlists",
          let: { product_id: "$SKU" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$product_id"] },
                    { $eq: query_user },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                CID: 0,
                product_id: 0,
                DID: 0,
                __v: 0,
                quantity: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          isWishlist: {
            $cond: {
              if: { $eq: [{ $size: "$wishlist" }, 0] },
              then: false,
              else: true,
            },
          },
        },
      },
    ]);

    if (productDetail.length < 1)
      return res.send({
        status: 200,
        message: ` ${req.query.SKU} No Product details found.`,
        data: productDetail,
      });

    // sum of discount limit
    if (productDetail[0].categories[0]) {
      if (
        productDetail[0].discount_limit >
        productDetail[0].categories[0].discount_limit
      )
        productDetail[0].discount_limit =
          productDetail[0].categories[0].discount_limit;

      delete productDetail[0].categories;
    }

    if (productDetail)
      return res.send({
        status: 200,
        message: ` ${req.query.SKU} Product details fetched successfully.`,
        data: productDetail[0],
      });
    else
      return res.send({
        status: 200,
        message: `No details found for ${req.query.SKU} `,
        data: [],
      });
  } catch (err) {
    console.log("ERROR>>> ", err);
    return res.status(500).send({ message: "Something went wrang !!!" });
  }
};

exports.fetchVariants = async (req, res) => {
  if (req.query === {})
    return res.status(406).send({ message: "Please Provide the product id." });

  try {
    let { ACIN } = req.query;

    if (!ACIN)
      return res.status(203).send({
        status: "203",
        message: "Missing Payload.",
        data: [],
      });

    let { CID, DID } = req.query;

    let query_user = [];

    if (CID) query_user = ["$CID", CID];
    else query_user = ["$DID", DID];

    let variants = await product.aggregate([
      { $match: { ACIN: ACIN } },
      {
        $project: {
          _id: 1,
          SKU: 1,
          primary_material: 1,
          product_title: 1,
          product_image: 1,
          category_name: 1,
        },
      },

      {
        $lookup: {
          from: "wishlists",
          let: { product_id: "$SKU" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$product_id"] },
                    { $eq: query_user },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                CID: 0,
                product_id: 0,
                DID: 0,
                __v: 0,
                quantity: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          isWishlist: {
            $cond: {
              if: { $eq: [{ $size: "$wishlist" }, 0] },
              then: false,
              else: true,
            },
          },
        },
      },
    ]);

    if (variants.length > 1) {
      res.send({
        status: 200,
        message: "Available variants fetched successfully ",
        variants,
        show: true,
      });
    } else {
      res.status(203).send({
        status: 203,
        message: "No variants found.",
        variants: [],
        show: false,
      });
    }
  } catch (err) {
    console.log("ERROR>>> ", err);
    return res.send({ message: "Something went wrang !!!" });
  }
};

exports.listCategories = async (req, res) => {
  try {
    let { limit } = req.query;

    let list = await categories
      .find(
        {},
        {
          category_name: 1,
          category_image: 1,
          category_banner: 1,
        }
      )
      .limit(limit || 8);
    if (list)
      res.send({
        status: 200,
        message: "Category list fetched successfully.",
        data: list,
      });
    else
      res.send({
        status: 200,
        message: "Category list fetched successfully.",
        data: [],
      });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Something went wrong !!!", err });
  }
};

exports.listCatalog = async (req, res) => {
  try {
    let { 
      catalog_type,limit,
      pageNumber,
      category_name,
      product_title,
      price,
      length,
      breadth,
      height,
      material} = req.body;

      let list = "";
    let query = {};
    let catalog_query = {};
    let filterArray = [];

    if (catalog_type && catalog_type.length > 0) {
      filterArray.push({
        $or: catalog_type.map((val) => {
          return { catalog_type: { $regex: val, $options: "i" } };
        }),
      });
      catalog_query = filterArray[0];
      filterArray.pop();
    }


    if (product_title)
      filterArray.push({
        product_title: {
          $regex: product_title.includes(")")
            ? product_title.split(")")[1]
            : product_title,
          $options: "i",
        },
      });

    if (price) {
      filterArray.push({
        $and: [
          { selling_price: { $gte: price.min } },
          { selling_price: { $lte: price.max } },
        ],
      });
    }
    if (length) {
      filterArray.push({
        $and: [
          { length_main: { $gte: length.min } },
          { length_main: { $lte: length.max } },
        ],
      });
    }

    if (breadth) {
      filterArray.push({
        $and: [
          { breadth: { $gte: breadth.min } },
          { breadth: { $lte: breadth.max } },
        ],
      });
    }
    if (height) {
      filterArray.push({
        $and: [
          { height: { $gte: height.min } },
          { height: { $lte: height.max } },
        ],
      });
    }
    if (material && material.length > 0) {
      filterArray.push({
        $or: material.map((val) => {
          return { primary_material: { $regex: val, $options: "i" } };
        }),
      });
    }

    if (filterArray.length > 0) query = { $and: filterArray };

    console.log(query,catalog_query)

    // list = await catalog.find(filter).limit(10);
    list = await catalog.aggregate([
      { $match:  catalog_query },
      {
        $project: {
          __v: 0,
        },
      },
      {
        $lookup: {
          from: "new_products",
          localField: "SKU",
          pipeline: [
            {
              $match : query
            },
            {
              $project: {
                product_title: 1,
                length : 1,
                breadth : 1,
                height : 1,
                primary_material: 1,
                product_image: 1,
                selling_price: 1,
                _id: 0,
              },
            },
          ],
          foreignField: "SKU",
          as: "product",
        },
      },
      { $skip: pageNumber > 0 ? (pageNumber - 1) * (parseInt(limit) || 10) : 0 },
      {
        $limit: parseInt(limit) || 10,
      },
    ]);

    if(list.length > 0)
    list = list.filter(row=>row.product.length > 0)

    if (list) {
      res.send({
        status: 200,
        message: "Catalog list fetched successfully.",
        data: list,
      });
    } else {
      res.status(203).send({
        status: 203,
        message: "Error occurred in fetching the list.",
        data: [],
      });
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
};

// for getting related product
exports.getRelatedProduct = async (req, res) => {
  try {
    let { category_name, product_title, limit } = req.query;

    if (!category_name && !product_title)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload !!!",
        data: [],
      });

    let { CID, DID } = req.query;

    let query_user = [];

    if (CID) query_user = ["$CID", CID];
    else query_user = ["$DID", DID];

    // for proceeding the filter if there is wrong json formate
    let data = await product.aggregate([
      {
        $match: {
          $or: [
            { category_name: { $regex: String(category_name), $options: "i" } },
            { product_title: { $regex: String(product_title), $options: "i" } },
          ],
        },
      },
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
          product_image: { $first: "$product_image" },
          featured_image: { $first: "$featured_image" },
          product_description: { $first: "$product_description" },
          selling_price: { $first: "$selling_price" },
          SKU: { $first: "$SKU" },
          category_name: { $first: "$category_name" },
        },
      },
      {
        $lookup: {
          from: "wishlists",
          let: { product_id: "$SKU" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$product_id", "$$product_id"] },
                    { $eq: query_user },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 0,
                CID: 0,
                product_id: 0,
                DID: 0,
                __v: 0,
                quantity: 0,
              },
            },
          ],
          as: "wishlist",
        },
      },
      {
        $addFields: {
          isWishlist: {
            $cond: {
              if: { $eq: [{ $size: "$wishlist" }, 0] },
              then: false,
              else: true,
            },
          },
        },
      },
      { $limit: parseInt(limit) || 8 },
    ]);

    if (data)
      return res.status(200).send({
        status: 200,
        message: "Related product list fetched successfully.",
        data,
      });
    else
      return res.status(203).send({
        status: 203,
        message: "No Related products found.",
        data: [],
      });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: 500,
      message: "Something went wrong !!!",
      data: [],
    });
  }
};

// ==================== Review product

// for adding a review
exports.addReview = async (req, res) => {
  try {
    let { reviewer_name, reviewer_email, review, product_id } =
      req.body;

    if (
      !reviewer_name ||
      !reviewer_email ||
      !review ||
      !product_id
    )
      return res.status(203).send({
        status: 203,
        message: "Missing payload !!!",
      });

    // let checkOtp = await otp.findOne({
    //   $and: [
    //     { assignTo: reviewer_email },
    //     { otp: otp_code },
    //     { status: false },
    //   ],
    // });

    // if (checkOtp) {
      // await otp.findOneAndUpdate(
      //   {
      //     $and: [
      //       { assignTo: reviewer_email },
      //       { otp: otp_code },
      //       { status: false },
      //     ],
      //   },
      //   { status: true }
      // );
    // } else
    //   return res.status(203).send({
    //     status: 203,
    //     message: "Please provide the valid otp and email !!!",
    //   });

    // console.log("Files >>>", req.files);
    // console.log("Files >>>", req.body);

    let imageURLs = [];
    let videoURLs = [];

    if (req.files["review_images"]) {
      if (req.files["review_images"].length > 0) {
        req.files["review_images"].map((file) => {
          if (file.mimetype === "video/mp4")
            return videoURLs.push(`${process.env.IMG_URL}${file.path}`);
          return imageURLs.push(`${process.env.IMG_URL}${file.path}`);
        });
      }
    }

    // req.body.review = JSON.parse(req.body.review);

    req.body.review_images = imageURLs;
    req.body.review_videos = videoURLs;

    // console.log("Final Body >>>", req.body);

    const data = reviewDB(req.body);
    const response = await data.save();

    if (response)
      return res
        .status(200)
        .send({ status: 200, message: "Review added successfully." });
    else
      return res
        .status(203)
        .send({ status: 203, message: "Something went wrong." });
  } catch (error) {
    console.log("ERROR>>>", error);
    return res.status(500).send({
      status: 500,
      message: "Something went wrong.",
    });
  }
};

// for listing  reviews
exports.listReview = async (req, res) => {
  try {
    let { product_id, limit } = req.query;

    let query = { product_id };

    if (!product_id) query = {};

    // console.log(query)

    let data = await reviewDB
      .find({ ...query })
      .sort({ data: -1 })
      .limit(parseInt(limit) || 10);

    if (data)
      return res
        .status(200)
        .send({ status: 200, message: `Reviews fetched successfully.`, data });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ status: 500, message: "Something went wrong !!!" });
  }
};

exports.verifyReview = async (req, res) => {
  try {
    let { reviewer_email, reviewer_name } = req.body;

    if (!reviewer_email || !reviewer_name)
      return res.status(203).send({
        status: 203,
        message: "Missing Payload !!!",
      });

    const reqx =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

    if (!reqx.test(reviewer_email))
      return res.status(203).send({
        status: 203,
        message: "Please provide the valid email address !!!",
      });

    // inserting the OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    let insertOtp = otp({
      otp: otpCode,
      assignTo: reviewer_email,
    });

    insertOtp = await insertOtp.save();

    if (!insertOtp)
      return res.status(203).send({
        status: 203,
        message: "Sorry, APIs getting out of order !!!",
      });

    // send mail with defined transport object
    let response = await transporter.sendMail({
      from: "woodshala@gmail.com", // sender address
      to: `${reviewer_email}`, // list of receivers
      subject: "Email Verification from Woodsala !!!", // Subject line
      html: `<h1>Thanks for your valuable review us !!!</h1>
        <p>Hello ${reviewer_name}, your verification OTP down below.</p>
        <h1 style = {backgroundColor = 'red'}>${otpCode}</h1>
        `, // html body
    });

    if (response)
      return res
        .status(200)
        .send({ status: 200, message: "Verification mail has been sent !!! " });
    else
      return res.status(203).send({
        status: 203,
        message: "Facing an issue while sending the mail.",
      });
  } catch (err) {
    console.log("Error >> ", err);
    res.status(500).send({
      status: 500,
      message: "Something went wrong !!!",
    });
  }
};

// async function lets(){
//   console.log(await otp.find())
// }

// lets()
