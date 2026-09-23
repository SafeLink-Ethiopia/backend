import mongoose, { Document, Schema } from "mongoose";

export interface IAwarenessPost extends Document {
  language: "en" | "am" | "om";
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

const awarenessPostSchema = new Schema<IAwarenessPost>(
  {
    language: {
      type: String,
      enum: ["en", "am", "om"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const AwarenessPost = mongoose.model<IAwarenessPost>(
  "AwarenessPost",
  awarenessPostSchema,
);
