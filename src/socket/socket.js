const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../db/models/user");
const Message = require("../db/models/message");
const Conversation = require("../db/models/conversation");

const userSocketMap = {};
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Set to your frontend URL in prod
      methods: ["GET", "POST"],
    },
  });

  // Middleware for JWT auth
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;
      const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
      socket.data.userId = decoded.id;
      socket.data.userName = decoded.user_name;
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message);
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;

    // Update online status
    await User.findByIdAndUpdate(userId, { is_online: true });
    io.emit("userStatus", { userId, isOnline: true });

    socket.join(`user:${userId}`);
    userSocketMap[userId] = socket.id;

    socket.on("joinChat", (receiverId) => {
      const room = [userId, receiverId].sort().join(":");
      socket.join(room);
    });

    socket.on("sendMessage", async ({ receiverId, text }) => {
      try {
        const sender = await User.findById(userId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
          return socket.emit("error", { message: "User not found" });
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

        const room = [userId, receiverId].sort().join(":");
        io.to(room).emit("message", {
          id: message._id,
          senderId: userId,
          text,
          timestamp: message.timestamp,
        });

        io.to(`user:${receiverId}`).emit("userUpdate", {
          userId,
          last_message: text,
          last_message_time: message.timestamp,
        });

        io.to(`user:${userId}`).emit("userUpdate", {
          userId: receiverId,
          last_message: text,
          last_message_time: message.timestamp,
        });
      } catch (error) {
        console.error("sendMessage error:", error.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ receiverId }) => {
      const room = [userId, receiverId].sort().join(":");
      socket.to(room).emit("typing", { userId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const room = [userId, receiverId].sort().join(":");
      socket.to(room).emit("stopTyping", { userId });
    });

    socket.on("disconnect", async () => {
      await User.findByIdAndUpdate(userId, { is_online: false });
      io.emit("userStatus", { userId, isOnline: false });
      delete userSocketMap[userId];
    });
  });

  console.log("✅ Socket.IO initialized");
};

module.exports = {
  initSocket,
  io: () => io,
  userSocketMap,
};
