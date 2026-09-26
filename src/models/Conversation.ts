import mongoose, { Document, Model, Schema } from "mongoose";

export type AdvisorType = "general" | "medical" | "legal" | "psychological";

export interface IMessage {
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
  edited?: boolean;
}

export interface IRecommendation {
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
  messages: IMessage[];
  recommendation: IRecommendation | null;
  urgent: boolean;
  hidden_for_user: boolean;
  created_at: Date;
  updated_at: Date;
}

const messageSchema = new Schema<IMessage>(
  {
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
      required: true,
      default: Date.now,
    },

    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const recommendationSchema = new Schema<IRecommendation>(
  {
    facility_name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new Schema<IConversation>(
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
      trim: true,
    },

    advisor_type: {
      type: String,
      enum: ["general", "medical", "legal", "psychological"],
      required: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    recommendation: {
      type: recommendationSchema,
      default: null,
    },

    urgent: {
      type: Boolean,
      default: false,
    },

    hidden_for_user: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: "conversations",
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;
