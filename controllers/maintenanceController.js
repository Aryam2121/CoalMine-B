import Maintenance from "../models/Maintenance.js";
import Mine from "../models/Mine.js";

// Fetch all maintenance tasks with improved error handling
const getAllMaintenance = async (req, res) => {
  try {
    const maintenanceTasks = await Maintenance.find().sort({ date: -1 }).populate('assignedTo', 'name role');
    res.status(200).json(maintenanceTasks);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error fetching maintenance tasks", error: error.message });
  }
};

// Create a new maintenance task with validation and better error handling
const createMaintenance = async (req, res) => {
  try {
    const { task, date, status, description, priority, mineId, dueDate } = req.body;

    if (!task) {
      return res.status(400).json({ message: "Task is required" });
    }

    let resolvedMineId = mineId;
    if (!resolvedMineId) {
      const firstMine = await Mine.findOne().select('_id');
      resolvedMineId = firstMine?._id;
    }
    if (!resolvedMineId) {
      return res.status(400).json({ message: "No mine found. Run npm run seed first." });
    }

    const taskDate = date ? new Date(date) : new Date();
    const taskDue = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const maintenanceTask = new Maintenance({
      mineId: resolvedMineId,
      task,
      date: taskDate,
      dueDate: taskDue,
      status: status || 'pending',
      description,
      priority: priority ? Number(priority) : 3,
    });

    await maintenanceTask.save();
    res.status(201).json(maintenanceTask);
  } catch (error) {
    console.error(error);  // Log error for debugging
    res.status(500).json({ message: "Error creating maintenance task", error: error.message });
  }
};
const getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenanceTask = await Maintenance.findById(id);

    if (!maintenanceTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(maintenanceTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching task", error: error.message });
  }
};
// Delete a maintenance task by ID
const deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Maintenance.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully", deletedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
};
const updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const { task, date, status, description, priority } = req.body;

    // Check if task exists
    const existingTask = await Maintenance.findById(id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update task fields
    existingTask.task = task || existingTask.task;
    existingTask.date = date || existingTask.date;
    existingTask.status = status || existingTask.status;
    existingTask.description = description || existingTask.description;
    existingTask.priority = priority || existingTask.priority;

    const updatedTask = await existingTask.save();
    res.status(200).json({ message: "Task updated successfully", updatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};
export default { getAllMaintenance, createMaintenance , getMaintenanceById, deleteMaintenance,updateMaintenance };
