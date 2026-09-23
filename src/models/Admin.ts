import mongoose, { Document, Schema } from "mongoose";

export interface IAdmin extends Document {
  admin_id: string;
  password_hash: string;
  token_version: number;
  created_at: Date;
  updated_at: Date;
}

const adminSchema = new Schema<IAdmin>(
  {
    admin_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
    },

    token_version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export const Admin = mongoose.model<IAdmin>("Admin", adminSchema);
