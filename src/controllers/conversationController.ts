import { Request, Response } from "express";
import Conversation from "../models/Conversation";
import { ConversationService } from "../services/conversationService";

export const getUserConversations = async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const conversations = await Conversation.find({
    session_id: sessionId,
    hidden_for_user: false,
  }).sort({ last_message_at: -1 });
  res.json(conversations);
};

export const getAdvisorInbox = async (req: Request, res: Response) => {
  const { advisorId } = req.params;
  const conversations = await Conversation.find({
    advisor_id: advisorId,
    hidden_for_advisor: false,
  }).sort({ last_message_at: -1 });
  res.json(conversations);
};

export const initiateConversation = async (req: Request, res: Response) => {
  const { sessionId, advisorType } = req.body;
  const conversation = await ConversationService.getOrCreateUserConversation(sessionId, advisorType);
  res.json(conversation);
};