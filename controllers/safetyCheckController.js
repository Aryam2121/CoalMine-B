import SafetyCheck from "../models/SafetyCheck.js";
import path from "path";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const submitSafetyCheck = async (req, res) => {
  try {
    const tasks = req.body.tasks ? JSON.parse(req.body.tasks) : req.body.tasks;
    const gpsHistory = req.body.gpsHistory
      ? JSON.parse(req.body.gpsHistory)
      : req.body.gpsHistory;
    const { signature, mineId } = req.body;

    if (!tasks || !signature) {
      return res.status(400).json({ message: "Tasks and signature are required" });
    }

    const images = (req.files || []).map((f) => ({
      url: `/uploads/safety-checks/${f.filename}`,
      filename: f.filename,
    }));

    const safetyCheck = new SafetyCheck({
      userId: req.user?._id,
      mineId,
      tasks,
      gpsHistory: gpsHistory || [],
      signature,
      images,
      shiftDate: startOfToday(),
    });

    await safetyCheck.save();
    res.status(201).json({ message: "Safety checklist submitted successfully", safetyCheck });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserSafetyChecks = async (req, res) => {
  try {
    const userId = req.user?._id;
    const checks = await SafetyCheck.find({ userId }).sort({ submittedAt: -1 }).limit(50);
    res.status(200).json({ success: true, checks });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getShiftCheckStatus = async (req, res) => {
  try {
    const userId = req.user?._id;
    const today = startOfToday();
    const check = await SafetyCheck.findOne({ userId, shiftDate: today });
    res.json({
      success: true,
      completed: Boolean(check),
      check,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { submitSafetyCheck, getUserSafetyChecks, getShiftCheckStatus };
