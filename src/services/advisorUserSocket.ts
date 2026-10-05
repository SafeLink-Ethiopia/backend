import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";

import UserAdvisorConversation from "../models/UserAdvisorConversation";
import Advisor from "../models/Advisor";

interface JoinData {
  conversation_id: string;
  advisor_id: string;
}

interface SendMessageData {
  conversation_id: string;
  advisor_id: string;
  text: string;
}

interface TypingData {
  conversation_id: string;
  sender: "user" | "advisor";
}

export const setupAdvisorUserSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    /*
     * Advisor joins a specific User ↔ Advisor conversation.
     *
     * The backend verifies that the conversation is actually
     * assigned to this advisor.
     */
    socket.on("advisor_user_join", async (data: JoinData) => {
      try {
        const { conversation_id, advisor_id } = data;

        if (!conversation_id || !advisor_id) {
          socket.emit("advisor_user_error", {
            message: "conversation_id and advisor_id are required.",
          });
          return;
        }

        /*
         * Verify that the advisor exists and is active.
         */
        const advisor = await Advisor.findOne({
          advisor_id,
          active: true,
        }).lean();

        if (!advisor) {
          socket.emit("advisor_user_error", {
            message: "Advisor not found.",
          });
          return;
        }

        /*
         * Verify the conversation is assigned to
         * this exact advisor.
         */
        const conversation = await UserAdvisorConversation.findOne({
          conversation_id,
          advisor_id,
          status: "active",
        }).lean();

        if (!conversation) {
          socket.emit("advisor_user_error", {
            message: "Conversation not found or not assigned to this advisor.",
          });
          return;
        }

        socket.join(conversation_id);

        socket.emit("advisor_user_joined", {
          conversation_id,
          session_id: conversation.session_id,
          advisor_id: conversation.advisor_id,
          advisor_type: conversation.advisor_type,
        });
      } catch (error) {
        console.error("Advisor user socket join error:", error);

        socket.emit("advisor_user_error", {
          message: "Failed to join conversation.",
        });
      }
    });

    /*
     * Advisor sends a message to the user.
     */
    socket.on("advisor_user_send_message", async (data: SendMessageData) => {
      try {
        const { conversation_id, advisor_id, text } = data;

        const cleanText = typeof text === "string" ? text.trim() : "";

        if (!conversation_id || !advisor_id || !cleanText) {
          socket.emit("advisor_user_error", {
            message: "conversation_id, advisor_id and text are required.",
          });
          return;
        }

        /*
         * Verify that this conversation belongs to
         * this advisor.
         */
        const conversation = await UserAdvisorConversation.findOne({
          conversation_id,
          advisor_id,
          status: "active",
          deletedForAdvisor: { $ne: true },
        });

        if (!conversation) {
          socket.emit("advisor_user_error", {
            message: "Conversation not found or not assigned to you.",
          });
          return;
        }

        const message = {
          message_id: randomUUID(),
          sender: "advisor" as const,
          text: cleanText,
          timestamp: new Date(),
          edited: false,
          deleted: false,
          deletedForUser: false,
          deletedForAdvisor: false,
          deletedForEveryone: false,
        };

        conversation.messages.push(message);

        await conversation.save();

        /*
         * Deliver immediately to the user.
         */
        io.to(conversation_id).emit("user_advisor_message", {
          conversation_id,
          message,
        });
      } catch (error) {
        console.error("Advisor user socket message error:", error);

        socket.emit("advisor_user_error", {
          message: "Failed to send message.",
        });
      }
    });

    /*
     * Advisor typing indicator.
     */
    socket.on("advisor_user_typing", (data: TypingData) => {
      if (!data?.conversation_id) {
        return;
      }

      socket.to(data.conversation_id).emit("advisor_user_typing", {
        conversation_id: data.conversation_id,
        sender: "advisor",
      });
    });

    /*
     * Advisor stopped typing.
     */
    socket.on("advisor_user_stop_typing", (data: TypingData) => {
      if (!data?.conversation_id) {
        return;
      }

      socket.to(data.conversation_id).emit("advisor_user_stop_typing", {
        conversation_id: data.conversation_id,
        sender: "advisor",
      });
    });

    /*
     * Advisor leaves the conversation room.
     */
    socket.on("advisor_user_leave", (conversation_id: string) => {
      if (conversation_id) {
        socket.leave(conversation_id);
      }
    });
  });
};
