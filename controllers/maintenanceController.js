import Maintenance from "../models/Maintenance.js";
import Mine from "../models/Mine.js";
import { emitToMine, emitToAll } from "../utils/socketHandler.js";

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
    const populated = await Maintenance.findById(maintenanceTask._id).populate('assignedTo', 'name role');
    emitToMine(String(resolvedMineId), 'maintenance:created', populated);
    emitToAll('maintenance:created', populated);
    res.status(201).json(populated || maintenanceTask);
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

    emitToMine(String(deletedTask.mineId), 'maintenance:deleted', { _id: deletedTask._id });
    emitToAll('maintenance:deleted', { _id: deletedTask._id });
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

    if (req.body.assignedTo !== undefined) existingTask.assignedTo = req.body.assignedTo;
    if (req.body.dueDate !== undefined) existingTask.dueDate = req.body.dueDate;
    if (req.body.category !== undefined) existingTask.category = req.body.category;
    if (req.body.equipmentId !== undefined) existingTask.equipmentId = req.body.equipmentId;
    if (req.body.equipmentName !== undefined) existingTask.equipmentName = req.body.equipmentName;
    if (req.body.mineId !== undefined) existingTask.mineId = req.body.mineId;

    const updatedTask = await existingTask.save();
    const populated = await Maintenance.findById(updatedTask._id).populate('assignedTo', 'name role');
    emitToMine(String(populated.mineId), 'maintenance:updated', populated);
    emitToAll('maintenance:updated', populated);
    res.status(200).json({ message: "Task updated successfully", updatedTask: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating task", error: error.message });
  }
};
const getOverdueTasks = async (req, res) => {
  try {
    const { mineId } = req.params;
    const query = {
      status: { $in: ['pending', 'in-progress', 'overdue'] },
      dueDate: { $lt: new Date() },
    };
    if (mineId && mineId !== 'all') query.mineId = mineId;
    const tasks = await Maintenance.find(query)
      .sort({ priority: -1, dueDate: 1 })
      .populate('assignedTo', 'name role');
    res.status(200).json({ success: true, tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ message: "Error fetching overdue tasks", error: error.message });
  }
};

export default { getAllMaintenance, createMaintenance, getMaintenanceById, deleteMaintenance, updateMaintenance, getOverdueTasks };
