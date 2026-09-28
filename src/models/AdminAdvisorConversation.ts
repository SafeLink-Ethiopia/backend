import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAdminAdvisorMessage {
  message_id: string;
  sender: "admin" | "advisor";
  text: string;
  timestamp: Date;
}

export interface IAdminAdvisorConversation extends Document {
  conversation_id: string;
  admin_id: string;
  advisor_id: string;
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
