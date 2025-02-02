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
        // Only require password if this is not a Google login
        return !this.googleId;
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined, // Ensures that 'null' is not explicitly stored
    },
    
    otp: {
      type: String, // OTP will be stored as a string
      default: null, // Initially, OTP will be null
    },
    otpExpiration: {
      type: Date, // Stores the OTP expiration time
      default: null, // Initially, OTP expiration is null
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
  // If the password is being set, hash it
  if (this.password && this.isModified('password')) {
    try {
      const hashedPassword = await bcrypt.hash(this.password, 10);
      this.password = hashedPassword; // Replace plain password with hashed password
      next();
    } catch (error) {
      next(error); // Pass error to the next middleware
    }
  } else {
    next();
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
