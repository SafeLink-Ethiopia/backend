import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMessage {
  sender: "user" | "advisor";
  text: string;
  timestamp: Date;
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
  messages: IMessage[];
  recommendation: IRecommendation | null;
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
  },
  {
    _id: false,
  }
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
  }
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

    messages: {
      type: [messageSchema],
      default: [],
    },

    recommendation: {
      type: recommendationSchema,
      default: null,
    },
  },
  {
    collection: "conversations",
  }
);

const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>(
    "Conversation",
    conversationSchema
  );

export default Conversation;