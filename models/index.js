const sequelize = require('../config/database');
const User = require('./user');
const Organisation = require('./organisation');

// Define associations
User.belongsToMany(Organisation, { through: 'UserOrganisation' });
Organisation.belongsToMany(User, { through: 'UserOrganisation' });

module.exports = {
  sequelize,
  User,
  Organisation
};
