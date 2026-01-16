const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const CollectorController = require("../controllers/CollectorController");
const WasteTypeController = require("../controllers/WasteTypeController");
const CollectorAuthController = require("../controllers/CollectorAuthController");

// Registration
router.post(
  "/collectors/register",
  upload.single("vehicle_photo"),
  CollectorController.registerCollector
);

// OTP Authentication Routes
router.post("/collectors/request-otp", CollectorAuthController.requestOTP);
router.post("/collectors/verify-otp", CollectorAuthController.verifyOTP);
router.post("/collectors/resend-otp", CollectorAuthController.resendOTP);

// Email + Password Login
router.post("/collectors/login-password", CollectorAuthController.loginWithPassword);

// Password Management
router.post("/collectors/forgot-password", CollectorAuthController.forgotPassword);
router.post("/collectors/reset-password", CollectorAuthController.resetPassword);
router.post("/collectors/change-password", CollectorAuthController.changePassword);

// Logout
router.post("/collectors/logout", CollectorAuthController.logout);

// Waste Types
router.get("/waste-types", WasteTypeController.getAllWasteTypes);

module.exports = router;