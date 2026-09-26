import mongoose, { Document, Schema } from "mongoose";

export type AdvisorGender = "male" | "female" | "other";

export type AdvisorType =
  | "medical"
  | "psychological"
  | "legal"
  | "social"
  | "other";

export interface IAdvisor extends Document {
  advisorId: string;
  name: string;
  email: string;
  gender: AdvisorGender;
  type: AdvisorType;
  phoneNumber: string;
  location: string;

  workingHours: {
    start: string;
    end: string;
  };

  active: boolean;

  passwordHash: string;
  mustChangePassword: boolean;

  resetOtpHash?: string | null;
  resetOtpExpires?: Date | null;
  resetOtpAttempts: number;

  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const advisorSchema = new Schema<IAdvisor>(
  {
    advisorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

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
      enum: ["male", "female", "other"],
    },

    type: {
      type: String,
      required: true,
      enum: ["medical", "psychological", "legal", "social", "other"],
    },

    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    workingHours: {
      start: {
        type: String,
        required: true,
      },

      end: {
        type: String,
        required: true,
      },
    },

    active: {
      type: Boolean,
      default: true,
    },

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
  },
  {
    timestamps: true,
  },
);

const Advisor = mongoose.model<IAdvisor>("Advisor", advisorSchema);

export default Advisor;
