// routes/citizenRoutes.js
const express = require("express");
const router = express.Router();
const path = require('path');
const multer = require('multer');
const CitizenController = require("../controllers/CitizenController");
const { registerValidator } = require("../middlewares/validator");
const uploadCitizen = require("../middlewares/uploadCitizenPhoto");
const uploadIllegalDumpingPhotos = require("../middlewares/uploadIllegalDumpingPhotos");
const IllegalDumpingController = require("../controllers/IllegalDumpingController");


// Multer setup for optional photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});


const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware to only run multer when multipart/form-data
const conditionalUpload = (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.startsWith('multipart/form-data')) {
    return upload.single('photo')(req, res, next);
  }
  next();
};


// POST /api/citizen/register
router.post("/citizen/register", conditionalUpload, registerValidator, CitizenController.register);

// POST /api/citizen/verify-otp
router.post("/citizen/verify-otp", CitizenController.verifyOtp);

// POST /api/citizen/resend-otp
router.post("/citizen/resend-otp", CitizenController.resendOtp);

// POST /api/citizen/login
router.post("/citizen/login", CitizenController.login);

// POST /api/citizen/forgot-password
router.post("/citizen/forgot-password", CitizenController.forgotPassword);

// POST /api/citizen/reset-password
router.post("/citizen/reset-password", CitizenController.resetPassword);

// PUT /api/citizen/update-profile/:id
router.put(
  "/citizen/update-profile/:id",
  uploadCitizen.single("photo"), // ✅ MUST be .single()
  CitizenController.updateProfile // ✅ function
);


// Illegal Dumping (Citizen)
router.post(
  "/illegal-dumping",
  uploadIllegalDumpingPhotos.array("before_photos", 3),
  IllegalDumpingController.createReport
);
router.get("/illegal-dumping/my", IllegalDumpingController.getMyReports);

module.exports = router;

