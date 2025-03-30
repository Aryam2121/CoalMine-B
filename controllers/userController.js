import User from '../models/User.js';

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
const getAllUsersByRole = async (req, res) => {
  try {
    const { role } = req.query; // Get role from query parameters

    // Define allowed roles
    const allowedRoles = ["worker", "Inspector", "Safety Manager", "Shift Incharge"];

    // Validate role input
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Fetch users based on role (if provided) or fetch all users
    const users = role ? await User.find({ role }) : await User.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};


export  default { getAllUsers, getUserById, createUser, updateUser, deleteUser ,getMyProfile,getAllUsersByRole };