import mongoose, { Document, Model, Schema } from "mongoose";
import type { AdvisorType } from "./Advisor";

export type UserAdvisorConversationStatus = "active" | "closed";

export interface IUserAdvisorMessage {
  message_id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;

  edited?: boolean;
  deleted?: boolean;
  deletedForUser?: boolean;
  deletedForAdvisor?: boolean;
  deletedForEveryone?: boolean;

  deliveredAt?: Date;
  readAt?: Date;
}

export interface IUserAdvisorConversation extends Document {
  conversation_id: string;

  // User is identified through their session.
  session_id: string;

  // The actual advisor assigned to this conversation.
  advisor_id: string;

  // general | legal | medical | psychological
  advisor_type: AdvisorType;

  // Keeps the same conversation/advisor until it is closed.
  status: UserAdvisorConversationStatus;

  deletedForUser?: boolean;
  deletedForAdvisor?: boolean;

  messages: IUserAdvisorMessage[];

  // Used by General Advisor to recommend another advisor type.
  suggested_advisor_types?: AdvisorType[];

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IUserAdvisorMessage>(
  {
    message_id: {
      type: String,
      required: true,
      trim: true,
    },

    sender: {
      type: String,
      enum: ["user", "advisor"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },

    edited: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedForUser: {
      type: Boolean,
      default: false,
    },

    deletedForAdvisor: {
      type: Boolean,
      default: false,
    },

    deletedForEveryone: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
    },

    readAt: {
      type: Date,
    },
  },
  {
    _id: false,
  },
);

const userAdvisorConversationSchema = new Schema<IUserAdvisorConversation>(
  {
    conversation_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    session_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    advisor_id: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    advisor_type: {
      type: String,
      enum: ["medical", "legal", "psychological", "general"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
      index: true,
    },

    deletedForUser: {
      type: Boolean,
      default: false,
    },

    deletedForAdvisor: {
      type: Boolean,
      default: false,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    suggested_advisor_types: {
      type: [
        {
          type: String,
          enum: ["medical", "legal", "psychological", "general"],
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "user_advisor_conversations",
  },
);

/*
 * One active conversation per user/session and advisor type.
 *
 * This allows:
 *
 * session123 + general
 * session123 + legal
 * session123 + medical
 * session123 + psychological
 *
 * But only one ACTIVE conversation for each type.
 *
 * Closed conversations remain in the database as history.
 */
userAdvisorConversationSchema.index(
  {
    session_id: 1,
    advisor_type: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "active",
    },
  },
);

const UserAdvisorConversation: Model<IUserAdvisorConversation> =
  mongoose.models.UserAdvisorConversation ||
  mongoose.model<IUserAdvisorConversation>(
    "UserAdvisorConversation",
    userAdvisorConversationSchema,
  );

export default UserAdvisorConversation;
