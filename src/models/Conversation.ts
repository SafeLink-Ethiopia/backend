import mongoose, { Schema, Document } from "mongoose";
import type { AdvisorType } from "./Advisor";

interface IMessage {
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
  edited: boolean;
}

export interface IConversation extends Document {
  conversation_id: string;
  session_id: string;
  advisor_id: string;
  advisor_type: AdvisorType;
  urgent: boolean;
  hidden_for_user: boolean;
  messages: IMessage[];
  suggested_advisor_types: AdvisorType[];
  recommendation?: {
    facility_name: string;
    location: string;
    contact: string;
    notes: string;
  };
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: String, enum: ["user", "advisor"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    edited: { type: Boolean, default: false },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>({
  conversation_id: { type: String, required: true, unique: true },
  session_id: { type: String, required: true },
  advisor_id: { type: String, required: true },
  advisor_type: {
    type: String,
    enum: ["medical", "legal", "psychological", "general"],
    required: true,
  },
  urgent: { type: Boolean, default: false },
  hidden_for_user: { type: Boolean, default: false },
  messages: { type: [MessageSchema], default: [] },
  suggested_advisor_types: { type: [String], default: [] },
  recommendation: {
    facility_name: String,
    location: String,
    contact: String,
    notes: String,
  },
});

export default mongoose.model<IConversation>("Conversation", ConversationSchema);
