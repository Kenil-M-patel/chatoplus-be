const Message = require("../../../db/models/message");
const  { sendErrorResponse, sendSuccessResponse } = require("../../../utils/response");
const Conversation = require("../../../db/models/conversation");
const { io } = require("../../../socket/socket");
const User = require("../../../db/models/user");

const getMessagesBetweenUsers = async (req, res) => {
  const userId = req.user?.id;

  try {
    const { selectedUserId } = req.query;

    console.log('selectedUserId', selectedUserId);
    console.log('userId', userId);

    if (!selectedUserId) {
      return sendErrorResponse(res, 400, "selectedUserId is required");
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: selectedUserId },
        { sender: selectedUserId, receiver: userId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate("sender", "id");

    const formattedMessages = messages.map((msg) => ({
      id: msg._id,
      senderId: msg.sender._id ?? msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
    }));
    return sendSuccessResponse(res, "Messages fetched successfully", formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};

const sendMessage = async (req, res) => {
  const userId = req.user?.id;
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) {
      return sendErrorResponse(res, 400, "receiverId and text are required");
    }
    const sender = await User.findById(userId);
    const receiver = await User.findById(receiverId);
    if (!sender || !receiver) {
      return sendErrorResponse(res, 404, "User not found");
    }
    const message = new Message({
      text,
      sender: sender._id,
      receiver: receiver._id,
      timestamp: new Date(),
    });
    await message.save();
    let conversation = await Conversation.findOne({
      $or: [
        { user1: sender._id, user2: receiver._id },
        { user1: receiver._id, user2: sender._id },
      ],
    });
    if (!conversation) {
      conversation = new Conversation({
        user1: sender._id,
        user2: receiver._id,
        last_message: text,
        last_message_time: new Date(),
      });
    } else {
      conversation.last_message = text;
      conversation.last_message_time = new Date();
    }
    await conversation.save();
    // Emit to receiver via socket
    const room = [userId.toString(), receiverId.toString()].sort().join(":");
    io().to(room).emit("message", {
      id: message._id,
      senderId: userId,
      text,
      timestamp: message.timestamp,
    });
    io().to(`user:${receiverId}`).emit("userUpdate", {
      userId,
      last_message: text,
      last_message_time: message.timestamp,
    });
    io().to(`user:${userId}`).emit("userUpdate", {
      userId: receiverId,
      last_message: text,
      last_message_time: message.timestamp,
    });
    return sendSuccessResponse(res, "Message sent successfully", {
      id: message._id,
      senderId: userId,
      text,
      timestamp: message.timestamp,
    });
  } catch (error) {
    console.error("sendMessage API error:", error);
    return sendErrorResponse(res, 500, "Internal server error");
  }
};


module.exports = {
  getMessagesBetweenUsers,
  sendMessage,
}

