import SafetyCheck from "../models/SafetyCheck.js";

// Submit a safety checklist
 const submitSafetyCheck = async (req, res) => {
  try {
    const { tasks, gpsHistory, signature } = req.body;
    const userId = req.user.id;

    if (!tasks || !signature) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const safetyCheck = new SafetyCheck({
      userId,
      tasks,
      gpsHistory,
      signature,
    });

    await safetyCheck.save();
    res.status(201).json({ message: "Safety checklist submitted successfully", safetyCheck });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get safety checks for a user
const getUserSafetyChecks = async (req, res) => {
  try {
    const userId = req.user.id;
    const safetyChecks = await SafetyCheck.find({ userId }).sort({ submittedAt: -1 });

    res.status(200).json(safetyChecks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export { submitSafetyCheck, getUserSafetyChecks };