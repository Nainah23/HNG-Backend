const { Organisation, User } = require('../models');
const { v4: uuidv4 } = require('uuid');  // Import the uuid library

exports.getOrganisations = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    const organisations = await user.getOrganisations();

    res.status(200).json({
      status: 'success',
      message: 'Organisations fetched successfully',
      data: {
        organisations
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      statusCode: 500
    });
  }
};

exports.getOrganisationById = async (req, res) => {
  const { orgId } = req.params;

  try {
    const organisation = await Organisation.findByPk(orgId);

    if (!organisation) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Organisation fetched successfully',
      data: organisation
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      statusCode: 500
    });
  }
};

exports.createOrganisation = async (req, res) => {
  const { name, description } = req.body;

  try {
    const organisation = await Organisation.create({
      orgId: uuidv4(),  // Generate a UUID for the orgId
      name,
      description
    });

    await organisation.addUser(req.user);

    res.status(201).json({
      status: 'success',
      message: 'Organisation created successfully',
      data: organisation
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Client error',
      statusCode: 400
    });
  }
};

exports.addUserToOrganisation = async (req, res) => {
  const { orgId } = req.params;
  const { userId } = req.body;

  try {
    const organisation = await Organisation.findByPk(orgId);
    const user = await User.findByPk(userId);

    if (!organisation || !user) {
      return res.status(404).json({
        status: 'error',
        message: 'Organisation or user not found',
        statusCode: 404
      });
    }

    await organisation.addUser(user);

    res.status(200).json({
      status: 'success',
      message: 'User added to organisation successfully'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      statusCode: 500
    });
  }
};
