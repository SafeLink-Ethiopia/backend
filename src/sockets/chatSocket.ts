import { Server, Socket } from "socket.io";
import { ConversationService } from "../services/conversationService";

export function registerChatSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("join_conversation", ({ conversation_id }) => {
      socket.join(conversation_id);
    });

    socket.on("register_user", ({ session_id }) => {
      socket.join(`user:${session_id}`);
    });

    socket.on("register_advisor", ({ advisor_id }) => {
      socket.join(`advisor:${advisor_id}`);
    });

    socket.on("send_message", async ({ conversation_id, sender, text }) => {
      try {
        const { conversation, message } = await ConversationService.sendMessage(
          conversation_id,
          sender,
          text
        );

        // Broadcast to conversation room
        io.to(conversation_id).emit("new_message", { message, conversation });

        // Update lists for user and advisor
        io.to(`user:${conversation.session_id}`).emit("conversation_list_updated", conversation);
        if (conversation.advisor_id) {
          io.to(`advisor:${conversation.advisor_id}`).emit("conversation_list_updated", conversation);
          io.to(conversation_id).emit("advisor_assigned", { advisor_id: conversation.advisor_id });
        }
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });
  });
}