import mongoose, { Document, Schema } from "mongoose";

export type AdvisorType = "medical" | "legal" | "psychological" | "general";

export interface IMessage {
  message_id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
  deleted_at?: Date | null;
  deleted_for_user: boolean;
  deleted_for_advisor: boolean;
}

export interface IRecommendation {
  facility_id?: string;
  facility_name: string;
  location: string;
  contact: string;
  notes: string;
}

export interface IConversation extends Document {
  conversation_id: string;
  session_id: string;
  advisor_id: string | null; // NULLABLE when waiting for assignment
  advisor_type: AdvisorType;
  urgent: boolean;
  hidden_for_user: boolean;
  hidden_for_advisor: boolean;
  created_at: Date;
  last_message_at: Date; // REQUIRED for real-time list sorting
  messages: IMessage[];
  recommendation: IRecommendation | null;
  suggested_advisor_types: AdvisorType[];
  cleared_for_user_at?: Date | null;
  cleared_for_advisor_at?: Date | null;
}

const MessageSchema = new Schema<IMessage>(
  {
    message_id: { type: String, required: true },
    sender: { type: String, enum: ["user", "advisor"], required: true },
    text: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_for_user: { type: Boolean, default: false },
    deleted_for_advisor: { type: Boolean, default: false },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>({
  conversation_id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true, index: true },
  advisor_id: { type: String, default: null, index: true },
  advisor_type: {
    type: String,
    enum: ["medical", "legal", "psychological", "general"],
    required: true,
  },
  urgent: { type: Boolean, default: false },
  hidden_for_user: { type: Boolean, default: false },
  hidden_for_advisor: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  last_message_at: { type: Date, default: Date.now },
  messages: { type: [MessageSchema], default: [] },
  suggested_advisor_types: {
    type: [String],
    enum: ["medical", "legal", "psychological", "general"],
    default: [],
  },
  cleared_for_user_at: { type: Date, default: null },
  cleared_for_advisor_at: { type: Date, default: null },
});

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema, "conversations");