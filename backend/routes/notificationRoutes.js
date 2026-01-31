const express = require("express");
const router = express.Router();
const NotificationController = require("../controllers/NotificationController");

router.get("/notifications", NotificationController.listNotifications);
router.patch("/notifications/:id/read", NotificationController.markRead);
router.patch("/notifications/read-all", NotificationController.markAllRead);

module.exports = router;
