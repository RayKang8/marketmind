const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getChats,
  createChat,
  getMessages,
  sendMessage,
  deleteChat,
} = require("../controllers/chatController");

router.get("/", authMiddleware, getChats);
router.post("/", authMiddleware, createChat);
router.get("/:chatId/messages", authMiddleware, getMessages);
router.post("/:chatId/messages", authMiddleware, sendMessage);
router.delete("/:chatId", authMiddleware, deleteChat);

module.exports = router;