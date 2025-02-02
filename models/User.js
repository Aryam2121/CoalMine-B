import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
      required: function() {
        return !this.googleId; // Ensure this works correctly
      },
      minlength: 6,
    },
   
    googleId: {
      type: String,
      unique: false,
      sparse: true,
      // null ko explicitly set karo agar Google ID nahi hai
    },
    
    
    otp: {
      type: String, // OTP will be stored as a string
      default: null, // Initially, OTP will be null
    },
    otpExpiry: {
      type: Date,
      default: null,
   },
   
    role: {
      type: String,
      enum: ['worker', 'supervisor', 'admin'],
      default: 'worker', // Default role is worker
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// Pre-save hook for password hashing
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.googleId) {
    return next(); // No need to hash if password is not modified or it's a Google login
  }
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});


// Method to compare passwords (useful for login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to validate OTP (you can add more complex logic here if needed)
userSchema.methods.isOtpValid = function() {
  return this.otpExpiration && this.otpExpiration > Date.now();
};

// Model
const User = mongoose.model('User', userSchema);

export default User;
