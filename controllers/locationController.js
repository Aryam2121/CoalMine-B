import Location from "../models/locationModel.js";

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

  if (!name || !coordinates || !coordinates.type || !coordinates.coordinates) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newLocation = new Location({
      name,
      coordinates: {
        type: "Point", // Geospatial type
        coordinates: coordinates.coordinates, // GeoJSON coordinates [longitude, latitude]
      },
    });

    const savedLocation = await newLocation.save();
    res.status(201).json(savedLocation); // Send the saved location back as response
  } catch (error) {
    console.error("Error creating location:", error);
    res.status(500).json({ message: "Error creating location" }); // Send an error response
  }
};
export { getAllLocations, createLocation };