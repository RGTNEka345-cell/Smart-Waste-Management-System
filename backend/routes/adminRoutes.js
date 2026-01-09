const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/AdminController");
const WasteTypeController = require("../controllers/WasteTypeController");
const adminAuth = require("../middlewares/adminAuth");

// Auth
router.post("/admin/login", AdminController.login);
router.post("/admin/forgot-password", AdminController.forgotPassword);
router.post("/admin/verify-otp", AdminController.verifyOtp);

// Waste Type Management (Admin only)
router.post("/admin/wastetypes", adminAuth, WasteTypeController.createWasteType);
router.get("/admin/wastetypes", adminAuth, WasteTypeController.getAllWasteTypes);
router.delete("/admin/wastetypes/:id", adminAuth, WasteTypeController.deleteWasteType);

module.exports = router;
