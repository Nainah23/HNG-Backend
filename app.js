const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const sequelize = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/organisations', organisationRoutes);

module.exports = app;
