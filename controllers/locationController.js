import  Location from "../models/locationModel.js";

// Fetch all locations
const getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find();
    console.log("Fetched locations:", locations); // Log data fetched from DB
    res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Error fetching locations" });
  }
};

// Create a new location
const createLocation = async (req, res) => {
  const { name, coordinates } = req.body;

  // Validate input
  if (
    !name || 
    !coordinates || 
    coordinates.type !== "Point" || 
    !Array.isArray(coordinates.coordinates) ||
    coordinates.coordinates.length !== 2 ||
    isNaN(coordinates.coordinates[0]) || // Longitude
    isNaN(coordinates.coordinates[1])    // Latitude
  ) {
    return res.status(400).json({ message: "Invalid coordinates format" });
  }

  try {
    const newLocation = new Location({
      name,
      coordinates: {
        type: "Point",
        coordinates: coordinates.coordinates,
      },
    });

    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Error creating location" });
  }
};

export { getAllLocations, createLocation };