import mongoose, { Document, Schema } from "mongoose";

export type AdvisorType =
  | "medical"
  | "legal"
  | "psychological"
  | "general";

export interface IMessage {
  message_id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
  deleted_at?: Date | null;
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

const messageSchema = new Schema<IMessage>(
  {
    message_id: {
      type: String,
      required: false,
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
  },
  { _id: false }
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

    notes: {
      type: String,
      required: true,
    },
  },
  { _id: false }
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
    enum: [
      "medical",
      "legal",
      "psychological",
      "general",
    ],
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
    type: [messageSchema],
    default: [],
  },

  recommendation: {
    type: recommendationSchema,
    default: null,
  },

  suggested_advisor_types: {
    type: [String],
    enum: [
      "medical",
      "legal",
      "psychological",
      "general",
    ],
    default: [],
  },
});

export default mongoose.models.Conversation ||
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema,
    "conversations"
  );