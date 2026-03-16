const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createWatchlist,
  getWatchlists
} = require("../controllers/watchlistController");

router.post("/", authMiddleware, createWatchlist);
router.get("/", authMiddleware, getWatchlists);

module.exports = router;