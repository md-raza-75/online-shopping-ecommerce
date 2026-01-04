const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Simple admin check middleware (use after protect middleware)
const admin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated. Please login first.' 
      });
    }

    if (req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error in admin check' 
    });
  }
};

// Combined protect + admin middleware
const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Not authorized. Admin access required.' 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('ProtectAdmin error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token' 
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Not authorized, no token' 
    });
  }
};

module.exports = { admin, protectAdmin };