const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/citizens/");
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "citizen-" + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowed.test(ext) && allowed.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const uploadCitizen = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

module.exports = uploadCitizen; // ✅ THIS LINE IS CRITICAL
