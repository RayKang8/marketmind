const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createWatchlist,
  getWatchlists,
  addWatchlistItem,
  deleteWatchlistItem,
  deleteWatchlist
} = require("../controllers/watchlistController");

router.post("/", authMiddleware, createWatchlist);
router.get("/", authMiddleware, getWatchlists);

router.post("/:watchlistId/items", authMiddleware, addWatchlistItem);
router.delete("/:watchlistId/items/:itemId", authMiddleware, deleteWatchlistItem);

router.delete("/:watchlistId", authMiddleware, deleteWatchlist);

module.exports = router;