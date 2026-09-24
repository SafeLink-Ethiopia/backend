import mongoose, { Document, Schema } from "mongoose";

export interface IRagDocument extends Document {
  title: string;
  originalFileName: string;
  fileType: "pdf" | "docx";
  filePath: string;
  language: "en" | "am" | "om";
  category: string;
  status: "processing" | "ready" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ragDocumentSchema = new Schema<IRagDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileType: {
      type: String,
      enum: ["pdf", "docx"],
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      enum: ["en", "am", "om"],
      required: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },

    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IRagDocument>("RagDocument", ragDocumentSchema);
