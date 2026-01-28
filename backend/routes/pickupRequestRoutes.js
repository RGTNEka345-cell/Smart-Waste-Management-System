const express = require("express");
const router = express.Router();
const uploadPickupPhotos = require("../middlewares/uploadPickupRequestPhotos");
const PickupRequestController = require("../controllers/PickupRequestController");

// Create pickup request (with optional photos)
router.post(
  "/pickup-requests",
  uploadPickupPhotos.array("photos", 3),
  PickupRequestController.createPickupRequest
);

module.exports = router;
