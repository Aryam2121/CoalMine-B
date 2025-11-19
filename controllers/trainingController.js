import { Training, Leaderboard } from '../models/Training.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Create new training module
export const createTraining = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      type,
      difficulty,
      duration,
      content,
      passingScore,
      certificateEligible,
      points,
      badges,
      prerequisites,
      isMandatory,
      expiryDuration
    } = req.body;

    const createdBy = req.user?._id || req.body.createdBy;

    const training = new Training({
      title,
      description,
      category,
      type,
      difficulty,
      duration,
      content,
      passingScore: passingScore || 70,
      certificateEligible,
      points: points || 100,
      badges,
      prerequisites,
      isMandatory,
      expiryDuration,
      createdBy
    });

    await training.save();

    res.status(201).json({
      success: true,
      training,
      message: 'Training module created successfully'
    });
  } catch (error) {
    console.error('Error creating training:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating training module', 
      error: error.message 
    });
  }
};

// Get all trainings with filtering
export const getAllTrainings = async (req, res) => {
  try {
    const { category, difficulty, type, isMandatory, isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (type) query.type = type;
    if (isMandatory !== undefined) query.isMandatory = isMandatory === 'true';
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const trainings = await Training.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy prerequisites');

    const total = await Training.countDocuments(query);

    res.json({
      success: true,
      trainings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching trainings', 
      error: error.message 
    });
  }
};

// Enroll user in training
export const enrollInTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId;

    const training = await Training.findById(id);
    
    if (!training) {
      return res.status(404).json({ 
        success: false,
        message: 'Training not found' 
      });
    }

    if (!training.isActive) {
      return res.status(400).json({ 
        success: false,
        message: 'Training is not active' 
      });
    }

    // Check prerequisites
    if (training.prerequisites && training.prerequisites.length > 0) {
      const userEnrollments = await Training.find({
        '_id': { $in: training.prerequisites },
        'enrolledUsers.userId': userId,
        'enrolledUsers.completed': true
      });

      if (userEnrollments.length < training.prerequisites.length) {
        return res.status(400).json({ 
          success: false,
          message: 'Prerequisites not met' 
        });
      }
    }

    await training.enrollUser(userId);

    // Initialize leaderboard entry if doesn't exist
    let leaderboard = await Leaderboard.findOne({ userId });
    if (!leaderboard) {
      leaderboard = new Leaderboard({ userId });
      await leaderboard.save();
    }

    res.json({
      success: true,
      message: 'Enrolled in training successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error enrolling in training', 
      error: error.message 
    });
  }
};

// Update training progress
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, score, timeSpent } = req.body;
    const userId = req.user?._id || req.body.userId;

    const training = await Training.findById(id);
    
    if (!training) {
      return res.status(404).json({ 
        success: false,
        message: 'Training not found' 
      });
    }

    const enrollment = training.enrolledUsers.find(
      e => e.userId.toString() === userId.toString()
    );

    if (!enrollment) {
      return res.status(400).json({ 
        success: false,
        message: 'User not enrolled in this training' 
      });
    }

    enrollment.progress = progress;
    if (timeSpent) enrollment.timeSpent += timeSpent;
    
    // Check if completed
    if (progress === 100 && score >= training.passingScore) {
      enrollment.completed = true;
      enrollment.completedAt = new Date();
      enrollment.score = score;

      // Update leaderboard
      const leaderboard = await Leaderboard.findOne({ userId });
      if (leaderboard) {
        leaderboard.totalPoints += training.points;
        leaderboard.statistics.trainingsCompleted += 1;
        leaderboard.statistics.quizzesPassed += 1;
        leaderboard.statistics.totalTimeSpent += enrollment.timeSpent;
        
        // Calculate new average score
        const totalScores = leaderboard.statistics.averageScore * (leaderboard.statistics.quizzesPassed - 1) + score;
        leaderboard.statistics.averageScore = totalScores / leaderboard.statistics.quizzesPassed;

        // Level up logic
        const pointsForNextLevel = leaderboard.level * 1000;
        if (leaderboard.totalPoints >= pointsForNextLevel) {
          leaderboard.level += 1;
        }

        // Award badges
        if (training.badges && training.badges.length > 0) {
          training.badges.forEach(badge => {
            leaderboard.badges.push({
              badgeName: badge.name,
              category: training.category
            });
          });
        }

        await leaderboard.save();
      }

      // Issue certificate if eligible
      if (training.certificateEligible) {
        enrollment.certificateIssued = true;
        enrollment.certificateUrl = `/certificates/${userId}/${id}`;
      }
    } else if (score !== undefined) {
      enrollment.score = score;
      enrollment.attempts += 1;
      enrollment.lastAttemptAt = new Date();
    }

    await training.save();

    res.json({
      success: true,
      message: enrollment.completed ? 'Training completed successfully!' : 'Progress updated',
      enrollment,
      pointsEarned: enrollment.completed ? training.points : 0
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating progress', 
      error: error.message 
    });
  }
};

// Get user's training progress
export const getUserTrainings = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;

    const trainings = await Training.find({
      'enrolledUsers.userId': userId
    }).populate('createdBy');

    const userTrainings = trainings.map(training => {
      const enrollment = training.enrolledUsers.find(
        e => e.userId.toString() === userId.toString()
      );
      
      return {
        _id: training._id,
        title: training.title,
        description: training.description,
        category: training.category,
        type: training.type,
        difficulty: training.difficulty,
        duration: training.duration,
        points: training.points,
        progress: enrollment?.progress || 0,
        completed: enrollment?.completed || false,
        score: enrollment?.score,
        certificateIssued: enrollment?.certificateIssued || false,
        certificateUrl: enrollment?.certificateUrl,
        enrolledAt: enrollment?.enrolledAt
      };
    });

    res.json({
      success: true,
      trainings: userTrainings
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user trainings', 
      error: error.message 
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const leaderboard = await Leaderboard.find()
      .sort({ totalPoints: -1, level: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email role');

    // Update ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaderboard', 
      error: error.message 
    });
  }
};

// Get user's leaderboard stats
export const getUserLeaderboardStats = async (req, res) => {
  try {
    const userId = req.user?._id || req.params.userId;

    let stats = await Leaderboard.findOne({ userId }).populate('userId', 'name email role');

    if (!stats) {
      stats = new Leaderboard({ userId });
      await stats.save();
      await stats.populate('userId', 'name email role');
    }

    // Calculate rank
    const higherRanked = await Leaderboard.countDocuments({
      totalPoints: { $gt: stats.totalPoints }
    });
    stats.rank = higherRanked + 1;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user stats', 
      error: error.message 
    });
  }
};

// Award achievement
export const awardAchievement = async (req, res) => {
  try {
    const { userId } = req.params;
    const { achievementName, description, points } = req.body;

    const leaderboard = await Leaderboard.findOne({ userId });
    
    if (!leaderboard) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found in leaderboard' 
      });
    }

    leaderboard.achievements.push({
      achievementName,
      description,
      points: points || 50
    });

    leaderboard.totalPoints += points || 50;
    
    await leaderboard.save();

    res.json({
      success: true,
      message: 'Achievement awarded successfully',
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error awarding achievement', 
      error: error.message 
    });
  }
};

export default {
  createTraining,
  getAllTrainings,
  enrollInTraining,
  updateProgress,
  getUserTrainings,
  getLeaderboard,
  getUserLeaderboardStats,
  awardAchievement
};
