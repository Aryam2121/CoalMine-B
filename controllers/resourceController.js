import Resource from "../models/Resource.js";

// Get all resources
const getResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new resource
const createResource = async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  console.log("Request Body:", req.body);
  
  const { name, used, available } = req.body;
  if (used + available !== 100) {
    return res.status(400).json({ error: 'Used + Available must be 100' });
  }
  
  try {
    const newResource = new Resource({ name, used, available });
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
export  { getResources, createResource, updateResource, deleteResource };