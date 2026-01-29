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

// My pickup requests list
router.get("/pickup-requests/my", PickupRequestController.getMyPickupRequests);

// Pickup request details
router.get("/pickup-requests/:id", PickupRequestController.getPickupRequestDetails);

// Cancel pickup request (before accepted)
router.patch("/pickup-requests/:id/cancel", PickupRequestController.cancelPickupRequest);

module.exports = router;
