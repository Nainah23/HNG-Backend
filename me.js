// server.js;
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT;

sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

// app.js;
const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const sequelize = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/users', userRoutes); 

module.exports = app;


//routes/authRoutes.js;
const express = require('express');
const { check } = require('express-validator');
const { register, login } = require('../controllers/authController');
const router = express.Router();

router.post(
  '/register',
  [
    check('firstName').not().isEmpty().withMessage('First name is required'),
    check('lastName').not().isEmpty().withMessage('Last name is required'),
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  register
);

router.post(
  '/login',
  [
    check('email').isEmail().withMessage('Valid email is required'),
    check('password').not().isEmpty().withMessage('Password is required')
  ],
  login
);

module.exports = router;

//routes/userRoutes.js;
const express = require('express');
const router = express.Router();
const { getUserById } = require('../controllers/userController');
const { verifyToken } = require('../utils/authUtils');

// Route to get user by ID
router.get('/:id', verifyToken, getUserById);

module.exports = router;


//routes/organisationRoutes.js;
const express = require('express');
const { check } = require('express-validator');
const {
  getOrganisations,
  getOrganisationById,
  createOrganisation,
  addUserToOrganisation
} = require('../controllers/organisationController');
const { verifyToken } = require('../utils/authUtils');
const router = express.Router();

router.get('/', verifyToken, getOrganisations);

router.get('/:orgId', verifyToken, getOrganisationById);

router.post(
  '/',
  verifyToken,
  [
    check('name').not().isEmpty().withMessage('Organisation name is required')
  ],
  createOrganisation
);

router.post('/:orgId/users', verifyToken, addUserToOrganisation);

module.exports = router;


//models/user.js;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING
  }
});

module.exports = User;



//models/organisation.js;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Organisation = sequelize.define('Organisation', {
  orgId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  }
});

module.exports = Organisation;


//controllers/authController.js;
const { User, Organisation } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { generateAccessToken } = require('../utils/authUtils');
const { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, password, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      userId: uuidv4(), 
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone
    });

    const organisation = await Organisation.create({
      orgId: uuidv4(),
      name: `${firstName}'s Organisation`,
      description: ''
    });

    await user.addOrganisation(organisation);

    const accessToken = generateAccessToken(user);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'Bad request',
      message: 'Registration unsuccessful',
      statusCode: 400
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'Bad request',
        message: 'Authentication failed',
        statusCode: 401
      });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        }
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

//controllers/userController.js;
const { User } = require('../models');

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'User details fetched successfully',
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
      statusCode: 500
    });
  }
};


//controllers/organisationController.js;
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


//config/database.js;
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


//config/config.json;
{
    "development": {
      "use_env_variable": "DATABASE_URL",
      "dialect": "postgres"
    },
    "production": {
      "use_env_variable": "DATABASE_URL",
      "dialect": "postgres"
    }
  }

//tests/auth.spec.js;
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const { sequelize } = require('../models');
const { expect } = chai;

chai.use(chaiHttp);

describe('Auth API', () => {
  let accessToken;
  let userId;
  let orgId;

  before(async () => {
    await sequelize.sync({ force: true });

    // Register a user
    const registerRes = await chai.request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@gmail.com',
        password: 'password123',
        phone: '1234567890'
      });

    expect(registerRes).to.have.status(201);
    expect(registerRes.body).to.have.property('status', 'success');
    expect(registerRes.body.data).to.have.property('accessToken');
    expect(registerRes.body.data.user).to.include({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@gmail.com'
    });

    accessToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.userId;
  });

  describe('POST /auth/login', () => {
    it('should log the user in successfully', (done) => {
      chai.request(app)
        .post('/auth/login')
        .send({
          email: 'john.doe@gmail.com',
          password: 'password123'
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('status', 'success');
          expect(res.body.data).to.have.property('accessToken');
          expect(res.body.data.user).to.include({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gmail.com'
          });
          accessToken = res.body.data.accessToken; // Update accessToken for protected endpoint tests
          done();
        });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user details for logged in user', (done) => {
      chai.request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`) // Set Authorization header
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('status', 'success');
          expect(res.body.data).to.include({
            userId: userId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@gmail.com'
          });
          done();
        });
    });
  });

  describe('Organisation API', () => {
    describe('POST /api/organisations', () => {
      it('should create a new organisation', (done) => {
        chai.request(app)
          .post('/api/organisations')
          .set('Authorization', `Bearer ${accessToken}`) // Set Authorization header
          .send({
            name: "John's Organisation",
            description: "Default organisation for John"
          })
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.data).to.have.property('orgId');
            expect(res.body.data).to.include({
              name: "John's Organisation",
              description: "Default organisation for John"
            });
            orgId = res.body.data.orgId;
            done();
          });
      });
    });

    describe('GET /api/organisations/:orgId', () => {
      it('should get details of a specific organisation', (done) => {
        chai.request(app)
          .get(`/api/organisations/${orgId}`)
          .set('Authorization', `Bearer ${accessToken}`) // Set Authorization header
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.data).to.include({
              orgId: orgId,
              name: "John's Organisation",
              description: "Default organisation for John"
            });
            done();
          });
      });
    });

    describe('GET /api/organisations', () => {
      it('should get all organisations of the logged in user', (done) => {
        chai.request(app)
          .get('/api/organisations')
          .set('Authorization', `Bearer ${accessToken}`) // Set Authorization header
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property('status', 'success');
            expect(res.body.data.organisations).to.be.an('array').that.is.not.empty;
            done();
          });
      });
    });
  });
});

//utils/authUtils.js;
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ status: 'error', message: 'No token provided', statusCode: 403 });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized', statusCode: 401 });
    }
    
    try {
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        return res.status(401).json({ status: 'error', message: 'User not found', statusCode: 401 });
      }
      
      req.user = user; // Attach the user object to the request
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Server error', statusCode: 500 });
    }
  });
};

module.exports = {
  generateAccessToken,
  verifyToken
};


//.env;
DATABASE_URL="postgresql://postgres.utjxnzxngnydhiherdnp:Nainakamah@18@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
JWT_SECRET=b7695dbad29d8b0afa5b5f477d0a20c92f10d03bc38b940aa61e29bea741a51a
PORT=3000
NODE_ENV=production