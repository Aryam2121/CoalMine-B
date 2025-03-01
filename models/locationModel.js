import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], default: "Point" }, // Default type to "Point"
    coordinates: { type: [Number], required: true, validate: v => v.length === 2 }, // Ensure 2 values (longitude, latitude)
  },
});
// Add geospatial index for spatial queries
locationSchema.index({ coordinates: "2dsphere" });

const Location = mongoose.model("Location", locationSchema);

export default Location;
