import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

app.get('/api/weather-alerts', async (req, res) => {
    const location = req.query.location;

    if (!location) {
        return res.status(400).json({ error: "Location query parameter is required." });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY; // Use environment variable for API key

    try {
        const weatherData = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`
        );
        res.json(weatherData.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching weather data." });
    }
});
