const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (without password)
      req.user = await User.findById(decoded.id).select('-password');
      
      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found, please login again' 
        });
      }
      
      // Call next middleware
      return next();
    }

    // If no token
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token provided' 
    });
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired, please login again' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Authorization failed' 
    });
  }
};

module.exports = { protect };