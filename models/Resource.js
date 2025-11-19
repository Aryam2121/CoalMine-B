import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  mineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mine',
    required: true,
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'Resource name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['coal', 'water', 'electricity', 'fuel', 'equipment', 'material', 'other'],
    required: true
  },
  used: { 
    type: Number, 
    required: true,
    min: [0, 'Used amount cannot be negative'],
    default: 0
  },
  available: { 
    type: Number, 
    required: true,
    min: [0, 'Available amount cannot be negative']
  },
  unit: {
    type: String,
    required: true,
    default: 'units'
  },
  cost: {
    pricePerUnit: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  threshold: {
    warning: { type: Number, default: 20 },
    critical: { type: Number, default: 10 }
  },
  usage: [{
    date: { type: Date, default: Date.now },
    amount: Number,
    operation: { type: String, enum: ['add', 'consume'] },
    notes: String
  }],
  status: {
    type: String,
    enum: ['adequate', 'low', 'critical', 'depleted'],
    default: 'adequate'
  },
  lastRestocked: Date,
  supplier: String,
  location: String
}, {
  timestamps: true
});

// Virtual for total quantity
ResourceSchema.virtual('total').get(function() {
  return this.used + this.available;
});

// Virtual for utilization percentage
ResourceSchema.virtual('utilizationRate').get(function() {
  const total = this.used + this.available;
  return total > 0 ? (this.used / total * 100).toFixed(2) : 0;
});

// Pre-save middleware to update status based on available quantity
ResourceSchema.pre('save', function(next) {
  const availablePercent = (this.available / (this.used + this.available)) * 100;
  
  if (this.available === 0) {
    this.status = 'depleted';
  } else if (availablePercent <= this.threshold.critical) {
    this.status = 'critical';
  } else if (availablePercent <= this.threshold.warning) {
    this.status = 'low';
  } else {
    this.status = 'adequate';
  }
  
  // Calculate total cost
  if (this.cost.pricePerUnit) {
    this.cost.totalCost = this.used * this.cost.pricePerUnit;
  }
  
  next();
});

// Method to consume resource
ResourceSchema.methods.consume = function(amount, notes) {
  if (amount > this.available) {
    throw new Error('Insufficient resources available');
  }
  this.available -= amount;
  this.used += amount;
  this.usage.push({
    amount,
    operation: 'consume',
    notes: notes || 'Resource consumed'
  });
  return this.save();
};

// Method to restock resource
ResourceSchema.methods.restock = function(amount, notes) {
  this.available += amount;
  this.lastRestocked = new Date();
  this.usage.push({
    amount,
    operation: 'add',
    notes: notes || 'Resource restocked'
  });
  return this.save();
};

// Static method to get low resources
ResourceSchema.statics.getLowResources = function(mineId) {
  return this.find({ 
    mineId,
    status: { $in: ['low', 'critical', 'depleted'] } 
  }).sort({ status: -1 });
};

// Indexes
ResourceSchema.index({ mineId: 1, type: 1 });
ResourceSchema.index({ status: 1 });

const Resource = mongoose.model('Resource', ResourceSchema);
export default Resource;
