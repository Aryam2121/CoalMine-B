import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { hasPermission, PERMISSIONS } from "../config/roles.js";

const formatDate = (d) => {
  if (d == null || d === "") return null;
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** GET /api/attendance?role=worker&date=YYYY-MM-DD */
const getAttendanceForDate = async (req, res) => {
  try {
    const { role, date } = req.query;
    const dateStr = formatDate(date);

    if (!dateStr) {
      return res.status(400).json({ error: "Valid date is required (YYYY-MM-DD)" });
    }

    const requesterRole = req.user?.role;
    const canManageAll = hasPermission(requesterRole, PERMISSIONS.ATTENDANCE_MANAGE_ALL);

    let userQuery = role ? { role } : {};
    if (!canManageAll) {
      userQuery = { _id: req.user._id };
    }

    const users = await User.find(userQuery).select("-password").lean();
    const records = await Attendance.find({ date: dateStr }).lean();
    const recordMap = new Map(records.map((r) => [r.userId.toString(), r]));

    const result = users.map((user) => {
      const rec = recordMap.get(user._id.toString());
      return {
        ...user,
        department: user.role,
        status: rec?.status || "Absent",
        attendanceId: rec?._id || null,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("getAttendanceForDate:", err);
    res.status(500).json({ error: err.message });
  }
};

/** PUT /api/attendance — upsert present/absent for a user on a date */
const upsertAttendance = async (req, res) => {
  try {
    const { userId, date, status } = req.body;
    const dateStr = formatDate(date);

    if (!userId || !dateStr || !status) {
      return res.status(400).json({ error: "userId, date, and status are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid userId" });
    }

    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({ error: "status must be Present or Absent" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const requesterRole = req.user?.role;
    const canManageAll = hasPermission(requesterRole, PERMISSIONS.ATTENDANCE_MANAGE_ALL);
    const isSelf = req.user?._id?.toString() === userId.toString();

    if (!canManageAll && !isSelf) {
      return res.status(403).json({
        error: "You can only update your own attendance. Managers can update all staff.",
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { userId, date: dateStr },
      {
        userId,
        name: user.name || "Unknown",
        department: user.role || "worker",
        date: dateStr,
        status,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      message: "Attendance saved",
      record,
      userId,
      status,
      date: dateStr,
    });
  } catch (err) {
    console.error("upsertAttendance:", err);
    res.status(500).json({ error: err.message });
  }
};

/** PUT /api/attendance/bulk — mark many users at once (managers only) */
const bulkUpsertAttendance = async (req, res) => {
  try {
    const { date, status, role, userIds } = req.body;
    const dateStr = formatDate(date);

    if (!dateStr || !status) {
      return res.status(400).json({ error: "date and status are required" });
    }
    if (!["Present", "Absent"].includes(status)) {
      return res.status(400).json({ error: "status must be Present or Absent" });
    }

    const requesterRole = req.user?.role;
    if (!hasPermission(requesterRole, PERMISSIONS.ATTENDANCE_MANAGE_ALL)) {
      return res.status(403).json({ error: "Only managers can bulk-update attendance" });
    }

    let users;
    if (Array.isArray(userIds) && userIds.length > 0) {
      const ids = userIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      users = await User.find({ _id: { $in: ids } }).select("-password").lean();
    } else if (role) {
      users = await User.find({ role }).select("-password").lean();
    } else {
      return res.status(400).json({ error: "Provide role or userIds" });
    }

    if (!users.length) {
      return res.json({ message: "No users to update", updated: 0 });
    }

    const ops = users.map((user) => ({
      updateOne: {
        filter: { userId: user._id, date: dateStr },
        update: {
          $set: {
            userId: user._id,
            name: user.name,
            department: user.role,
            date: dateStr,
            status,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops, { ordered: false });

    res.json({
      message: `Updated ${users.length} records`,
      updated: users.length,
      date: dateStr,
      status,
    });
  } catch (err) {
    console.error("bulkUpsertAttendance:", err);
    res.status(500).json({ error: err.message });
  }
};

/** GET /api/attendance/summary?date=YYYY-MM-DD */
const getAttendanceSummary = async (req, res) => {
  try {
    const dateStr = formatDate(req.query.date) || formatDate(new Date());
    const records = await Attendance.find({ date: dateStr }).lean();
    const present = records.filter((r) => r.status === "Present").length;
    res.json({ date: dateStr, present, absent: records.length - present, total: records.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getWorkers = async (req, res) => {
  try {
    const workers = await Attendance.find({ role: "Worker" });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addWorker = async (req, res) => {
  try {
    const newWorker = new Attendance({ ...req.body, role: "Worker" });
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid worker ID" });
    }
    const worker = await Attendance.findByIdAndUpdate(id, { status }, { new: true });
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json(worker);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid worker ID" });
    }
    const worker = await Attendance.findByIdAndDelete(id);
    if (!worker) return res.status(404).json({ error: "Worker not found" });
    res.json({ message: "Worker deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  getAttendanceForDate,
  upsertAttendance,
  bulkUpsertAttendance,
  getAttendanceSummary,
  getWorkers,
  addWorker,
  updateAttendance,
  deleteWorker,
};
