const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/AdminController");
const WasteTypeController = require("../controllers/WasteTypeController");
const PickupRequestController = require("../controllers/PickupRequestController");
const adminAuth = require("../middlewares/adminAuth");
const {
  getPendingCollectors,
  approveOrRejectCollector,
  getApprovalHistory,
  getRejectionHistory
} = require("../controllers/adminCollectorController");

// Auth
router.post("/admin/login", AdminController.login);
router.post("/admin/forgot-password", AdminController.forgotPassword);
router.post("/admin/verify-otp", AdminController.verifyOtp);

// Waste Type Management (Admin only)
router.post("/admin/wastetypes", adminAuth, WasteTypeController.createWasteType);
router.get("/admin/wastetypes", adminAuth, WasteTypeController.getAllWasteTypes);
router.delete("/admin/wastetypes/:id", adminAuth, WasteTypeController.deleteWasteType);

// Collector Approvals (Admin only)
router.get("/admin/collectors/pending", adminAuth, getPendingCollectors);
router.post("/admin/collectors/approve", adminAuth, approveOrRejectCollector);
router.get("/admin/collectors/approved", adminAuth, getApprovalHistory);
router.get("/admin/collectors/rejected", adminAuth, getRejectionHistory);

// Pickup Requests (Admin only)
router.get(
  "/admin/pickup-requests/pending",
  adminAuth,
  PickupRequestController.getPendingPickupRequestsAdmin
);
router.post(
  "/admin/pickup-requests/:id/approve",
  adminAuth,
  PickupRequestController.approvePickupRequestAdmin
);
router.post(
  "/admin/pickup-requests/:id/reject",
  adminAuth,
  PickupRequestController.rejectPickupRequestAdmin
);

module.exports = router;
