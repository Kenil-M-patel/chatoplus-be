const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const  { sendErrorResponse, sendSuccessResponse } = require("../../../utils/response");
const User = require("../../../db/models/user");
const Conversation = require("../../../db/models/conversation");

const SALT_ROUNDS = 10; // bcrypt salt rounds

const register = async (req, res) => {
  try {
    const { username: user_name, email, password, profilePicture: image_url } = req.body;

    if (!user_name || !email || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Username, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "failed", message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ user_name, email, password: hashedPassword, image_url });
    await user.save();

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ status: "failed", message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: "failed", message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: "failed", message: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      user: {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ status: "failed", message: "Internal server error" });
  }
};

const getAllUsers = async (req, res) => {
  const userId = req.user?.id;

  try {
    const users = await User.find({ _id: { $ne: userId } }).select(
      "user_name email image_url is_online"
    );

    const conversations = await Conversation.find({
      $or: [{ user1: userId }, { user2: userId }],
    })
      .populate("user1", "id")
      .populate("user2", "id");

    const usersWithLastMessage = users.map((user) => {
      const conversation = conversations.find(
        (conv) =>
          (conv.user1._id.toString() === userId && conv.user2._id.toString() === user._id.toString()) ||
          (conv.user2._id.toString() === userId && conv.user1._id.toString() === user._id.toString())
      );

      return {
        id: user._id,
        user_name: user.user_name,
        email: user.email,
        image_url: user.image_url,
        is_online: user.is_online,
        last_message: conversation?.last_message || null,
        last_message_time: conversation?.last_message_time || null,
      };
    });

    return sendSuccessResponse(res, "Users fetched successfully", usersWithLastMessage);
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  getAllUsers,
};
