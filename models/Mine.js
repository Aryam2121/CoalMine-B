import mongoose from 'mongoose';

// Define the schema for mine locations
const mineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mine name is required'],  // Validation for mine name
      minlength: [3, 'Mine name must be at least 3 characters long'],  // Minimum length for name
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],  // Validation for latitude
      min: [-90, 'Latitude must be between -90 and 90'],  // Latitude range validation
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],  // Validation for longitude
      min: [-180, 'Longitude must be between -180 and 180'],  // Longitude range validation
      max: [180, 'Longitude must be between -180 and 180'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'under construction'],  // Enum validation for status
      default: 'active',  // Default status if not provided
    },
    location: {
      type: String,
      default: '',  // Optionally store a description of the mine's location
    },
  },
  {
    timestamps: true,  // Automatically add createdAt and updatedAt fields
  }
);

// Create a 2D index on latitude and longitude for geospatial queries
mineSchema.index({ latitude: 1, longitude: 1 });

// Create the model for Mine
const Mine = mongoose.model('Mine', mineSchema);

export default Mine;
