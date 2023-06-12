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
  