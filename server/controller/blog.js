require("dotenv").config();

const blog = require("../../database/models/blog");

const uuid = require("uuid");

// Api for card creation

exports.createBlog = async (req, res) => {
  // //console.log(req.user)
  //console.log(req.files)

  req.body.uuid = uuid.v4();

  if (req.files["banner_image"] === undefined)
    return res.status(203).send({ message: "Image Is Required !!!" });
  req.body.card_image = `${process.env.Official}/${req.files["banner_image"][0].path}`;

  let SaveToDb = new blog(req.body);

  // saving data to db
  await SaveToDb.save()
    .then((response) => {
      //console.log("Blog Added Successfully !!!");
      return res.send({ message: "Blog Added Successfully !!!", response });
    })
    .catch((err) => {
      //console.log({ massage: "Blog Not Added !!!", err });
      return res.status(203).send({ message: "Blog Not Added !!!" });
    });
};

// API for update the blog

exports.updateBlog = async (req, res) => {
  // //console.log(req.user)
  //console.log(req.files)

  // req.body.uuid = uuid.v4();

  if (req.files["banner_image"] !== undefined)
    req.body.card_image = `${process.env.Official}/${req.files["banner_image"][0].path}`;

  await blog
    .findOneAndUpdate({ _id: req.body._id }, req.body)
    .then((data) => {
      //console.log("Blog Update Successfully !!!");
      return res.send({ message: "Blog Update Successfully !!!" });
    })
    .catch((err) => {
      //console.log({ massage: "Blog Not Update !!!", err });
      return res.status(203).send({ message: "Blog Not Update !!!" });
    });
};

// Api for card extraction for Home

exports.getBlogHome = async (req, res) => {

  const pageNumber = req.query.pageNumber || 0

  try {
    let data = await blog
    .aggregate([
      { $match: {} },
      {
        $group: {
          _id: "$_id",
          uuid : {"$first": "$uuid"} ,
          title : {"$first": "$title"} ,
          card_image : {"$first": "$card_image"} ,
        },
      },
      { $sort: { timestamps: -1 } },
      { $skip: pageNumber > 0 ? (pageNumber - 1) * 10 : 0 },
      { $limit: 10  },
    ])

    // console.log(data)
    
    if(data) return res.send(data);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ massage: "Something Went Wrong !!!" });
  }
};

// get specific blog by uuid

exports.getBlog = async (req, res) => {
  //console.log(req.query)
  await blog
    .findOne({ uuid: req.query.uuid })
    .then((data) => {
      //console.log(data)
      res.send(data);
    })
    .catch((err) => {
      //console.log(err)
      return res.status("203").send({ message: "Something Went Wrong !!!" });
    });
};

// delete specific blog by uuid

exports.deleteBLog = async (req, res) => {
  console.log(req.query);
  await blog
    .deleteOne({ _id: req.query._id })
    .then((data) => {
      return res.send({ message: "Blog Deleted Successfully !!!" });
    })
    .catch((err) => {
      // console.log(err)
      return res.status("203").send({ message: "Something Went Wrong !!!" });
    });
};
