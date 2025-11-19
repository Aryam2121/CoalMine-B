import mongoose from 'mongoose';

// Training & Gamification Schema
const trainingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    category: {
      type: String,
      enum: [
        'safety_procedures',
        'equipment_operation',
        'emergency_response',
        'health_hazards',
        'compliance',
        'first_aid',
        'communication',
        'leadership',
        'technical_skills',
      ],
      required: true,
    },
    type: {
      type: String,
      enum: ['video', 'quiz', 'interactive', 'simulation', 'document', 'live_session'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    content: {
      videoUrl: String,
      documentUrl: String,
      slides: [String],
      questions: [
        {
          question: String,
          options: [String],
          correctAnswer: Number,
          explanation: String,
          points: {
            type: Number,
            default: 10,
          },
        },
      ],
    },
    passingScore: {
      type: Number,
      default: 70,
    },
    certificateEligible: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 100,
    },
    badges: [
      {
        name: String,
        description: String,
        icon: String,
      },
    ],
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Training',
      },
    ],
    enrolledUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        score: Number,
        attempts: {
          type: Number,
          default: 0,
        },
        lastAttemptAt: Date,
        timeSpent: {
          type: Number,
          default: 0,
        },
        certificateIssued: Boolean,
        certificateUrl: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isMandatory: {
      type: Boolean,
      default: false,
    },
    expiryDuration: {
      type: Number, // in months (for mandatory retraining)
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Leaderboard Schema for Gamification
const leaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    badges: [
      {
        badgeName: String,
        earnedAt: {
          type: Date,
          default: Date.now,
        },
        category: String,
      },
    ],
    achievements: [
      {
        achievementName: String,
        description: String,
        earnedAt: {
          type: Date,
          default: Date.now,
        },
        points: Number,
      },
    ],
    streaks: {
      currentStreak: {
        type: Number,
        default: 0,
      },
      longestStreak: {
        type: Number,
        default: 0,
      },
      lastActivityDate: Date,
    },
    statistics: {
      trainingsCompleted: {
        type: Number,
        default: 0,
      },
      quizzesPassed: {
        type: Number,
        default: 0,
      },
      averageScore: {
        type: Number,
        default: 0,
      },
      totalTimeSpent: {
        type: Number,
        default: 0,
      },
      certificatesEarned: {
        type: Number,
        default: 0,
      },
    },
    rank: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes
trainingSchema.index({ category: 1, isActive: 1 });
trainingSchema.index({ isMandatory: 1 });
leaderboardSchema.index({ totalPoints: -1 });
leaderboardSchema.index({ level: -1 });

// Method to enroll user
trainingSchema.methods.enrollUser = function (userId) {
  const isEnrolled = this.enrolledUsers.some(
    (enrollment) => enrollment.userId.toString() === userId.toString()
  );
  
  if (!isEnrolled) {
    this.enrolledUsers.push({ userId });
    return this.save();
  }
  return this;
};

// Method to update progress
trainingSchema.methods.updateProgress = function (userId, progress, score) {
  const enrollment = this.enrolledUsers.find(
    (e) => e.userId.toString() === userId.toString()
  );
  
  if (enrollment) {
    enrollment.progress = progress;
    if (score !== undefined) {
      enrollment.score = score;
      enrollment.attempts += 1;
      enrollment.lastAttemptAt = new Date();
    }
    
    if (progress === 100 && score >= this.passingScore) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
    }
  }
  
  return this.save();
};

const Training = mongoose.model('Training', trainingSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

export { Training, Leaderboard };
