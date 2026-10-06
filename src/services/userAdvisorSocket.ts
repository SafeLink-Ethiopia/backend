import { Server, Socket } from "socket.io";
import { randomUUID } from "crypto";

import UserAdvisorConversation from "../models/UserAdvisorConversation";

interface JoinConversationData {
  conversation_id: string;
  session_id: string;
}

interface SendMessageData {
  conversation_id: string;
  session_id: string;
  text: string;
}

interface SendMessageResponse {
  success: boolean;
  message?: unknown;
  error?: string;
}

interface TypingData {
  conversation_id: string;
  sender: "user" | "advisor";
}

export const setupUserAdvisorSocket = (io: Server): void => {
  io.on("connection", (socket: Socket) => {
    console.log("[UserAdvisorSocket] Client connected:", socket.id);

    /*
     * Join a User ↔ Advisor conversation.
     */
    socket.on("user_advisor_join", async (data: JoinConversationData) => {
      try {
        const { conversation_id, session_id } = data;

        if (!conversation_id || !session_id) {
          socket.emit("user_advisor_error", {
            message: "conversation_id and session_id are required.",
          });

          return;
        }

        const conversation = await UserAdvisorConversation.findOne({
          conversation_id,
          session_id,
          status: "active",
        }).lean();

        if (!conversation) {
          socket.emit("user_advisor_error", {
            message: "Conversation not found.",
          });

          return;
        }

        /*
         * Join the Socket.IO room.
         */
        socket.join(conversation_id);

        console.log(
          `[UserAdvisorSocket] ${socket.id} joined ${conversation_id}`,
        );

        socket.emit("user_advisor_joined", {
          conversation_id,
          advisor_id: conversation.advisor_id,
          advisor_type: conversation.advisor_type,
        });
      } catch (error) {
        console.error("User advisor socket join error:", error);

        socket.emit("user_advisor_error", {
          message: "Failed to join conversation.",
        });
      }
    });

    /*
     * Send a message from the USER.
     *
     * IMPORTANT:
     * The third argument is the Socket.IO acknowledgement
     * callback. The frontend uses it to know that MongoDB
     * successfully saved the message.
     */
    socket.on(
      "user_advisor_send_message",
      async (
        data: SendMessageData,
        callback?: (response: SendMessageResponse) => void,
      ) => {
        try {
          const { conversation_id, session_id, text } = data;

          const cleanText = typeof text === "string" ? text.trim() : "";

          if (!conversation_id || !session_id || !cleanText) {
            const response: SendMessageResponse = {
              success: false,
              error: "conversation_id, session_id and text are required.",
            };

            if (callback) {
              callback(response);
            } else {
              socket.emit("user_advisor_error", {
                message: response.error,
              });
            }

            return;
          }

          /*
           * Verify that the conversation belongs
           * to this SafeLink session and is active.
           */
          const conversation = await UserAdvisorConversation.findOne({
            conversation_id,
            session_id,
            status: "active",
          });

          if (!conversation) {
            const response: SendMessageResponse = {
              success: false,
              error: "Active conversation not found.",
            };

            if (callback) {
              callback(response);
            } else {
              socket.emit("user_advisor_error", {
                message: response.error,
              });
            }

            return;
          }

          /*
           * Create the message.
           */
          const message = {
            message_id: randomUUID(),
            sender: "user" as const,
            text: cleanText,
            timestamp: new Date(),
            edited: false,
            deleted: false,
            deletedForUser: false,
            deletedForAdvisor: false,
            deletedForEveryone: false,
          };

          /*
           * Save to MongoDB.
           */
          conversation.messages.push(message);

          await conversation.save();

          console.log(
            `[UserAdvisorSocket] Message saved: ${message.message_id}`,
          );

          /*
           * Acknowledge the sender.
           *
           * This is what makes the message appear
           * immediately in the user's own chat.
           */
          if (callback) {
            callback({
              success: true,
              message,
            });
          }

          /*
           * Broadcast to everyone in the room.
           *
           * This sends the message to:
           * - the user
           * - the advisor
           *
           * The frontend has duplicate protection,
           * so the user will not see it twice.
           */
          io.to(conversation_id).emit("user_advisor_message", {
            conversation_id,
            message,
          });
        } catch (error) {
          console.error("User advisor socket send error:", error);

          const response: SendMessageResponse = {
            success: false,
            error: "Failed to send message.",
          };

          if (callback) {
            callback(response);
          } else {
            socket.emit("user_advisor_error", {
              message: response.error,
            });
          }
        }
      },
    );

    /*
     * Typing indicator.
     */
    socket.on("user_advisor_typing", (data: TypingData) => {
      if (!data?.conversation_id) {
        return;
      }

      socket.to(data.conversation_id).emit("user_advisor_typing", {
        conversation_id: data.conversation_id,
        sender: data.sender,
      });
    });

    /*
     * Stop typing indicator.
     */
    socket.on("user_advisor_stop_typing", (data: TypingData) => {
      if (!data?.conversation_id) {
        return;
      }

      socket.to(data.conversation_id).emit("user_advisor_stop_typing", {
        conversation_id: data.conversation_id,
        sender: data.sender,
      });
    });

    /*
     * Leave conversation room.
     */
    socket.on("user_advisor_leave", (conversation_id: string) => {
      if (conversation_id) {
        socket.leave(conversation_id);

        console.log(`[UserAdvisorSocket] ${socket.id} left ${conversation_id}`);
      }
    });

    /*
     * Disconnect.
     */
    socket.on("disconnect", (reason) => {
      console.log(
        "[UserAdvisorSocket] Client disconnected:",
        socket.id,
        reason,
      );
    });
  });
};
