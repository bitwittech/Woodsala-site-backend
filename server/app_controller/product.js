const categories = require("../../database/models/categories");
const product = require("../../database/models/product");
const review = require("../../database/models/review");
// const review = require("../../database/models/");

exports.getProduct = async (req, res) => {
  try {
    // console.log(req.query);
    let filter = {};

    if (req.query.filter) {
      filter = JSON.parse(req.query.filter);
    }
    // //console.log(filter)

    let query = {};
    let filterArray = [];

    if (req.query.category_name)
      filterArray.push({
        category_name: { $regex: req.query.category_name, $options: "i" },
      });

    if (req.query.product_title)
      filterArray.push({
        product_title: {
          $regex: req.query.product_title.includes(")")
            ? req.query.product_title.split(")")[1]
            : req.query.product_title,
          $options: "i",
        },
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

    if (filter.material && filter.material.length > 0) {
      filterArray.push({
        $or: filter.material.map((val) => {
          return { primary_material: { $regex: val, $options: "i" } };
        }),
      });
    }

    if (filterArray.length > 0) query = { $or: filterArray };

    // console.log(JSON.stringify(query));

    // final aggregation computing
    let data = await product.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$_id",
          product_title: { $first: "$product_title" },
          product_image: { $first: "$product_image" },
          featured_image: { $first: "$featured_image" },
          product_description: { $first: "$product_description" },
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
          pipeline: [
            {
              $project: {
                discount_limit: 1,
                _id: 0,
              },
            },
          ],
          foreignField: "category_name",
          as: "categories",
        },
      },
      { $sort: { selling_price: 1 } },
      { $skip: req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * 10 : 0 },
      { $limit: 10 },
    ]);

    // Discount Limit Comparison ==========
    data.map((row) => {
      if (row.categories[0]) {
        if (row.discount_limit > row.categories[0].discount_limit)
          row.discount_limit = row.categories[0].discount_limit;
      }
      delete row.categories;
      return row;
    });

    if (data)
      return res.status(200).send({
        message: "Product list fetched successfully.",
        status: 200,
        data,
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

    // fetching the product
    let productDetail = await product.aggregate([
      { $match: { SKU: req.query.SKU } },
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
          fabric: { $first: "$fabric" },
          // amazon_url: { $first: "$amazon_url" },
          // flipkart_url: { $first: "$flipkart_url" },
          // jiomart_url: { $first: "$jiomart_url" },
          polish_time: { $first: "$polish_time" },
          manufacturing_time: { $first: "$manufacturing_time" },
          fitting: { $first: "$fitting" },
          fitting_name: { $first: "$fitting_name" },
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
              $project: {
                product_title: 1,
                _id: 1,
              },
            },
          ],
          foreignField: "ACIN",
          as: "variants",
        },
      },
    ]);

    console.log(productDetail);

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

    // fetching data of all review for CT section in product page
    let allReviews = await review.aggregate([
      { $match: {} },
      {
        $group: {
          _id: "$_id",
          product_id: { $first: "$product_id" },
          rating: { $first: "$rating" },
          review_title: { $first: "$review_title" },
          review: { $first: "$review" },
          reviewer_name: { $first: "$reviewer_name" },
        },
      },
      {
        $lookup: {
          from: "new_products",
          localField: "product_id",
          foreignField: "SKU",
          pipeline: [
            {
              $group: {
                _id: "$_id",
                product_title: { $first: "$product_title" },
                product_image: { $first: "$product_image" },
                category_name: { $first: "$category_name" },
              },
            },
          ],
          as: "product",
        },
      },
      { $limit: 12 },
    ]);

    if (productDetail && allReviews)
      return res.send({
        status: 200,
        message: ` ${req.query.SKU} Product details fetched successfully.`,
        data: productDetail[0],
        reviews: allReviews || [],
      });
    else
      return res.send({
        status: 200,
        message: `No details found for ${req.query.SKU} `,
        data: [],
        reviews: [],
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

    let variants = await product.find(
      { ACIN: ACIN },
      {
        _id: 1,
        SKU: 1,
        primary_material: 1,
        product_title: 1,
        product_image: 1,
        category_name: 1,
      }
    );

    if (variants.length > 1) {
      res.send({
        status: 200,
        message: "Available variants fetched successfully ",
        variants,
        show: true,
      });
    } else {
      res
        .status(203)
        .send({
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

exports.listCategories = async (req,res)=>{
    try{
        let list = await categories.find({},{
          category_name : 1,
          category_status : 1,
          category_image : 1,
        })
        if(list)
        res.send({
          status : 200,
          message : "Category list fetched successfully.",
          data : list,
        })
        else
        res.send({
          status : 200,
          message : "Category list fetched successfully.",
          data : [],
        })
    }catch(err){
      console.log(err)
      res.status(500).send({message : "Something went wrong !!!",err})

    }
}