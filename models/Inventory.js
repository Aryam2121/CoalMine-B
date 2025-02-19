// models/inventory.model.js
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    used: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    available: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true, 
  }
);

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;