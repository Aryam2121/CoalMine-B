import Productivity from "../models/Productivity.js";

// Fetch Productivity Data with Pagination, Sorting, and Filtering
const getProductivityData = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, sortBy = 'date', order = 'asc' } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const total = await Productivity.countDocuments(query);
    const data = await Productivity.find(query)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      data,
      metadata: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
};
// Add a New Productivity Record
const addProductivityRecord = async (req, res) => {
  try {
    console.log(req.body); // Debugging ke liye

    let { date, value, description } = req.body;

    if (!date || !value) {
      return res.status(400).json({ message: 'Date and Value are required' });
    }

    // Ensure `value` is stored as an array of numbers
    if (typeof value === 'string') {
      value = value.split(',').map(num => parseFloat(num.trim())); // Convert to array of numbers
    }

    const newRecord = new Productivity({ date, value, description });
    await newRecord.save();

    res.status(201).json({ message: 'Record added successfully', record: newRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error adding record', error: error.message });
  }
};



// Update a Productivity Record
const  updateProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, value, description } = req.body;

    const updatedRecord = await Productivity.findByIdAndUpdate(
      id,
      { date, value, description },
      { new: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error updating record', error: error.message });
  }
};

// Delete a Productivity Record
const deleteProductivityRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await Productivity.findByIdAndDelete(id);

    if (!deletedRecord) {
      return res.status(404).json({ message: 'Record not found' });
    }

    res.status(200).json({ message: 'Record deleted successfully', record: deletedRecord });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
};
export default { getProductivityData, addProductivityRecord, updateProductivityRecord, deleteProductivityRecord };