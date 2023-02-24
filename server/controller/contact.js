require("dotenv").config();

const contact = require("../../database/models/contact");

exports.addContact = async (req, res) => {
  try {
    console.log(req.files);

    let image = [];
    if (req.files["images"]) {
      req.files["images"].map((row) => {
        image.push(`${process.env.IMG_URL}/${row.path}`);
      });
    }

    req.body.images = image;
    console.log(req.body);

    let data = contact(req.body);

    data = await data.save();

    if (data) {
      return res.send({ message: "Thanks you contacting us." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Something went wrong !!!");
  }
};
