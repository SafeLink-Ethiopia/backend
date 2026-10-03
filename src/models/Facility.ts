import mongoose, {
  Document,
  Schema,
} from "mongoose";

export interface IFacility extends Document {
  facility_id: string;
  facility_name: string;
  location: string;
  contact: string;
  notes: string;
  created_at: Date;
}

const facilitySchema = new Schema<IFacility>({
  facility_id: {
    type: String,
    required: true,
    unique: true,
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

  notes: {
    type: String,
    required: true,
    trim: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Facility ||
  mongoose.model<IFacility>(
    "Facility",
    facilitySchema,
    "facilities"
  );