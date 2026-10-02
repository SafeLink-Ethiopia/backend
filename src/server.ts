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
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join_conversation", (conversation_id: string) => {
    if (!conversation_id) {
      return;
    }

    socket.join(conversation_id);

    console.log(`Socket ${socket.id} joined conversation ${conversation_id}`);
  });

  socket.on(
    "send_message",
    async (data: {
      conversation_id: string;
      sender: "admin" | "advisor";
      text: string;
    }) => {
      try {
        if (
          !data ||
          !data.conversation_id ||
          !data.sender ||
          !data.text?.trim()
        ) {
          socket.emit("message_error", {
            message: "conversation_id, sender, and text are required.",
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
        };

        conversation.messages.push(message);

        await conversation.save();

        io.to(data.conversation_id).emit("new_message", {
          conversation_id: data.conversation_id,
          message,
        });
      } catch (error) {
        console.error("Socket message error:", error);

        socket.emit("message_error", {
          message: "Failed to send message.",
        });
      }
    },
  );

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const startServer = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`SafeLink server running on port ${PORT}`);
  });
};

startServer();
