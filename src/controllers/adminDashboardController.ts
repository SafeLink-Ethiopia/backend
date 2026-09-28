import { Request, Response } from "express";

import Advisor from "../models/Advisor";
import Conversation from "../models/Conversation";
import { Session } from "../models/Session";

export const getAdminDashboard = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [
      totalAdvisors,
      activeAdvisors,
      inactiveAdvisors,
      totalSessions,
      sessionsWithPasswords,
      totalConversations,
      conversationsWithMessages,
      conversationsWithRecommendations,
      advisorTypeDistribution,
      sessionLanguageDistribution,
    ] = await Promise.all([
      Advisor.countDocuments(),

      Advisor.countDocuments({
        active: true,
      }),

      Advisor.countDocuments({
        active: false,
      }),

      Session.countDocuments(),

      Session.countDocuments({
        password_hash: {
          $ne: null,
        },
      }),

      Conversation.countDocuments(),

      Conversation.countDocuments({
        "messages.0": {
          $exists: true,
        },
      }),

      Conversation.countDocuments({
        recommendation: {
          $ne: null,
        },
      }),

      Advisor.aggregate([
        {
          $group: {
            _id: "$type",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),

      Session.aggregate([
        {
          $group: {
            _id: "$language",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            _id: 0,
            language: "$_id",
            count: 1,
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]),
    ]);

    const messageStats = await Conversation.aggregate([
      {
        $project: {
          messageCount: {
            $size: "$messages",
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMessages: {
            $sum: "$messageCount",
          },
        },
      },
    ]);

    const totalMessages =
      messageStats.length > 0 ? messageStats[0].totalMessages : 0;

    res.status(200).json({
      statistics: {
        advisors: {
          total: totalAdvisors,
          active: activeAdvisors,
          inactive: inactiveAdvisors,
        },
        sessions: {
          total: totalSessions,
          withPassword: sessionsWithPasswords,
          withoutPassword: totalSessions - sessionsWithPasswords,
        },
        conversations: {
          total: totalConversations,
          withMessages: conversationsWithMessages,
          withoutMessages: totalConversations - conversationsWithMessages,
          withRecommendations: conversationsWithRecommendations,
          withoutRecommendations:
            totalConversations - conversationsWithRecommendations,
          totalMessages,
        },
      },
      advisorTypeDistribution,
      sessionLanguageDistribution,
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);

    res.status(500).json({
      message: "Failed to retrieve dashboard statistics.",
    });
  }
};
