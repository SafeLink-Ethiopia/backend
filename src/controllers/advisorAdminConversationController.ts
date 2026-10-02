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
      deletedForAdvisor: { $ne: true },
    }).lean();

    if (!conversation) {
      res.status(404).json({
        message: "No conversation found with the admin.",
      });
      return;
    }

    /*
     * Remove messages that the Advisor deleted only for themselves.
     *
     * Messages deleted for everyone remain in the response because
     * the frontend needs to display:
     *
     * "This message was deleted"
     */
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
      deletedForAdvisor: { $ne: true },
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    /*
     * Hide messages that were deleted only for this Advisor.
     *
     * Messages deleted for everyone are kept so the UI can show
     * the deleted-message placeholder.
     */
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
    console.error("Get advisor conversations error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversations.",
    });
  }
};
