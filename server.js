const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000; // Use process.env.PORT for Glitch compatibility

app.get('/api/hello', async (req, res) => {
  const visitorName = req.query.visitor_name || 'Visitor';
  const clientIp = '8.8.8.8';//req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  try {
    // Get location data based on IP
    const locationResponse = await axios.get(`http://ip-api.com/json/${clientIp}`);
    console.log('Location response:', locationResponse.data);

    const { city } = locationResponse.data;
    
    if (!city) {
      throw new Error('City not found in location data');
    }

    // Get weather data for the location
    const weatherApiKey = 'ceef8450164150c3913f1949f26e155e';
    const weatherResponse = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`);
    console.log('Weather response:', weatherResponse.data);

    const temperature = weatherResponse.data.main.temp;

    res.json({
      client_ip: clientIp,
      location: city,
      greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${city}`
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Unable to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
