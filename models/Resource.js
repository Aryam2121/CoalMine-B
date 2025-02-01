import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  used: { type: Number, required: true },
  available: { type: Number, required: true },
});

const Resource =  mongoose.model('Resource', ResourceSchema);
export default Resource;
