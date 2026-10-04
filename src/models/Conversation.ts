import mongoose, { Document, Schema } from "mongoose";
import { randomUUID } from "crypto";

export type AdvisorType = "medical" | "legal" | "psychological" | "general";

export interface IMessage {
  message_id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
  deleted_at?: Date | null;
    seen_at?: Date | null;
}

export interface IRecommendation {
  facility_id: string;
  facility_name: string;
  location: string;
  contact: string;
  notes: string;
}

export interface IConversation extends Document {
  conversation_id: string;
  session_id: string;
  advisor_id: string;
  advisor_type: AdvisorType;
  urgent: boolean;
  hidden_for_user: boolean;
  hidden_for_advisor: boolean;
  created_at: Date;
  messages: IMessage[];
  recommendation: IRecommendation | null;
  suggested_advisor_types: AdvisorType[];
}

const MessageSchema = new Schema<IMessage>(
  {
    // CHANGED: every new message now gets an id automatically.
    message_id: {
      type: String,
      default: () => randomUUID(),
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
    },

    edited: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
        seen_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const recommendationSchema = new Schema<IRecommendation>(
  {
    facility_id: {
      type: String,
      required: false,
    },

    facility_name: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    contact: {
      type: String,
      required: true,
    },

    // CHANGED: notes is optional now (an empty note should not fail the save).
    notes: {
      type: String,
      required: false,
      default: "",
    },
  },
  { _id: false },
);

const conversationSchema = new Schema<IConversation>({
  conversation_id: {
    type: String,
    required: true,
    unique: true,
  },

  session_id: {
    type: String,
    required: true,
  },

  advisor_id: {
    type: String,
    required: true,
  },

  advisor_type: {
    type: String,
    enum: ["medical", "legal", "psychological", "general"],
    default: "medical",
  },

  urgent: {
    type: Boolean,
    default: false,
  },

  hidden_for_user: {
    type: Boolean,
    default: false,
  },

  hidden_for_advisor: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  messages: {
    type: [MessageSchema],
    default: [],
  },

  recommendation: {
    type: recommendationSchema,
    default: null,
  },

  suggested_advisor_types: {
    type: [String],
    enum: ["medical", "legal", "psychological", "general"],
    default: [],
  },
});

// CHANGED: indexes so the dashboard queries stay fast.
conversationSchema.index({ session_id: 1, hidden_for_user: 1 });
conversationSchema.index({ advisor_id: 1, hidden_for_advisor: 1 });

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema,
    "conversations",
  );
