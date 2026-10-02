import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdminAdvisorMessage {
  message_id: string;
  sender: "admin" | "advisor";
  text: string;
  timestamp: Date;

  edited?: boolean;

  // Kept for backward compatibility with existing messages
  deleted?: boolean;

  // Delete only for the admin who deleted the message
  deletedForAdmin?: boolean;

  // Delete only for the advisor who deleted the message
  deletedForAdvisor?: boolean;

  // Delete for everyone in the conversation
  deletedForEveryone?: boolean;

  deliveredAt?: Date;
  readAt?: Date;
}

export interface IAdminAdvisorConversation extends Document {
  conversation_id: string;
  admin_id: string;
  advisor_id: string;

  // Hide the whole conversation from one side without
  // deleting the conversation or its messages from MongoDB.
  deletedForAdmin?: boolean;
  deletedForAdvisor?: boolean;

  messages: IAdminAdvisorMessage[];

  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IAdminAdvisorMessage>(
  {
    message_id: {
      type: String,
      required: true,
      trim: true,
    },

    sender: {
      type: String,
      enum: ["admin", "advisor"],
      required: true,
    },

    /*
     * IMPORTANT:
     * We keep the original text in MongoDB.
     *
     * When a message is deleted for everyone, we will NOT replace
     * this value with "This message was deleted".
     *
     * The frontend will display "This message was deleted" based
     * on deletedForEveryone.
     */
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

    /*
     * Kept for compatibility with your existing database records.
     *
     * New code should use:
     * - deletedForAdmin
     * - deletedForAdvisor
     * - deletedForEveryone
     */
    deleted: {
      type: Boolean,
      default: false,
    },

    /*
     * Message is hidden only from Admin.
     */
    deletedForAdmin: {
      type: Boolean,
      default: false,
    },

    /*
     * Message is hidden only from Advisor.
     */
    deletedForAdvisor: {
      type: Boolean,
      default: false,
    },

    /*
     * Message is deleted for both Admin and Advisor.
     *
     * The original text remains stored in MongoDB.
     */
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

const adminAdvisorConversationSchema = new Schema<IAdminAdvisorConversation>(
  {
    conversation_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    admin_id: {
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

    /*
     * Hides the entire conversation only from Admin.
     * The MongoDB conversation remains.
     */
    deletedForAdmin: {
      type: Boolean,
      default: false,
    },

    /*
     * Hides the entire conversation only from Advisor.
     * The MongoDB conversation remains.
     */
    deletedForAdvisor: {
      type: Boolean,
      default: false,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "admin_advisor_conversations",
  },
);

/*
 * One Admin ↔ Advisor conversation.
 */
adminAdvisorConversationSchema.index(
  { admin_id: 1, advisor_id: 1 },
  { unique: true },
);

const AdminAdvisorConversation: Model<IAdminAdvisorConversation> =
  mongoose.models.AdminAdvisorConversation ||
  mongoose.model<IAdminAdvisorConversation>(
    "AdminAdvisorConversation",
    adminAdvisorConversationSchema,
  );

export default AdminAdvisorConversation;
