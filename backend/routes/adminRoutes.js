const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/AdminController");
const WasteTypeController = require("../controllers/WasteTypeController");
const EcoTipController = require("../controllers/EcoTipController");
const PickupRequestController = require("../controllers/PickupRequestController");
const AdminCitizenController = require("../controllers/AdminCitizenController");
const IllegalDumpingAdminController = require("../controllers/IllegalDumpingAdminController");
const WebsiteSettingsController = require("../controllers/WebsiteSettingsController");
const adminAuth = require("../middlewares/adminAuth");
const uploadAdminPhoto = require("../middlewares/uploadAdminPhoto");
const uploadEcoTipImage = require("../middlewares/uploadEcoTipImage");
const uploadWebsiteLogo = require("../middlewares/uploadWebsiteLogo");
const 
{
  getPendingCollectors,
  approveOrRejectCollector,
  getApprovalHistory,
  getRejectionHistory
} = require("../controllers/adminCollectorController");

// Auth
router.post("/admin/login", AdminController.login);
router.post("/admin/forgot-password", AdminController.forgotPassword);
router.post("/admin/verify-otp", AdminController.verifyOtp);
router.get("/public/stats", AdminController.getPublicStats);
router.get("/site/logo", WebsiteSettingsController.getSiteLogo);
router.get("/admin/stats", adminAuth, AdminController.getAdminStats);
router.get("/admin/profile", adminAuth, AdminController.getProfile);
router.post("/admin/profile/request-otp", adminAuth, AdminController.requestProfileOtp);
router.put("/admin/profile", adminAuth, uploadAdminPhoto.single("photo"), AdminController.updateProfile);
router.post("/admin/sub-admins", adminAuth, uploadAdminPhoto.single("photo"), AdminController.createSubAdmin);

// Waste Type Management (Admin only)
router.post("/admin/wastetypes", adminAuth, WasteTypeController.createWasteType);
router.get("/admin/wastetypes", adminAuth, WasteTypeController.getAllWasteTypes);
router.delete("/admin/wastetypes/:id", adminAuth, WasteTypeController.deleteWasteType);
router.post(
  "/admin/eco-tips",
  adminAuth,
  uploadEcoTipImage.single("image"),
  EcoTipController.createEcoTip
);
router.get("/eco-tips", EcoTipController.listEcoTips);
router.post(
  "/admin/update-logo",
  adminAuth,
  uploadWebsiteLogo.single("logo"),
  WebsiteSettingsController.updateSiteLogo
);

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
router.get(
  "/admin/pickup-requests",
  adminAuth,
  PickupRequestController.listPickupRequestsAdmin
);
router.get(
  "/admin/pickup-requests/:id",
  adminAuth,
  PickupRequestController.getPickupRequestDetailsAdmin
);
router.get(
  "/admin/pickup-requests-search",
  adminAuth,
  PickupRequestController.searchPickupRequestByCitizenAdmin
);
router.get(
  "/admin/pickup-requests-latest",
  adminAuth,
  PickupRequestController.getLatestPickupRequestAdmin
);

// Citizens (Admin only)
router.get("/admin/citizens", adminAuth, AdminCitizenController.listCitizens);
router.get("/admin/citizens/:id", adminAuth, AdminCitizenController.getCitizenDetails);

// Illegal Dumping (Admin only)
router.get("/admin/illegal-dumping", adminAuth, IllegalDumpingAdminController.getQueue);
router.get("/admin/illegal-dumping/history", adminAuth, IllegalDumpingAdminController.getHistory);
router.post("/admin/illegal-dumping/:id/approve", adminAuth, IllegalDumpingAdminController.approve);
router.post("/admin/illegal-dumping/:id/reject", adminAuth, IllegalDumpingAdminController.reject);

module.exports = router;
