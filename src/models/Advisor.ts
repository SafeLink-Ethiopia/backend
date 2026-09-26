import mongoose, { Schema, Document } from "mongoose";

export type AdvisorType = "medical" | "legal" | "psychological" | "general";
export type AdvisorGender = "male" | "female" ;
export interface IAdvisor extends Document {
  advisor_id: string;
  type: AdvisorType;
  name: string;
  email: string;
  gender: AdvisorGender;
  phone_number: string;
  location: string;
  active: boolean;
  passwordHash: string;
  working_hours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
   mustChangePassword: boolean;

  resetOtpHash?: string | null;
  resetOtpExpires?: Date | null;
  resetOtpAttempts: number;

  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;
   createdAt: Date;
  updatedAt: Date;
}

const AdvisorSchema = new Schema<IAdvisor>({
  advisor_id: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ["medical", "legal", "psychological", "general"],
    required: true,
  },
  name: { type: String, required: true },
      email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
        gender: {
      type: String,
      required: true,
      enum: ["male", "female"],
    },
  phone_number: { type: String, default: "" },
  location: { type: String, default: "" },
  active: { type: Boolean, default: true },
   passwordHash: {
      type: String,
      required: true,
    },
      mustChangePassword: {
      type: Boolean,
      default: true,
    },
       resetOtpHash: {
      type: String,
      default: null,
    },

    resetOtpExpires: {
      type: Date,
      default: null,
    },
        resetOtpAttempts: {
      type: Number,
      default: 0,
    },

    resetTokenHash: {
      type: String,
      default: null,
    },
       resetTokenExpires: {
      type: Date,
      default: null,
    },
  working_hours: {
    start: { type: String, default: "00:00" },
    end: { type: String, default: "23:59" },
  },
});

export default mongoose.model<IAdvisor>("Advisor", AdvisorSchema);
