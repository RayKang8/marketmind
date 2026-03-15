const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    res.json({
      message: "User created",
      userId: user.id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
};