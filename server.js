const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000; // Use process.env.PORT for Glitch compatibility

app.get('/api/hello', async (req, res) => {
  const visitorName = req.query.visitor_name || 'Visitor';
  let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  // Extract the first IP address if multiple addresses are present
  if (clientIp) {
    clientIp = clientIp.split(',')[0];
  } else {
    clientIp = req.connection.remoteAddress;
  }

  try {
    // Get location data based on IP using ipinfo.io
    const locationResponse = await axios.get(`https://ipinfo.io/${clientIp}/json`);
    console.log('Location response:', locationResponse.data);

    // Handle response from ipinfo.io
    const { city } = locationResponse.data;

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
