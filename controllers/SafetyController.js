import SafetyReport from "../models/SafetyReport.js";
import multer from "multer";
import fs from "fs";
import path from "path";

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/reports/";
    fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only images (jpg, jpeg, png) and PDFs are allowed"));
};

const upload = multer({ storage, fileFilter }).array("attachments", 5); // Allows up to 5 files

// Get all safety reports
const getAllSafetyReports = async (req, res) => {
  try {
    const reports = await SafetyReport.find()
      .populate("createdBy approvedBy", "name email")
      .lean();
    if (!reports.length) {
      return res.status(404).json({ message: "No safety reports found" });
    }
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error fetching reports", error: error.message });
  }
};

// Get a single report by ID
const getSafetyReportById = async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id)
      .populate("createdBy approvedBy", "name email")
      .lean();
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Error fetching report", error: error.message });
  }
};

// Create a new safety report
const createSafetyReport = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("File upload error:", err.message);
      return res.status(400).json({ message: err.message });
    }

    try {
      const { reportTitle, description, riskLevel, incidentDate, location, createdBy } = req.body;

      if (!reportTitle || !description || !riskLevel || !incidentDate || !location || !createdBy) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const attachments = req.files ? req.files.map((file) => file.path) : [];

      const report = new SafetyReport({
        reportTitle,
        description,
        riskLevel,
        incidentDate: new Date(incidentDate), // Ensure correct date format
        location,
        createdBy,
        attachments,
      });

      await report.save();
      res.status(201).json({ message: "Report created successfully", report });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Error creating report", error: error.message });
    }
  });
};

// Approve a safety report
const approveSafetyReport = async (req, res) => {
  try {
    const { approvedBy } = req.body;
    const report = await SafetyReport.findByIdAndUpdate(
      req.params.id,
      { status: "Reviewed", approvedBy },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ message: "Report approved", report });
  } catch (error) {
    console.error("Error approving report:", error);
    res.status(500).json({ message: "Error approving report", error: error.message });
  }
};

// Delete a safety report (with file deletion)
const deleteSafetyReport = async (req, res) => {
  try {
    const report = await SafetyReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Delete associated files
    if (report.attachments && report.attachments.length > 0) {
      report.attachments.forEach((filePath) => {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", filePath, err);
        });
      });
    }

    await SafetyReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Error deleting report", error: error.message });
  }
};

export { getAllSafetyReports, getSafetyReportById, createSafetyReport, approveSafetyReport, deleteSafetyReport };
