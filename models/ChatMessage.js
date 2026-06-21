import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    mineId: { type: mongoose.Schema.Types.ObjectId, required: true },
    channel: {
      type: String,
      enum: ['shift', 'safety', 'maintenance', 'general'],
      default: 'general',
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: String,
    message: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

chatMessageSchema.index({ mineId: 1, channel: 1, createdAt: -1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;
