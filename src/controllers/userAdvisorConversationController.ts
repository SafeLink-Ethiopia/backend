import { Request, Response } from "express";
import { randomUUID } from "crypto";

import UserAdvisorConversation from "../models/UserAdvisorConversation";
import Advisor, { AdvisorType } from "../models/Advisor";
import { Session } from "../models/Session";

const VALID_ADVISOR_TYPES: AdvisorType[] = [
  "general",
  "legal",
  "medical",
  "psychological",
];

/**
 * Get the SafeLink session ID.
 *
 * IMPORTANT:
 * The frontend sends the SafeLink ID, which is stored in
 * Session.safelink_id.
 *
 * It is NOT MongoDB's _id.
 */
const getSessionId = (req: Request): string | null => {
  const bodySessionId =
    typeof req.body?.session_id === "string"
      ? req.body.session_id.trim()
      : null;

  const querySessionId =
    typeof req.query?.session_id === "string"
      ? req.query.session_id.trim()
      : null;

  const paramsSessionId =
    typeof req.params?.session_id === "string"
      ? req.params.session_id.trim()
      : null;

  return bodySessionId || querySessionId || paramsSessionId || null;
};

/**
 * Validate advisor type.
 */
const isValidAdvisorType = (type: string): type is AdvisorType => {
  return VALID_ADVISOR_TYPES.includes(type as AdvisorType);
};

/**
 * Start or continue an advisor conversation.
 *
 * IMPORTANT:
 *
 * For each:
 *
 *     session_id + advisor_type
 *
 * there can be only ONE active conversation.
 *
 * If an active conversation already exists,
 * we return it without assigning another advisor.
 *
 * This guarantees that refreshing/reopening the
 * conversation keeps the same advisor.
 */
export const startConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session_id = getSessionId(req);

    const advisor_type =
      typeof req.body?.advisor_type === "string"
        ? req.body.advisor_type.trim()
        : "";

    /*
     * --------------------------------------------
     * Validate session ID
     * --------------------------------------------
     */
    if (!session_id) {
      res.status(400).json({
        message: "session_id is required.",
      });
      return;
    }

    /*
     * --------------------------------------------
     * Validate advisor type
     * --------------------------------------------
     */
    if (!advisor_type || !isValidAdvisorType(advisor_type)) {
      res.status(400).json({
        message:
          "Valid advisor_type is required: general, legal, medical, or psychological.",
      });
      return;
    }

    /*
     * --------------------------------------------
     * Verify the SafeLink session
     * --------------------------------------------
     *
     * IMPORTANT:
     *
     * The frontend sends safelink_id.
     *
     * Therefore we MUST search:
     *
     *     { safelink_id: session_id }
     *
     * NOT:
     *
     *     { _id: session_id }
     */
    const session = await Session.findOne({
      safelink_id: session_id,
    }).lean();

    if (!session) {
      res.status(404).json({
        message: "SafeLink session not found.",
      });
      return;
    }

    /*
     * --------------------------------------------
     * Check for an existing active conversation
     * --------------------------------------------
     *
     * This is extremely important.
     *
     * If the user already talked to a General Advisor,
     * we return the SAME conversation and SAME advisor.
     *
     * We do NOT assign a new advisor.
     */
    const existingConversation = await UserAdvisorConversation.findOne({
      session_id,
      advisor_type,
      status: "active",
    }).lean();

    if (existingConversation) {
      res.status(200).json({
        message: "Existing conversation found.",
        conversation: existingConversation,
        existing: true,
      });
      return;
    }

    /*
     * --------------------------------------------
     * Find an available advisor
     * --------------------------------------------
     */
    const advisor = await Advisor.findOne({
      type: advisor_type,
      active: true,
    }).lean();

    if (!advisor) {
      res.status(404).json({
        message: `No active ${advisor_type} advisor is currently available.`,
      });
      return;
    }

    /*
     * --------------------------------------------
     * Create new conversation
     * --------------------------------------------
     *
     * The selected advisor_id is stored permanently
     * on this conversation.
     */
    const conversation = await UserAdvisorConversation.create({
      conversation_id: randomUUID(),

      session_id,

      advisor_id: advisor.advisor_id,

      advisor_type,

      status: "active",

      deletedForUser: false,

      deletedForAdvisor: false,

      messages: [],

      suggested_advisor_types: [],
    });

    res.status(201).json({
      message: "Conversation created successfully.",
      conversation,
      existing: false,
    });
  } catch (error: any) {
    console.error("Start user-advisor conversation error:", error);

    /*
     * --------------------------------------------
     * Handle duplicate active conversation
     * --------------------------------------------
     *
     * Your UserAdvisorConversation model has:
     *
     * { session_id: 1, advisor_type: 1 }
     *
     * unique for active conversations.
     *
     * If two requests arrive at exactly the same
     * time, MongoDB may reject one of them.
     *
     * In that situation, return the already-created
     * conversation instead of returning an error.
     */
    if (error?.code === 11000 || error?.message?.includes("duplicate key")) {
      const session_id = getSessionId(req);

      const advisor_type =
        typeof req.body?.advisor_type === "string"
          ? req.body.advisor_type.trim()
          : "";

      if (session_id && isValidAdvisorType(advisor_type)) {
        const existingConversation = await UserAdvisorConversation.findOne({
          session_id,
          advisor_type,
          status: "active",
        }).lean();

        if (existingConversation) {
          res.status(200).json({
            message: "Existing conversation found.",
            conversation: existingConversation,
            existing: true,
          });
          return;
        }
      }
    }

    /*
     * Return the real error message during development.
     *
     * This makes debugging much easier from the
     * browser/frontend.
     */
    res.status(500).json({
      message: error?.message || "Failed to start conversation.",
    });
  }
};

/**
 * Get one conversation.
 *
 * The user can only retrieve a conversation
 * belonging to their SafeLink session.
 */
export const getConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session_id = getSessionId(req);

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id.trim()
        : null;

    if (!session_id) {
      res.status(400).json({
        message: "session_id is required.",
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
      session_id,
      deletedForUser: {
        $ne: true,
      },
    }).lean();

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found.",
      });
      return;
    }

    /*
     * Do not return messages that were deleted
     * only for the user.
     */
    const filteredConversation = {
      ...conversation,

      messages: conversation.messages.filter(
        (message) => !message.deletedForUser,
      ),
    };

    res.status(200).json({
      conversation: filteredConversation,
    });
  } catch (error: any) {
    console.error("Get user-advisor conversation error:", error);

    res.status(500).json({
      message: error?.message || "Failed to retrieve conversation.",
    });
  }
};

/**
 * Get all conversations for the current SafeLink session.
 *
 * Used by the user's conversation history.
 */
export const getConversations = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session_id = getSessionId(req);

    if (!session_id) {
      res.status(400).json({
        message: "session_id is required.",
      });
      return;
    }

    const conversations = await UserAdvisorConversation.find({
      session_id,
      deletedForUser: {
        $ne: true,
      },
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    const filteredConversations = conversations.map((conversation) => ({
      ...conversation,

      messages: conversation.messages.filter(
        (message) => !message.deletedForUser,
      ),
    }));

    res.status(200).json({
      conversations: filteredConversations,
    });
  } catch (error: any) {
    console.error("Get user-advisor conversations error:", error);

    res.status(500).json({
      message: error?.message || "Failed to retrieve conversations.",
    });
  }
};

/**
 * Send a message from the user.
 */
export const sendMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session_id = getSessionId(req);

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id.trim()
        : null;

    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!session_id) {
      res.status(400).json({
        message: "session_id is required.",
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
      session_id,
      status: "active",
      deletedForUser: {
        $ne: true,
      },
    });

    if (!conversation) {
      res.status(404).json({
        message: "Active conversation not found.",
      });
      return;
    }

    const message = {
      message_id: randomUUID(),

      sender: "user" as const,

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
  } catch (error: any) {
    console.error("Send user-advisor message error:", error);

    res.status(500).json({
      message: error?.message || "Failed to send message.",
    });
  }
};

/**
 * Close a conversation.
 *
 * The old conversation remains in the database.
 *
 * Because the conversation becomes "closed",
 * the user can later create another active
 * conversation with the same advisor type.
 */
export const closeConversation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const session_id = getSessionId(req);

    const conversation_id =
      typeof req.params.conversation_id === "string"
        ? req.params.conversation_id.trim()
        : null;

    if (!session_id) {
      res.status(400).json({
        message: "session_id is required.",
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
        session_id,
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
        message: "Active conversation not found.",
      });
      return;
    }

    res.status(200).json({
      message: "Conversation closed successfully.",

      conversation,
    });
  } catch (error: any) {
    console.error("Close user-advisor conversation error:", error);

    res.status(500).json({
      message: error?.message || "Failed to close conversation.",
    });
  }
};
