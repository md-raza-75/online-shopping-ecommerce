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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

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

// Admin middleware
const admin = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized as admin' 
    });
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Seller middleware (seller role or admin)
const seller = (req, res, next) => {
  try {
    if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized as a seller' 
    });
  } catch (error) {
    console.error('Seller middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Approved Seller middleware (must be approved by Super Admin)
const approvedSeller = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    if (req.user && req.user.role === 'seller') {
      if (req.user.sellerStatus === 'approved') {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Your seller account is pending Super Admin approval. Access restricted.'
      });
    }
    
    return res.status(403).json({ 
      success: false,
      message: 'Not authorized as seller' 
    });
  } catch (error) {
    console.error('Approved seller middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = { protect, admin, seller, approvedSeller };