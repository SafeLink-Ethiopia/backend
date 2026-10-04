import { Response } from "express";
import crypto from "crypto";

import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";
import AdminAdvisorConversation from "../models/AdminAdvisorConversation";

export const getAdvisorConversations = async (
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

    const conversations = await AdminAdvisorConversation.find({
      advisor_id,
    }).sort({
      updatedAt: -1,
    });

    res.status(200).json({
      conversations,
    });
  } catch (error) {
    console.error("Get advisor conversations error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversations.",
    });
  }
};

export const getAdvisorConversation = async (
  req: AdvisorRequest,
  res: Response,
): Promise<void> => {
  try {
    const { conversation_id } = req.params;
    const advisor_id = req.advisor?.advisor_id;

    if (!advisor_id) {
      res.status(401).json({
        message: "Advisor authentication required.",
      });
      return;
    }

    if (!conversation_id || typeof conversation_id !== "string") {
      res.status(400).json({
        message: "Conversation ID is required.",
      });
      return;
    }

    const conversation = await AdminAdvisorConversation.findOne({
      conversation_id: conversation_id.trim(),
      advisor_id,
    });

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found.",
      });
      return;
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Get advisor conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversation.",
    });
  }
};

export const getOrCreateAdvisorConversation = async (
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

    const admin_id = req.params.admin_id;

    if (!admin_id || typeof admin_id !== "string") {
      res.status(400).json({
        message: "Admin ID is required.",
      });
      return;
    }

    let conversation = await AdminAdvisorConversation.findOne({
      advisor_id,
      admin_id: admin_id.trim(),
    });

    if (!conversation) {
      conversation = await AdminAdvisorConversation.create({
        conversation_id: `AAC-${crypto.randomUUID()}`,
        admin_id: admin_id.trim(),
        advisor_id,
        messages: [],
      });
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Get or create advisor conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversation.",
    });
  }
};
