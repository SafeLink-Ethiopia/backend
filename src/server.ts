import dotenv from "dotenv";
import dns from "node:dns";
import http from "http";
import crypto from "crypto";
import { Server } from "socket.io";

import app from "./app";
import connectDB from "./config/db";
import facilitiesRouter from "./routes/facilities";


app.use("/api/facilities", facilitiesRouter);
import AdminAdvisorConversation from "./models/AdminAdvisorConversation";

dotenv.config();

dns.setServers(["8.8.8.8"]);

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ============================================
  // JOIN CONVERSATION
  // ============================================
  socket.on("join_conversation", (conversation_id) => {
    if (!conversation_id) return;

    socket.join(conversation_id);

    console.log(`Socket ${socket.id} joined conversation ${conversation_id}`);
  });

  // ============================================
  // SEND MESSAGE
  // ============================================
  socket.on("send_message", async (data) => {
    try {
      if (
        !data ||
        !data.conversation_id ||
        !data.sender ||
        !data.text?.trim()
      ) {
        socket.emit("message_error", {
          message: "Invalid message data.",
        });
        return;
      }

      if (data.sender !== "admin" && data.sender !== "advisor") {
        socket.emit("message_error", {
          message: "Invalid sender.",
        });
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) {
        socket.emit("message_error", {
          message: "Conversation not found.",
        });
        return;
      }

      const message = {
        message_id: crypto.randomUUID(),
        sender: data.sender,
        text: data.text.trim(),
        timestamp: new Date(),

        edited: false,
        deleted: false,

        deletedForAdmin: false,
        deletedForAdvisor: false,
        deletedForEveryone: false,

        deliveredAt: new Date(),
      };

      conversation.messages.push(message);

      // A new message makes the conversation visible again
      // for both sides.
      conversation.deletedForAdmin = false;
      conversation.deletedForAdvisor = false;

      await conversation.save();

      io.to(data.conversation_id).emit("new_message", {
        conversation_id: data.conversation_id,
        message,
      });
    } catch (error) {
      console.error("Send message error:", error);

      socket.emit("message_error", {
        message: "Failed to send message.",
      });
    }
  });

  // ============================================
  // EDIT MESSAGE
  // ============================================
  socket.on("edit_message", async (data) => {
    try {
      if (
        !data ||
        !data.conversation_id ||
        !data.message_id ||
        !data.sender ||
        !data.text?.trim()
      ) {
        socket.emit("message_error", {
          message: "Invalid edit data.",
        });
        return;
      }

      if (data.sender !== "admin" && data.sender !== "advisor") {
        socket.emit("message_error", {
          message: "Invalid sender.",
        });
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) {
        socket.emit("message_error", {
          message: "Conversation not found.",
        });
        return;
      }

      const message = conversation.messages.find(
        (msg) => msg.message_id === data.message_id,
      );

      if (!message) {
        socket.emit("message_error", {
          message: "Message not found.",
        });
        return;
      }

      // Only the original sender can edit their own message.
      if (message.sender !== data.sender) {
        socket.emit("message_error", {
          message: "You can only edit your own messages.",
        });
        return;
      }

      // A message deleted for everyone cannot be edited.
      if (message.deleted || message.deletedForEveryone) {
        socket.emit("message_error", {
          message: "Deleted messages cannot be edited.",
        });
        return;
      }

      message.text = data.text.trim();
      message.edited = true;

      await conversation.save();

      io.to(data.conversation_id).emit("message_edited", {
        conversation_id: data.conversation_id,
        message,
      });
    } catch (error) {
      console.error("Edit message error:", error);

      socket.emit("message_error", {
        message: "Failed to edit message.",
      });
    }
  });

  // ============================================
  // DELETE MESSAGE
  //
  // deleteType:
  // "me"       -> Delete only for the current user
  // "everyone" -> Delete for both users
  // ============================================
  socket.on("delete_message", async (data) => {
    try {
      if (
        !data ||
        !data.conversation_id ||
        !data.message_id ||
        !data.sender ||
        !data.deleteType
      ) {
        socket.emit("message_error", {
          message: "Invalid delete data.",
        });
        return;
      }

      if (data.sender !== "admin" && data.sender !== "advisor") {
        socket.emit("message_error", {
          message: "Invalid sender.",
        });
        return;
      }

      if (data.deleteType !== "me" && data.deleteType !== "everyone") {
        socket.emit("message_error", {
          message: "Invalid delete type.",
        });
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) {
        socket.emit("message_error", {
          message: "Conversation not found.",
        });
        return;
      }

      const message = conversation.messages.find(
        (msg) => msg.message_id === data.message_id,
      );

      if (!message) {
        socket.emit("message_error", {
          message: "Message not found.",
        });
        return;
      }

      // Only the original sender can delete their own message.
      if (message.sender !== data.sender) {
        socket.emit("message_error", {
          message: "You can only delete your own messages.",
        });
        return;
      }

      // ==========================================
      // DELETE FOR ME
      // ==========================================
      if (data.deleteType === "me") {
        if (data.sender === "admin") {
          message.deletedForAdmin = true;
        }

        if (data.sender === "advisor") {
          message.deletedForAdvisor = true;
        }

        await conversation.save();

        // Only the user who requested "Delete for me"
        // receives this event.
        socket.emit("message_deleted_for_me", {
          conversation_id: data.conversation_id,
          message_id: data.message_id,
        });

        return;
      }

      // ==========================================
      // DELETE FOR EVERYONE
      // ==========================================
      if (data.deleteType === "everyone") {
        // IMPORTANT:
        // Do NOT change message.text.
        //
        // The original message stays in MongoDB.
        // The frontend will display:
        // "This message was deleted"
        // based on deletedForEveryone.
        message.deletedForEveryone = true;

        // Keep old field for backward compatibility.
        message.deleted = true;

        message.edited = false;

        await conversation.save();

        // Both admin and advisor receive the event.
        io.to(data.conversation_id).emit("message_deleted_for_everyone", {
          conversation_id: data.conversation_id,
          message_id: data.message_id,
        });

        return;
      }
    } catch (error) {
      console.error("Delete message error:", error);

      socket.emit("message_error", {
        message: "Failed to delete message.",
      });
    }
  });

  // ============================================
  // DELETE / HIDE WHOLE CONVERSATION
  // ============================================
  socket.on("delete_conversation", async (data) => {
    try {
      if (!data || !data.conversation_id || !data.sender) {
        socket.emit("message_error", {
          message: "Invalid conversation delete data.",
        });
        return;
      }

      if (data.sender !== "admin" && data.sender !== "advisor") {
        socket.emit("message_error", {
          message: "Invalid sender.",
        });
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) {
        socket.emit("message_error", {
          message: "Conversation not found.",
        });
        return;
      }

      // IMPORTANT:
      // We DO NOT delete the MongoDB document.

      if (data.sender === "admin") {
        conversation.deletedForAdmin = true;
      }

      if (data.sender === "advisor") {
        conversation.deletedForAdvisor = true;
      }

      await conversation.save();

      socket.emit("conversation_deleted", {
        conversation_id: data.conversation_id,
        deletedFor: data.sender,
      });
    } catch (error) {
      console.error("Delete conversation error:", error);

      socket.emit("message_error", {
        message: "Failed to delete conversation.",
      });
    }
  });

  // ============================================
  // MESSAGE DELIVERED
  // ============================================
  socket.on("mark_message_delivered", async (data) => {
    try {
      if (!data || !data.conversation_id || !data.message_id) {
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) return;

      const message = conversation.messages.find(
        (msg) => msg.message_id === data.message_id,
      );

      if (!message) return;

      if (!message.deliveredAt) {
        message.deliveredAt = new Date();

        await conversation.save();
      }

      io.to(data.conversation_id).emit("message_delivered", {
        conversation_id: data.conversation_id,
        message_id: data.message_id,
        deliveredAt: message.deliveredAt,
      });
    } catch (error) {
      console.error("Mark message delivered error:", error);
    }
  });

  // ============================================
  // MESSAGE READ
  // ============================================
  socket.on("mark_message_read", async (data) => {
    try {
      if (!data || !data.conversation_id || !data.message_id) {
        return;
      }

      const conversation = await AdminAdvisorConversation.findOne({
        conversation_id: data.conversation_id,
      });

      if (!conversation) return;

      const message = conversation.messages.find(
        (msg) => msg.message_id === data.message_id,
      );

      if (!message) return;

      if (!message.readAt) {
        message.readAt = new Date();

        await conversation.save();
      }

      io.to(data.conversation_id).emit("message_read", {
        conversation_id: data.conversation_id,
        message_id: data.message_id,
        readAt: message.readAt,
      });
    } catch (error) {
      console.error("Mark message read error:", error);
    }
  });

  // ============================================
  // DISCONNECT
  // ============================================
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server is ready`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
