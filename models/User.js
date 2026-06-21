import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: ['worker', 'Inspector', 'Super admin', 'Mine admin','Safety Manager' ,'Shift Incharge'],
      default: 'worker',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.otpExpiry;
        return ret;
      },
    },
  }
);

const isBcryptHash = (value) =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);

// Pre-save hook for password hashing (single hash only)
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  if (isBcryptHash(this.password)) {
    return next();
  }
  try {
    this.password = bcrypt.hashSync(this.password, 10);
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