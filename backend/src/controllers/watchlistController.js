const prisma = require("../lib/prisma");

exports.createWatchlist = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Watchlist name is required" });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        name: name.trim(),
        userId: req.user.userId
      },
      include: {
        items: true
      }
    });

    res.status(201).json(watchlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create watchlist" });
  }
};

exports.getWatchlists = async (req, res) => {
  try {
    const watchlists = await prisma.watchlist.findMany({
      where: {
        userId: req.user.userId
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(watchlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch watchlists" });
  }
};

exports.addWatchlistItem = async (req, res) => {
  try {
    const { watchlistId } = req.params;
    const { ticker } = req.body;

    if (!ticker || !ticker.trim()) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: req.user.userId
      }
    });

    if (!watchlist) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    const item = await prisma.watchlistItem.create({
      data: {
        ticker: ticker.trim().toUpperCase(),
        watchlistId
      }
    });

    res.status(201).json(item);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Ticker already exists in this watchlist" });
    }

    console.error(error);
    res.status(500).json({ error: "Failed to add ticker" });
  }
};

exports.deleteWatchlistItem = async (req, res) => {
  try {
    const { watchlistId, itemId } = req.params;

    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: req.user.userId
      }
    });

    if (!watchlist) {
      return res.status(404).json({ error: "Watchlist not found" });
    }

    const item = await prisma.watchlistItem.findFirst({
      where: {
        id: itemId,
        watchlistId
      }
    });

    if (!item) {
      return res.status(404).json({ error: "Watchlist item not found" });
    }

    await prisma.watchlistItem.delete({
      where: {
        id: itemId
      }
    });

    res.json({ message: "Ticker removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove ticker" });
  }
};