import { Response } from "express";

import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";
import AdminAdvisorConversation from "../models/AdminAdvisorConversation";

export const getAdvisorConversation = async (
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

    const conversation = await AdminAdvisorConversation.findOne({
      advisor_id,
    });

    if (!conversation) {
      res.status(404).json({
        message: "No conversation found with the admin.",
      });
      return;
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Get advisor conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve advisor conversation.",
    });
  }
};

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
