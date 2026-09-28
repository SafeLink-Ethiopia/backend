import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdminAdvisorMessage {
  message_id: string;
  sender: "admin" | "advisor";
  text: string;
  timestamp: Date;

  edited?: boolean;
  deleted?: boolean;

  deliveredAt?: Date;
  readAt?: Date;
}

export interface IAdminAdvisorConversation extends Document {
  conversation_id: string;
  admin_id: string;
  advisor_id: string;

  // Hide the conversation from one side without deleting it
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

    deletedForAdmin: {
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
  },
  {
    timestamps: true,
    collection: "admin_advisor_conversations",
  },
);

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
