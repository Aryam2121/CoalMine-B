import mongoose from 'mongoose';

const productivitySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '', // Optional description for the record
    },
  },
  { timestamps: true }
);

// Create the model based on the schema
const Productivity = mongoose.model('Productivity', productivitySchema);

export default Productivity; // Export the model, not just the schema
