const { Sequelize } = require('sequelize');
require('dotenv').config(); // Ensure environment variables are loaded

// Initialize Sequelize with the connection string from the environment variable
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Adjust this based on your SSL configuration
    }
  }
});

module.exports = sequelize;
