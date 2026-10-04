import { Response } from "express";
import crypto from "crypto";

import { AdminRequest } from "../middleware/adminAuthMiddleware";
import { AdvisorRequest } from "../middleware/advisorAuthMiddleware";
import AdminAdvisorConversation from "../models/AdminAdvisorConversation";
import Advisor from "../models/Advisor";

export const getOrCreateAdminAdvisorConversation = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const { advisor_id } = req.params;
    const admin_id = req.admin?.admin_id;

    if (!admin_id) {
      res.status(401).json({
        message: "Admin authentication required.",
      });
      return;
    }

    if (!advisor_id || typeof advisor_id !== "string") {
      res.status(400).json({
        message: "Advisor ID is required.",
      });
      return;
    }

    const advisor = await Advisor.findOne({
      advisor_id: advisor_id.trim(),
    }).select("advisor_id name email active");

    if (!advisor) {
      res.status(404).json({
        message: "Advisor not found.",
      });
      return;
    }

    let conversation = await AdminAdvisorConversation.findOne({
      admin_id,
      advisor_id: advisor.advisor_id,
    });

    if (!conversation) {
      conversation = await AdminAdvisorConversation.create({
        conversation_id: `AAC-${crypto.randomUUID()}`,
        admin_id,
        advisor_id: advisor.advisor_id,
        messages: [],
      });
    }

    res.status(200).json({
      conversation,
    });
  } catch (error) {
    console.error("Get or create admin advisor conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversation.",
    });
  }
};

export const getAdminConversations = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const admin_id = req.admin?.admin_id;

    if (!admin_id) {
      res.status(401).json({
        message: "Admin authentication required.",
      });
      return;
    }

    /*
     * Get conversations belonging to this Admin.
     */
    const conversations = await AdminAdvisorConversation.find({
      admin_id,
      deletedForAdmin: { $ne: true },
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    /*
     * Get the advisors belonging to these conversations.
     *
     * advisor_id is stored as a string in the conversation model,
     * so we fetch the corresponding Advisor documents separately.
     */
    const advisorIds = [
      ...new Set(conversations.map((conversation) => conversation.advisor_id)),
    ];

    const advisors = await Advisor.find({
      advisor_id: {
        $in: advisorIds,
      },
    }).select("advisor_id name email active");

    /*
     * Create a quick lookup map:
     *
     * advisor_id -> advisor information
     */
    const advisorMap = new Map(
      advisors.map((advisor) => [
        advisor.advisor_id,
        {
          advisor_id: advisor.advisor_id,
          name: advisor.name,
          email: advisor.email,
          active: advisor.active,
        },
      ]),
    );

    /*
     * Add advisor information to every conversation.
     */
    const conversationsWithAdvisor = conversations.map((conversation) => ({
      ...conversation,
      advisor: advisorMap.get(conversation.advisor_id) ?? {
        advisor_id: conversation.advisor_id,
        name: conversation.advisor_id,
        email: "",
        active: false,
      },
    }));

    res.status(200).json({
      conversations: conversationsWithAdvisor,
    });
  } catch (error) {
    console.error("Get admin conversations error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversations.",
    });
  }
};

export const getAdminAdvisorConversation = async (
  req: AdminRequest,
  res: Response,
): Promise<void> => {
  try {
    const { conversation_id } = req.params;
    const admin_id = req.admin?.admin_id;

    if (!admin_id) {
      res.status(401).json({
        message: "Admin authentication required.",
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
      admin_id,
    });

    if (!conversation) {
      res.status(404).json({
        message: "Conversation not found.",
      });
      return;
    }

    /*
     * Get the advisor's current information.
     */
    const advisor = await Advisor.findOne({
      advisor_id: conversation.advisor_id,
    }).select("advisor_id name email active");

    if (!advisor) {
      res.status(404).json({
        message: "Advisor associated with this conversation was not found.",
      });
      return;
    }

    /*
     * Return advisor information along with the conversation.
     */
    res.status(200).json({
      conversation,
      advisor: {
        advisor_id: advisor.advisor_id,
        name: advisor.name,
        email: advisor.email,
        active: advisor.active,
      },
    });
  } catch (error) {
    console.error("Get admin advisor conversation error:", error);

    res.status(500).json({
      message: "Failed to retrieve conversation.",
    });
  }
};
