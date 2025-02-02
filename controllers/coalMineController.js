import CoalMine from '../models/coalMineModel.js';

// Get all coal mines with optional pagination, filtering, and sorting
const getCoalMines = async (req, res) => {
  const { page = 1, limit = 10, sort = 'name', filter } = req.query;

  try {
    const query = filter ? { name: new RegExp(filter, 'i') } : {}; // Filter by name (case-insensitive)
    const coalMines = await CoalMine.find(query)
      .sort(sort) // Sort by a field, default is `name`
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CoalMine.countDocuments(query);

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
  const { name, location, workers } = req.body;

  // Validate required fields
  if (!name || !location || !location.latitude || !location.longitude) {
    return res.status(400).json({ message: 'Name and location (latitude, longitude) are required' });
  }

  try {
    // Check for duplicate name
    const existingMine = await CoalMine.findOne({ name });
    if (existingMine) {
      return res.status(409).json({ message: 'A coal mine with this name already exists' });
    }

    const newCoalMine = new CoalMine({
      name,
      location,
      workers: workers || [], // Optional workers array
    });

    await newCoalMine.save();

    res.status(201).json({
      data: newCoalMine,
      message: 'Coal mine created successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating coal mine', error: error.message });
  }
};

export { getCoalMines, createCoalMine };
