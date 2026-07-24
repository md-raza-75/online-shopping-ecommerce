const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'shopeasy_jwt_secret_2023_change_this_in_production', {
    expiresIn: '30d'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, storeName, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all fields: name, email, password'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const assignedRole = (role === 'seller') ? 'seller' : 'user';
    const sellerStatus = (assignedRole === 'seller') ? 'pending' : 'approved';

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || null,
      role: assignedRole,
      sellerStatus: sellerStatus,
      storeName: storeName || (assignedRole === 'seller' ? `${name}'s Store` : null)
    });

    if (user) {
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          sellerStatus: user.sellerStatus,
          storeName: user.storeName,
          token: generateToken(user._id)
        },
        message: assignedRole === 'seller' 
          ? 'Seller registered successfully. Your account is pending Super Admin approval.'
          : 'User registered successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Check user and password
    if (user && (await user.matchPassword(password))) {
      // Block check
      if (user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been blocked. Please contact support.'
        });
      }

      // Record last login time
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          sellerStatus: user.sellerStatus,
          storeName: user.storeName,
          token: generateToken(user._id)
        },
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during login'
    });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      return res.json({
        success: true,
        data: user
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    
    return res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getUsers 
};

// @desc    Update user profile (name, phone, password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, phone, password, currentPassword } = req.body;

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;

    // Password change
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current password to change password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }
      user.password = password;
    }

    await user.save();

    return res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sellerStatus: user.sellerStatus,
        storeName: user.storeName
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Add/remove address
// @route   POST /api/auth/addresses
// @access  Private
const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, phone, address, city, state, postalCode, country, isDefault } = req.body;
    if (!name || !address || !city || !postalCode || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide all required address fields' });
    }

    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }

    user.addresses.push({ name, phone, address, city, state, postalCode, country: country || 'India', isDefault: !!isDefault });
    await user.save();

    return res.json({ success: true, data: user.addresses, message: 'Address added successfully' });
  } catch (error) {
    console.error('Add address error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:index
// @access  Private
const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= user.addresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index' });
    }

    user.addresses.splice(index, 1);
    await user.save();

    return res.json({ success: true, data: user.addresses, message: 'Address removed successfully' });
  } catch (error) {
    console.error('Delete address error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Set default address
// @route   PUT /api/auth/addresses/:index/default
// @access  Private
const setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= user.addresses.length) {
      return res.status(400).json({ success: false, message: 'Invalid address index' });
    }

    user.addresses.forEach((addr, i) => { addr.isDefault = (i === index); });
    await user.save();

    return res.json({ success: true, data: user.addresses, message: 'Default address updated' });
  } catch (error) {
    console.error('Set default address error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get wishlist
// @route   GET /api/auth/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name price image category rating numReviews isActive stock');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const activeWishlist = (user.wishlist || []).filter(p => p && p.isActive);
    return res.json({ success: true, data: activeWishlist, count: activeWishlist.length });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Toggle wishlist item (add/remove)
// @route   POST /api/auth/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const productId = req.params.productId;
    const index = user.wishlist.findIndex(id => id.toString() === productId);

    let message;
    if (index > -1) {
      user.wishlist.splice(index, 1);
      message = 'Removed from wishlist';
    } else {
      user.wishlist.push(productId);
      message = 'Added to wishlist';
    }

    await user.save();
    return res.json({ success: true, data: user.wishlist, message, inWishlist: index === -1 });
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Re-export everything together
module.exports = { 
  registerUser, 
  loginUser, 
  getUserProfile,
  getUsers,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  toggleWishlist
};