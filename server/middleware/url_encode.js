require("dotenv").config();

const multer = require("multer");


// middleware for the multer setup

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./upload/");
    },
    filename: function (req, file, cb) {
      cb(null, new Date().toISOString() + "_" + file.originalname);
    },
  });
  
  const fileFilter = (req, file, cb) => {
    // reject a file
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/svg" ||
      file.originalname.match(/\.(mp4|MPEG-4|mkv)$/)
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  // for image
  exports.upload = multer({
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    fileFilter: fileFilter,
  }).fields([
    { name: "images" },
    { name: "profile_image" },
    { name: "review_images" },
  ]);
  

  
  exports.jsonEncode = (req,res,next) => {
    try {
      let {
        price,
        length,
        breadth,
        height,
        material,
      } = req.query;

      if(price)
      {
        price= JSON.stringify(price)
        price= JSON.parse(price)
      }

      if(length)
      {
        length= JSON.stringify(length)
        length= JSON.parse(length)
      }

      if(breadth)
      {
        breadth= JSON.stringify(breadth)
        breadth= JSON.parse(breadth)
      }

      if(height)
      {
        height= JSON.stringify(height)
        height= JSON.parse(height)
      }

      if(material)
      {
        material= JSON.stringify(material)
        material= JSON.parse(material)
      }

req.data = {...req.query,price,
  length,
  breadth,
  height,
  material}
  
return next()
    } catch (error) {
      
    }
  };
  