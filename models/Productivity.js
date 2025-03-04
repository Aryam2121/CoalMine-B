import mongoose from 'mongoose';

const productivitySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    value: {
      type: [Number], 
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Productivity = mongoose.model('Productivity', productivitySchema);

export default Productivity;
