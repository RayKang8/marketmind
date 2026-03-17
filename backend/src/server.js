const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const chatRoutes = require("./routes/chatRoutes");
require("dotenv").config();

const prisma = require("./lib/prisma");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/watchlists", watchlistRoutes);
app.use("/api/chats", chatRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});