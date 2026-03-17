const prisma = require("../lib/prisma");

exports.getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: {
        userId: req.user.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

exports.createChat = async (req, res) => {
  try {
    const { title } = req.body;

    const chat = await prisma.chat.create({
      data: {
        title: title?.trim() || "New Chat",
        userId: req.user.userId,
      },
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create chat" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: req.user.userId,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: req.user.userId,
      },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const selectedWatchlist = await prisma.watchlist.findFirst({
      where: {
        userId: req.user.userId,
      },
      include: {
        items: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const previousMessages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
    });

    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: "user",
        content: content.trim(),
      },
    });

    let assistantReply = "Sorry, I could not generate a response right now.";

    try {
      const aiRes = await fetch(`${process.env.AI_SERVICE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content.trim(),
          watchlist_name: selectedWatchlist?.name || null,
          tickers: selectedWatchlist?.items?.map((item) => item.ticker) || [],
          history: previousMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const aiData = await aiRes.json();

      if (aiRes.ok && aiData.reply) {
        assistantReply = aiData.reply;
      } else {
        console.error("AI service error:", aiData);
      }
    } catch (aiError) {
      console.error("AI service request failed:", aiError);
    }

    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: "assistant",
        content: assistantReply,
      },
    });

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        updatedAt: new Date(),
        title:
          chat.title === "New Chat"
            ? content.trim().slice(0, 40)
            : chat.title,
      },
    });

    res.status(201).json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};