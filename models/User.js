import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email validation
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password required only if Google ID is absent
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ['worker', 'Inspector', 'Super admin', 'Mine admin','Safety Manager' ,'Shift Incharge'],
      default: 'worker',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Securely set OTP
userSchema.methods.setOtp = function (otp) {
  this.otp = crypto.createHash('sha256').update(otp).digest('hex');
  this.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry
};

// Validate OTP
userSchema.methods.validateOtp = function (enteredOtp) {
  const hashedOtp = crypto.createHash('sha256').update(enteredOtp).digest('hex');
  return this.otp === hashedOtp && this.otpExpiry > Date.now();
};

// Model
const User = mongoose.model('User', userSchema);

export default User;