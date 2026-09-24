import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRagChunk extends Document {
  documentId: Types.ObjectId;
  content: string;
  language: "en" | "am" | "om";
  chunkIndex: number;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

const ragChunkSchema = new Schema<IRagChunk>(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: "RagDocument",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      enum: ["en", "am", "om"],
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    embedding: {
      type: [Number],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model<IRagChunk>("RagChunk", ragChunkSchema);
