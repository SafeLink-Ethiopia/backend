import mongoose, { Document, Model, Schema } from "mongoose";

export interface IService extends Document {
  service_id: string;
  name: string;
  location: string;
  contact: string;
  service_type: "medical";
}

const serviceSchema = new Schema<IService>(
  {
    service_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
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

    service_type: {
      type: String,
      enum: ["medical"],
      required: true,
    },
  },
  {
    collection: "services",
  }
);

const Service: Model<IService> =
  mongoose.models.Service ||
  mongoose.model<IService>("Service", serviceSchema);

export default Service;