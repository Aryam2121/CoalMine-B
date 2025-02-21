import CoalMine from '../models/coalMineModel.js';

// Get all coal mines with optional pagination, filtering, and sorting
const getCoalMines = async (req, res) => {
  const { page = 1, limit = 10, sort = 'name', filter } = req.query;

  try {
    const query = filter ? { name: { $regex: filter, $options: 'i' } } : {}; // Case-insensitive name filter
    const options = {
      sort: { [sort]: 1 }, // Dynamic sorting field, ascending order
      skip: (page - 1) * limit,
      limit: parseInt(limit),
    };

    const [coalMines, total] = await Promise.all([
      CoalMine.find(query, null, options),
      CoalMine.countDocuments(query),
    ]);

    res.status(200).json({
      data: coalMines,
      message: 'Coal mines retrieved successfully',
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coal mines', error: error.message });
  }
};

// Add a new coal mine
const createCoalMine = async (req, res) => {
  const { name, location, workers = [] } = req.body;

  // Validate required fields
  if (!name || !location?.latitude || !location?.longitude) {
    return res.status(400).json({ message: 'Name and location (latitude, longitude) are required' });
  }

  try {
    // Check for duplicate name
    const existingMine = await CoalMine.findOne({ name });
    if (existingMine) {
      return res.status(409).json({ message: 'A coal mine with this name already exists' });
    }

    const newCoalMine = new CoalMine({ name, location, workers });
    await newCoalMine.save();

    res.status(201).json({
      data: newCoalMine,
      message: 'Coal mine created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coal mine', error: error.message });
  }
};

// Update an existing coal mine
const updateCoalMine = async (req, res) => {
  const { id } = req.params;
  const { name, location, workers } = req.body;

  try {
    const updatedMine = await CoalMine.findByIdAndUpdate(
      id,
      { name, location, workers },
      { new: true, runValidators: true }
    );

    if (!updatedMine) {
      return res.status(404).json({ message: 'Coal mine not found' });
    }

    res.status(200).json({
      data: updatedMine,
      message: 'Coal mine updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating coal mine', error: error.message });
  }
};

// Delete a coal mine
const deleteCoalMine = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedMine = await CoalMine.findByIdAndDelete(id);
    if (!deletedMine) {
      return res.status(404).json({ message: 'Coal mine not found' });
    }

    res.status(200).json({ message: 'Coal mine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coal mine', error: error.message });
  }
};

export { getCoalMines, createCoalMine, updateCoalMine, deleteCoalMine };
