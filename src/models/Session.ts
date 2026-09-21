import { Schema, model, Document } from "mongoose";

export type Language = "am" | "om" | "en";

export interface ISession extends Document {
  safelink_id: string;
  password_hash: string | null;
  language: Language;
  created_at: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    safelink_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password_hash: {
      type: String,
      default: null,
    },

    language: {
      type: String,
      enum: ["am", "om", "en"],
      required: true,
      default: "en",
    },

    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

export const Session = model<ISession>("Session", sessionSchema);
