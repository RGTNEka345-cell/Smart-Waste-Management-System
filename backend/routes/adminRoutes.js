const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");

router.post("/admin/login", AdminController.login);
router.post("/admin/forgot-password", AdminController.forgotPassword);
router.post("/admin/verify-otp", AdminController.verifyOtp);

module.exports = router;
