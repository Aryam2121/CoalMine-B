import User from '../models/User.js';
import Attendance from "../models/Attendance.js";
// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the user' });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user' });
  }
};

// Update a user by ID
const updateUser = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update user' });
  }
};

// Delete a user by ID
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
 const getMyProfile = async (req, res) => {
  res.json(req.user);
};
// const getAllUsersByRole = async (req, res) => {
//   try {
//     const { role, date } = req.query;

//     const allowedRoles = ["worker", "Inspector", "Safety Manager", "Shift Incharge"];
//     if (role && !allowedRoles.includes(role)) {
//       return res.status(400).json({ error: "Invalid role" });
//     }

//     if (!date || isNaN(Date.parse(date))) {
//       return res.status(400).json({ error: "Invalid or missing date" });
//     }

//     // Fetch users based on role
//     const users = role ? await User.find({ role }).lean() : await User.find().lean();

//     // Fetch attendance for the selected date
//     const attendanceRecords = await Attendance.find({ date }).lean();

//     // Map attendance records by userId
//     const attendanceMap = new Map(
//       attendanceRecords.map((record) => [record.userId.toString(), record.status])
//     );

//     // Attach attendance status to each user
//     const usersWithAttendance = users.map((user) => ({
//       ...user,
//       status: attendanceMap.get(user._id.toString()) || "Absent",
//     }));

//     res.status(200).json(usersWithAttendance);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch users with attendance" });
//   }
// };
// const addAttendance = async (req, res) => {
//   try {
//     const { userId, name, department, date, status } = req.body;

//     if (!userId || !name || !department || !date) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const newAttendance = new Attendance({
//       userId,
//       name,
//       department,
//       date,
//       status: status || "Absent",
//     });

//     await newAttendance.save();
//     res.status(201).json({ message: "Attendance record added", data: newAttendance });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to add attendance" });
//   }
// };
// const updateAttendance = async (req, res) => {
//   try {
//     const { userId, date, status } = req.body;

//     if (!userId || !date || !status) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Find and update attendance
//     const updatedAttendance = await Attendance.findOneAndUpdate(
//       { userId, date }, // Find record by userId & date
//       { status }, // Update status
//       { new: true, upsert: false } // Don't create new if not found
//     );

//     if (!updatedAttendance) {
//       return res.status(404).json({ error: "Attendance record not found" });
//     }

//     res.status(200).json({ message: "Attendance updated", data: updatedAttendance });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to update attendance" });
//   }
// };


export  default { getAllUsers, getUserById, createUser, updateUser, deleteUser ,getMyProfile };