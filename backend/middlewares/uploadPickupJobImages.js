const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "pickup_jobs");

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "job-" + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype || "";

  const allowedExt = /(\.jpeg|\.jpg|\.png|\.gif|\.webp|\.heic|\.heif)$/i;
  const isImageMime = mime.startsWith("image/");
  const extOk = ext === "" ? true : allowedExt.test(ext);

  if (isImageMime && extOk) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const uploadPickupJobImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6
  },
  fileFilter
});

module.exports = uploadPickupJobImages;
