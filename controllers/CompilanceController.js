import CompilanceReport from "../models/CompilanceModel.js";

// Get reports with filtering & pagination
const getReports = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const reports = await CompilanceReport.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CompilanceReport.countDocuments(query);

    res.json({ total, page: parseInt(page), reports });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Create a new report
const createReport = async (req, res) => {
  try {
    const report = new CompilanceReport(req.body);
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a report
const updateReport = async (req, res) => {
    const { id } = req.params;
  
    // Log the incoming data and the ID
    console.log("Request body:", req.body);
    console.log("Report ID:", id);
  
    // Check if the ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }
  
    try {
      const report = await CompilanceReport.findByIdAndUpdate(id, req.body, { new: true });
      if (!report) return res.status(404).json({ error: "Report not found" });
      res.json(report);
    } catch (error) {
      console.error("Error during update:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  };

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const report = await CompilanceReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export { getReports, createReport, updateReport, deleteReport };