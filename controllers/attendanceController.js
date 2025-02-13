import Attendance from "../models/Attendance.js";

const  getWorkers = async (req, res) => {
    try {
      const  workers = await Attendance.find();
      res.json(workers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  // Add a new worker
  const  addWorker = async (req, res) => {
    try {
      const  newWorker = new Attendance(req.body);
      await newWorker.save();
      res.status(201).json(newWorker);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Update worker attendance status
  const  updateAttendance = async (req, res) => {
    try {
      const  { id } = req.params;
      const  { status } = req.body;
      const  worker = await Attendance.findByIdAndUpdate(id, { status }, { new: true });
      if (!worker) return res.status(404).json({ error: "Worker not found" });
      res.json(worker);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  
  // Delete a worker
  const  deleteWorker = async (req, res) => {
    try {
      await Attendance.findByIdAndDelete(req.params.id);
      res.json({ message: "Worker deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  export {getWorkers, addWorker,updateAttendance,deleteWorker};