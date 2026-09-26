import { Router, Request, Response } from "express";
import Conversation from "../models/Conversation";

const router = Router();

/**
 * POST /api/conversations/request/medical
 *
 * Creates a new medical-support conversation.
 */
router.post(
  "/request/medical",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { session_id } = req.body;

      if (!session_id) {
        res.status(400).json({
          success: false,
          message: "session_id is required",
        });
        return;
      }

      const conversationId = `CONV-${Date.now()}`;

      const conversation = await Conversation.create({
        conversation_id: conversationId,
        session_id,
        advisor_id: "ADV-MED-001",
        messages: [],
        recommendation: null,
      });

      res.status(201).json({
        success: true,
        message: "Medical conversation created",
        conversation,
      });
    } catch (error) {
      console.error("Error creating medical conversation:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create medical conversation",
      });
    }
  }
);

/**
 * POST /api/conversations/:id/message
 *
 * Adds a user or advisor message to a conversation.
 */
router.post(
  "/:id/message",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { sender, text } = req.body;

      if (!sender || !text) {
        res.status(400).json({
          success: false,
          message: "sender and text are required",
        });
        return;
      }

      if (sender !== "user" && sender !== "advisor") {
        res.status(400).json({
          success: false,
          message: 'sender must be either "user" or "advisor"',
        });
        return;
      }

      const conversation = await Conversation.findOne({
        conversation_id: id,
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      conversation.messages.push({
        sender,
        text,
        timestamp: new Date(),
      });

      await conversation.save();

      res.status(200).json({
        success: true,
        message: "Message added",
        conversation,
      });
    } catch (error) {
      console.error("Error adding message:", error);

      res.status(500).json({
        success: false,
        message: "Failed to add message",
      });
    }
  }
);

/**
 * GET /api/conversations/:id
 *
 * Retrieves a complete conversation.
 */
router.get(
  "/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const conversation = await Conversation.findOne({
        conversation_id: id,
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        conversation,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch conversation",
      });
    }
  }
);

/**
 * POST /api/conversations/:id/recommend
 *
 * Adds or updates the medical facility recommendation.
 */
router.post(
  "/:id/recommend",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const {
        facility_name,
        location,
        contact,
        notes,
      } = req.body;

      if (!facility_name || !location || !contact || !notes) {
        res.status(400).json({
          success: false,
          message:
            "facility_name, location, contact, and notes are required",
        });
        return;
      }

      const conversation = await Conversation.findOne({
        conversation_id: id,
      });

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
        return;
      }

      conversation.recommendation = {
        facility_name,
        location,
        contact,
        notes,
      };

      await conversation.save();

      res.status(200).json({
        success: true,
        message: "Medical facility recommendation added",
        conversation,
      });
    } catch (error) {
      console.error("Error adding recommendation:", error);

      res.status(500).json({
        success: false,
        message: "Failed to add recommendation",
      });
    }
  }
);

export default router;