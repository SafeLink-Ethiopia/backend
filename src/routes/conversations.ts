import { Router } from "express";
import Conversation from "../models/Conversation";
import Advisor from "../models/Advisor";
import { getMyConversations } from "../controllers/AdvisorDashboardController";
import { advisorAuthMiddleware } from "../middleware/advisorAuthMiddleware";

const router = Router();

const createMessageId = () =>
  `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeMessages = (conversation: any): boolean => {
  let changed = false;

  conversation.messages.forEach(
    (message: {
      message_id?: string;
      deleted?: boolean;
      deleted_at?: Date | null;
      seen_at?: Date | null;
      reply_to?: string | null;
    }) => {
      if (!message.message_id) {
        message.message_id = createMessageId();
        changed = true;
      }

      if (message.deleted === undefined) {
        message.deleted = false;
        changed = true;
      }

      if (message.deleted_at === undefined) {
        message.deleted_at = null;
        changed = true;
      }

      if (message.seen_at === undefined) {
        message.seen_at = null;
        changed = true;
      }

      if (message.reply_to === undefined) {
        message.reply_to = null;
        changed = true;
      }
    },
  );

  return changed;
};

/*
 * DELETE /:id/messages
 *
 * Soft-clears the entire conversation.
 */
router.delete("/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    conversation.messages.forEach(
      (message: { deleted: boolean; deleted_at?: Date | null }) => {
        message.deleted = true;
        message.deleted_at = new Date();
      },
    );

    conversation.urgent = false;

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Conversation messages soft-deleted",
      conversation,
    });
  } catch (error) {
    console.error("Clear conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear conversation",
    });
  }
});

/*
 * POST /request/medical
 */
router.post("/request/medical", async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    const existingConversation = await Conversation.findOne({
      session_id,
      recommendation: null,
    }).sort({ created_at: -1 });

    if (existingConversation) {
      const changed = normalizeMessages(existingConversation);

      if (changed) {
        await existingConversation.save();
      }

      return res.status(200).json({
        success: true,
        message: "Existing medical conversation found",
        conversation: existingConversation,
      });
    }

    const conversation = await Conversation.create({
      conversation_id: `CONV-${Date.now()}`,
      session_id,
      advisor_id: "ADV-MED-001",
      advisor_type: "medical",
      urgent: false,
      hidden_for_user: false,
      created_at: new Date(),
      messages: [],
      recommendation: null,
      suggested_advisor_types: [],
    });

    return res.status(201).json({
      success: true,
      message: "Medical support conversation created",
      conversation,
    });
  } catch (error) {
    console.error("Request medical support error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create medical support conversation",
    });
  }
});

/*
 * POST /request
 */
router.post("/request", async (req, res) => {
  try {
    const { session_id, advisor_type } = req.body;

    const allowedTypes = ["medical", "legal", "psychological", "general"];

    if (!session_id || typeof session_id !== "string") {
      return res.status(400).json({
        success: false,
        message: "session_id is required",
      });
    }

    if (!advisor_type || !allowedTypes.includes(advisor_type)) {
      return res.status(400).json({
        success: false,
        message:
          "advisor_type must be medical, legal, psychological, or general",
      });
    }

    const advisor = await Advisor.findOne({
      type: advisor_type,
      active: true,
    });

    if (!advisor) {
      return res.status(404).json({
        success: false,
        message: `No active ${advisor_type} advisor is available`,
      });
    }

    const conversation = await Conversation.create({
      conversation_id: `CONV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      session_id,
      advisor_id: advisor.advisor_id,
      advisor_type,
      urgent: false,
      hidden_for_user: false,
      created_at: new Date(),
      messages: [],
      recommendation: null,
      suggested_advisor_types: [],
    });

    return res.status(201).json({
      success: true,
      message: `${advisor_type} advisor conversation created`,
      conversation,
    });
  } catch (error) {
    console.error("Request advisor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create advisor conversation",
    });
  }
});

/*
 * GET /pending
 */
router.get("/pending", advisorAuthMiddleware, getMyConversations);

/*
 * GET /session/:session_id
 */
router.get("/session/:session_id", async (req, res) => {
  try {
    const { session_id } = req.params;

    const conversation = await Conversation.findOne({
      session_id,
      hidden_for_user: false,
    }).sort({ created_at: -1 });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "No conversation found for this session",
      });
    }

    if (normalizeMessages(conversation)) {
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation by session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
});

/*
 * GET /session/:session_id/all
 *
 * Get all conversations belonging to a user session.
 * Used by the user dashboard/chat to find conversations
 * for different advisor types.
 */
router.get("/session/:session_id/all", async (req, res) => {
  try {
    const { session_id } = req.params;

    const conversations = await Conversation.find({
      session_id,
      hidden_for_user: false,
    }).sort({ created_at: -1 });

    for (const conversation of conversations) {
      if (normalizeMessages(conversation)) {
        await conversation.save();
      }
    }

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get all conversations by session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversations",
    });
  }
});

/*
 * GET /:id
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (normalizeMessages(conversation)) {
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load conversation",
    });
  }
});

/*
 * POST /:id/message
 *
 * Send a new message.
 *
 * Optional:
 * reply_to - message_id of the message being replied to.
 */
router.post("/:id/message", async (req, res) => {
  try {
    const { sender, text, urgent, reply_to } = req.body;
    const { id } = req.params;

    if (sender !== "user" && sender !== "advisor") {
      return res.status(400).json({
        success: false,
        message: "sender must be either user or advisor",
      });
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    /*
     * If reply_to was provided, it must be a valid
     * message_id inside this conversation.
     */
    if (
      reply_to !== undefined &&
      reply_to !== null &&
      typeof reply_to !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "reply_to must be a message id",
      });
    }

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    /*
     * Validate the message being replied to.
     */
    if (reply_to) {
      const originalMessage = conversation.messages.find(
        (message: { message_id: string; deleted: boolean }) =>
          message.message_id === reply_to,
      );

      if (!originalMessage) {
        return res.status(404).json({
          success: false,
          message: "Message being replied to was not found",
        });
      }

      if (originalMessage.deleted) {
        return res.status(400).json({
          success: false,
          message: "Cannot reply to a deleted message",
        });
      }
    }

    conversation.messages.push({
      message_id: createMessageId(),
      sender,
      text: text.trim(),
      timestamp: new Date(),
      edited: false,
      deleted: false,
      deleted_at: null,
      seen_at: null,
      reply_to: reply_to ?? null,
    });

    if (sender === "user" && urgent === true) {
      conversation.urgent = true;
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: reply_to ? "Reply added" : "Message added",
      conversation,
    });
  } catch (error) {
    console.error("Add message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add message",
    });
  }
});

/*
 * PATCH /:id/message/:messageId
 *
 * Edit a message.
 */
router.patch("/:id/message/:messageId", async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    const message = conversation.messages.find(
      (item: { message_id: string; deleted: boolean }) =>
        item.message_id === messageId,
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.deleted) {
      return res.status(400).json({
        success: false,
        message: "Deleted messages cannot be edited",
      });
    }

    message.text = text.trim();
    message.edited = true;

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Message edited",
      conversation,
    });
  } catch (error) {
    console.error("Edit message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to edit message",
    });
  }
});

/*
 * DELETE /:id/message/:messageId
 *
 * Soft-delete one message.
 */
router.delete("/:id/message/:messageId", async (req, res) => {
  try {
    const { id, messageId } = req.params;

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    const message = conversation.messages.find(
      (item: {
        message_id: string;
        deleted: boolean;
        deleted_at?: Date | null;
      }) => item.message_id === messageId,
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    message.deleted = true;
    message.deleted_at = new Date();

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Message soft-deleted",
      conversation,
    });
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
});

/*
 * DELETE /:id/messages/bulk
 *
 * Soft-delete multiple messages.
 */
router.delete("/:id/messages/bulk", async (req, res) => {
  try {
    const { id } = req.params;
    const { message_ids } = req.body;

    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "message_ids must be a non-empty array",
      });
    }

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    const ids = new Set(message_ids);

    conversation.messages.forEach(
      (message: {
        message_id: string;
        deleted: boolean;
        deleted_at?: Date | null;
      }) => {
        if (ids.has(message.message_id)) {
          message.deleted = true;
          message.deleted_at = new Date();
        }
      },
    );

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Selected messages soft-deleted",
      conversation,
    });
  } catch (error) {
    console.error("Bulk delete messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete selected messages",
    });
  }
});

/*
 * DELETE /chats/bulk
 *
 * Soft-hide multiple conversations from the advisor.
 */
router.delete("/chats/bulk", async (req, res) => {
  try {
    const { conversation_ids } = req.body;

    if (!Array.isArray(conversation_ids) || conversation_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "conversation_ids must be a non-empty array",
      });
    }

    const result = await Conversation.updateMany(
      {
        conversation_id: { $in: conversation_ids },
      },
      {
        $set: {
          hidden_for_advisor: true,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Selected chats deleted for advisor",
      deleted_count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Bulk delete chats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete selected chats",
    });
  }
});

/*
 * DELETE /:id/advisor
 *
 * Hide a conversation from the advisor's conversation list.
 * The user's conversation remains intact.
 */
router.delete("/:id/advisor", async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.hidden_for_advisor = true;

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Conversation removed from advisor list",
      conversation,
    });
  } catch (error) {
    console.error("Delete advisor conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove conversation from advisor list",
    });
  }
});

/*
 * POST /:id/recommend
 */
router.post("/:id/recommend", async (req, res) => {
  try {
    const { id } = req.params;

    const { facility_id, facility_name, location, contact, notes } = req.body;

    if (!facility_id || !facility_name || !location || !contact || !notes) {
      return res.status(400).json({
        success: false,
        message:
          "facility_id, facility_name, location, contact and notes are required",
      });
    }

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    conversation.recommendation = {
      facility_id,
      facility_name,
      location,
      contact,
      notes,
    };

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Facility recommendation saved",
      conversation,
    });
  } catch (error) {
    console.error("Recommend facility error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save facility recommendation",
    });
  }
});

/*
 * PATCH /:id/seen
 *
 * Marks every message from the OTHER party as seen (read receipt).
 *
 * - viewer = "advisor" → marks all user messages as seen.
 * - viewer = "user"    → marks all advisor messages as seen.
 *
 * Idempotent: only sets seen_at if it's currently null.
 */
router.patch("/:id/seen", async (req, res) => {
  try {
    const { id } = req.params;
    const { viewer } = req.body as {
      viewer?: "user" | "advisor";
    };

    if (viewer !== "user" && viewer !== "advisor") {
      return res.status(400).json({
        success: false,
        message: "viewer must be either 'user' or 'advisor'",
      });
    }

    const conversation = await Conversation.findOne({
      conversation_id: id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    normalizeMessages(conversation);

    const otherSender = viewer === "advisor" ? "user" : "advisor";

    const now = new Date();

    conversation.messages.forEach(
      (message: { sender: "user" | "advisor"; seen_at?: Date | null }) => {
        if (message.sender === otherSender && !message.seen_at) {
          message.seen_at = now;
        }
      },
    );

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Messages marked as seen",
      conversation,
    });
  } catch (error) {
    console.error("Mark seen error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as seen",
    });
  }
});

export default router;
