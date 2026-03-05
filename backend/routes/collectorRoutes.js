const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const CollectorController = require("../controllers/CollectorController");
const WasteTypeController = require("../controllers/WasteTypeController");
const CollectorAuthController = require("../controllers/CollectorAuthController");
const CollectorOffersController = require("../controllers/CollectorOffersController");
const CollectorJobsController = require("../controllers/CollectorJobsController");
const CollectorActiveJobController = require("../controllers/CollectorActiveJobController");
const IllegalDumpingCollectorController = require("../controllers/IllegalDumpingCollectorController");
const collectorAuth = require("../middlewares/collectorAuth");
const uploadPickupJobImages = require("../middlewares/uploadPickupJobImages");
const uploadIllegalDumpingPhotos = require("../middlewares/uploadIllegalDumpingPhotos");

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

// Collector Profile (View/Update)
router.get("/collector/profile", collectorAuth, CollectorController.getProfile);
router.put(
  "/collector/profile",
  collectorAuth,
  upload.single("vehicle_photo"),
  CollectorController.updateProfile
);

// Pickup Offers (Collector)
router.get("/collector/offers", collectorAuth, CollectorOffersController.listOffers);
router.post("/collector/offers/:id/accept", collectorAuth, CollectorOffersController.acceptOffer);
router.post("/collector/offers/:id/reject", collectorAuth, CollectorOffersController.rejectOffer);

// Active Job (Collector)
router.get("/collector/active-job", collectorAuth, CollectorActiveJobController.getActiveJob);
router.get("/collector/dashboard/stats", collectorAuth, CollectorJobsController.getDashboardStats);

// Pickup Jobs (Collector)
router.post("/collector/jobs/:id/start", collectorAuth, CollectorJobsController.startJob);
router.post("/collector/jobs/:id/arrived", collectorAuth, CollectorJobsController.arriveJob);
router.post(
  "/collector/jobs/:id/complete",
  collectorAuth,
  uploadPickupJobImages.array("images", 6),
  CollectorJobsController.completeJob
);

// Illegal Dumping (Collector)
router.get("/collector/illegal-dumping/offers", collectorAuth, IllegalDumpingCollectorController.listOffers);
router.post("/collector/illegal-dumping/offers/:id/accept", collectorAuth, IllegalDumpingCollectorController.acceptOffer);
router.post("/collector/illegal-dumping/offers/:id/reject", collectorAuth, IllegalDumpingCollectorController.rejectOffer);
router.get("/collector/illegal-dumping/active", collectorAuth, IllegalDumpingCollectorController.getActiveJob);
router.post("/collector/illegal-dumping/:id/start", collectorAuth, IllegalDumpingCollectorController.startJob);
router.post(
  "/collector/illegal-dumping/:id/complete",
  collectorAuth,
  uploadIllegalDumpingPhotos.array("after_photos", 3),
  IllegalDumpingCollectorController.completeJob
);

module.exports = router;
