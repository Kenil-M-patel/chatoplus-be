const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  last_message: String,
  last_message_time: Date,
});

// ✅ Prevent OverwriteModelError
const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
