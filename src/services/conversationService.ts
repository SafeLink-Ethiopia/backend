import Conversation, { IConversation, IMessage } from "../models/Conversation";
import { findEligibleAdvisor } from "./assignmentService";
import { v4 as uuidv4 } from "uuid";

export class ConversationService {
  static async getOrCreateUserConversation(
    sessionId: string,
    advisorType: "medical" | "legal" | "psychological" | "general"
  ): Promise<IConversation> {
    let conv = await Conversation.findOne({ session_id: sessionId, advisor_type: advisorType });
    if (conv) return conv;

    const advisorId = await findEligibleAdvisor(advisorType);

    conv = await Conversation.create({
      conversation_id: uuidv4(),
      session_id: sessionId,
      advisor_id: advisorId,
      advisor_type: advisorType,
      urgent: false,
      hidden_for_user: false,
      hidden_for_advisor: false,
      created_at: new Date(),
      last_message_at: new Date(),
      messages: [],
      suggested_advisor_types: [],
    });

    return conv;
  }

  static async sendMessage(
    conversationId: string,
    sender: "user" | "advisor",
    text: string
  ): Promise<{ conversation: IConversation; message: IMessage }> {
    const conv = await Conversation.findOne({ conversation_id: conversationId });
    if (!conv) throw new Error("Conversation not found");

    // Retry advisor assignment if conversation is still unassigned
    if (!conv.advisor_id && sender === "user") {
      const assignedId = await findEligibleAdvisor(conv.advisor_type);
      if (assignedId) conv.advisor_id = assignedId;
    }

    const newMessage: IMessage = {
      message_id: uuidv4(),
      sender,
      text,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      deleted_for_user: false,
      deleted_for_advisor: false,
    };

    conv.messages.push(newMessage);
    conv.last_message_at = newMessage.timestamp;
    await conv.save();

    return { conversation: conv, message: newMessage };
  }
}