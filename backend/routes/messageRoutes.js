const express = require("express");
const router = express.Router();
const MessageController = require("../controllers/MessageController");
const { requireMessageActor } = require("../utils/messageAuth");

router.use("/messages", requireMessageActor);

router.get("/messages/users", MessageController.listUsers);
router.get("/messages/conversations", MessageController.listConversations);
router.post("/messages/conversations", MessageController.createConversation);
router.get("/messages/conversations/:conversationId", MessageController.listMessages);
router.post("/messages/conversations/:conversationId", MessageController.sendMessage);
router.patch("/messages/conversations/:conversationId/read", MessageController.markRead);

module.exports = router;
