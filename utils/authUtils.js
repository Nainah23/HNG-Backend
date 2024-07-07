const jwt = require('jsonwebtoken');
const { User } = require('../models');

const generateAccessToken = (user) => {
  return jwt.sign({ userId: user.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
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
      
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'Server error', statusCode: 500 });
    }
  });
};

module.exports = {
  generateAccessToken,
  verifyToken
};
