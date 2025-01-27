import axios from "axios";

app.get('/api/weather-alerts', async (req, res) => {
    const location = req.query.location; // Assuming you have mine location
    const apiKey = '1274d7780f57033ed9118ea96db99182'; // OpenWeatherMap API Key

    const weatherData = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`
    );
    res.json(weatherData.data);
});

