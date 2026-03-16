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