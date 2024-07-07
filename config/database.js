const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres'
  });
} else {
  const config = require('./config.json');
  const env = process.env.NODE_ENV || 'production';

  sequelize = new Sequelize(
    config[env].database,
    config[env].username,
    config[env].password,
    {
      host: config[env].host,
      dialect: config[env].dialect
      // Other dialect-specific options can be added here
    }
  );
}

module.exports = sequelize;
