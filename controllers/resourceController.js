import Resource from "../models/Resource.js";
import Mine from "../models/Mine.js";

// Get all resources
const getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({});
    res.json(resources);
  } catch (err) {
    console.error("Error fetching resources:", err);
    res.status(500).json({ error: err.message });
  }
};


// Create a new resource
const createResource = async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { name, used, available, mineId, type, unit } = req.body;
  const usedNum = Number(used) || 0;
  const availNum = Number(available) || 0;

  try {
    let resolvedMineId = mineId;
    if (!resolvedMineId) {
      const firstMine = await Mine.findOne().select('_id');
      resolvedMineId = firstMine?._id;
    }
    if (!resolvedMineId) {
      return res.status(400).json({ error: 'No mine found. Run npm run seed first.' });
    }

    const newResource = new Resource({
      name,
      used: usedNum,
      available: availNum,
      mineId: resolvedMineId,
      type: type || 'material',
      unit: unit || '%',
    });
    await newResource.save();
    res.status(201).json(newResource);
  } catch (err) {
    console.error('Error saving resource:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update a resource
const updateResource = async (req, res) => {
  try {
    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedResource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(updatedResource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a resource
const deleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export  { getAllResources, createResource, updateResource, deleteResource };