import Mine from "../models/Mine.js";

// Fetch all mines with improved error handling
const getAllMines = async (req, res) => {
  try {
    const mines = await Mine.find();
    if (mines.length === 0) {
      return res.status(404).json({ message: "No mines found" });
    }
    res.status(200).json(mines);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error fetching mines", error: error.message });
  }
};

// Create a new mine with validation and error handling
const createMine = async (req, res) => {
  try {
    const { name, latitude, longitude } = req.body;

    // Validate required fields
    if (!name || !latitude || !longitude) {
      return res.status(400).json({ message: "Name, Latitude, and Longitude are required" });
    }

    // Check if the mine already exists (optional step)
    const existingMine = await Mine.findOne({ name });
    if (existingMine) {
      return res.status(409).json({ message: "Mine with this name already exists" });
    }

    // Create a new mine
    const mine = new Mine({ name, latitude, longitude });
    await mine.save();

    res.status(201).json(mine);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error creating mine", error: error.message });
  }
};
export default { getAllMines, createMine };