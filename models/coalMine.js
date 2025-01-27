import mongoose from 'mongoose';

// Define schema for CoalMine
const coalMineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Coal mine name is required'],
      trim: true,
      unique: true,
    },
    location: {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: -180,
        max: 180,
      },
    },
    workers: [
      {
        name: { type: String, required: true },
        role: { type: String, enum: ['miner', 'supervisor', 'engineer'], default: 'miner' },
        contact: {
          type: String,
          validate: {
            validator: function (v) {
              return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v) || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid phone number or email!`,
          },
          required: [true, 'Worker contact is required'],
        },
      },
    ],
    deleted: { type: Boolean, default: false }, // For soft deletion
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add geospatial index for location
coalMineSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Virtual field to calculate total workers
coalMineSchema.virtual('workerCount').get(function () {
  return this.workers.length;
});

// Instance method: Add a worker
coalMineSchema.methods.addWorker = async function (worker) {
  this.workers.push(worker);
  return this.save();
};

// Static method: Find nearby mines
coalMineSchema.statics.findNearby = async function (latitude, longitude, radius = 10) {
  const distance = radius / 6378.1; // Radius of Earth in km
  return this.find({
    'location.latitude': { $gte: latitude - distance, $lte: latitude + distance },
    'location.longitude': { $gte: longitude - distance, $lte: longitude + distance },
    deleted: false,
  });
};

// Middleware for soft deletion
coalMineSchema.pre('remove', function (next) {
  this.deleted = true;
  next();
});

// Check if the model exists, if not, create it
const CoalMine = mongoose.models.CoalMine || mongoose.model('CoalMine', coalMineSchema);

export default CoalMine;
