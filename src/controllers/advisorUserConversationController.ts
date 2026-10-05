import { Response } from "express";
import { randomUUID } from "crypto";

import UserAdvisorConversation from "../models/UserAdvisorConversation";
import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";

/**
 * Get all User ↔ Advisor conversations assigned to
 * the authenticated advisor.
 */
export const getAdvisorUserConversations = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    const conversations = await UserAdvisorConversation.find({
      advisor_id,
      deletedForAdvisor: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .lean();

    const filteredConversations = conversations.map((conversation) => ({
      ...conversation,

      messages: conversation.messages.filter(
        (message) => !message.deletedForAdvisor,
      ),
    }));

    res.status(200).json({
      conversations: filteredConversations,
    });
  } catch (error) {
    console.error("Get advisor user conversations error:", error);

    res.status(500).json({
      message: "Failed to retrieve user conversations.",
    });
  }
};

/**
 * Get one User ↔ Advisor conversation.
 *
 * The advisor can only access conversations assigned
 * to their own advisor_id.
 */
export const getAdvisorUserConversation = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id
        : null;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    if (!conversation_id) {
      res.status(400).json({
        message: "conversation_id is required.",
      });
      return;
    }

    const conversation = await UserAdvisorConversation.findOne({
      conversation_id,
      advisor_id,
      deletedForAdvisor: { $ne: true },
    }).lean();

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found.",
      });
      return;
    }

    const filteredConversation = {
      ...conversation,

      messages: conversation.messages.filter(
        (message) => !message.deletedForAdvisor,
      ),
    };

    res.status(200).json({
      conversation: filteredConversation,
    });
  } catch (error) {
    console.error("Get advisor user conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversation.",
    });
  }
};

/**
 * Send a message from the Advisor.
 *
 * The backend verifies that this conversation belongs
 * to the authenticated advisor.
 */
export const sendAdvisorUserMessage = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id
        : null;

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    if (!conversation_id) {
      res.status(400).json({
        message: "conversation_id is required.",
      });
      return;
    }

    if (!text) {
      res.status(400).json({
        message: "Message text is required.",
      });
      return;
    }

    const conversation = await UserAdvisorConversation.findOne({
      conversation_id,
      advisor_id,
      status: "active",
      deletedForAdvisor: { $ne: true },
    });

    if (!conversation) {
      res.status(404).json({
        message: "Active conversation not found or not assigned to you.",
      });
      return;
    }

    const message = {
      message_id: randomUUID(),
      sender: "advisor" as const,
      text,
      timestamp: new Date(),
      edited: false,
      deleted: false,
      deletedForUser: false,
      deletedForAdvisor: false,
      deletedForEveryone: false,
    };

    conversation.messages.push(message);

    await conversation.save();

    res.status(201).json({
      message: "Message sent successfully.",
      data: message,
      conversation_id,
    });
  } catch (error) {
    console.error("Send advisor user message error:", error);

    res.status(500).json({
      message: "Failed to send message.",
    });
  }
};

/**
 * Close a User ↔ Advisor conversation.
 *
 * The advisor can only close conversations assigned
 * to themselves.
 */
export const closeAdvisorUserConversation = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const advisor_id = req.advisor?.advisor_id;

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id
        : null;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    if (!conversation_id) {
      res.status(400).json({
        message: "conversation_id is required.",
      });
      return;
    }

    const conversation = await UserAdvisorConversation.findOneAndUpdate(
      {
        conversation_id,
        advisor_id,
        status: "active",
      },
      {
        $set: {
          status: "closed",
        },
      },
      {
        new: true,
      },
    ).lean();

    if (!conversation) {
      res.status(404).json({
        message: "Active conversation not found or not assigned to you.",
      });
      return;
    }

    res.status(200).json({
      message: "Conversation closed successfully.",
      conversation,
    });
  } catch (error) {
    console.error("Close advisor user conversation error:", error);

    res.status(500).json({
      message: "Failed to close conversation.",
    });
  }
};
