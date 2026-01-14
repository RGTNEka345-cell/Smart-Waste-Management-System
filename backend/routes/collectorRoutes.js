const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const CollectorController = require("../controllers/CollectorController");
const WasteTypeController = require("../controllers/WasteTypeController");

// Auth
router.post(
  "/collectors/register",
  upload.single("vehicle_photo"),
  CollectorController.registerCollector
);

router.post("/collectors/login", CollectorController.loginCollector);

// Waste Types
router.get("/waste-types", WasteTypeController.getAllWasteTypes);

module.exports = router;
