import mongoose, { Document, Schema } from "mongoose";

export type FacilitySupportType =
  | "medical"
  | "legal"
  | "psychological"
  | "general";

export interface IFacility extends Document {
  facility_id: string;
  facility_name: string;
  location: string;
  contact: string;
  support_types: FacilitySupportType[];
  description: string;

  // Kept for compatibility with older facility documents.
  notes?: string;

  // Advisor who added the facility.
  added_by?: string;

  created_at: Date;
  updated_at: Date;
}

const facilitySchema = new Schema<IFacility>(
  {
    facility_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

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

    support_types: {
      type: [String],
      enum: ["medical", "legal", "psychological", "general"],
      default: [],
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Old records may still have this.
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    added_by: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

export default mongoose.models.Facility ||
  mongoose.model<IFacility>("Facility", facilitySchema, "facilities");