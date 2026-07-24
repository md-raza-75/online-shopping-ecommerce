const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all users with stats (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAdminUsers = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') filter.isBlocked = false;
    if (status === 'blocked') filter.isBlocked = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    // Enrich each user with order stats
    const enriched = await Promise.all(users.map(async (u) => {
      const orders = await Order.find({ user: u._id }).select('totalAmount orderStatus createdAt');
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return {
        ...u.toObject(),
        totalOrders,
        totalSpent
      };
    }));

    res.json({
      success: true,
      data: enriched,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('getAdminUsers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get single user with full detail (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getAdminUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const orders = await Order.find({ user: req.params.id })
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        totalOrders,
        totalSpent,
        orders
      }
    });
  } catch (error) {
    console.error('getAdminUserById error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Block or unblock a user (Admin)
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUnblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot block an admin account' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: user.isBlocked ? 'User blocked successfully' : 'User unblocked successfully',
      data: { isBlocked: user.isBlocked }
    });
  } catch (error) {
    console.error('blockUnblockUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Delete a user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteAdminUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete an admin account' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteAdminUser error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get sellers list for Admin with optional status filter
// @route   GET /api/admin/sellers
// @access  Private/Admin
const getAdminSellers = async (req, res) => {
  try {
    const { status = 'all', search = '' } = req.query;

    const filter = { role: 'seller' };
    if (status && status !== 'all') {
      filter.sellerStatus = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { storeName: { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sellers.length,
      data: sellers
    });
  } catch (error) {
    console.error('getAdminSellers error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Approve or reject seller application (Admin)
// @route   PUT /api/admin/sellers/:id/status
// @access  Private/Admin
const updateSellerStatus = async (req, res) => {
  try {
    const { sellerStatus } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(sellerStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid seller status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Seller user not found' });

    if (user.role !== 'seller') {
      return res.status(400).json({ success: false, message: 'User is not a seller' });
    }

    user.sellerStatus = sellerStatus;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `Seller status updated to ${sellerStatus}`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        sellerStatus: user.sellerStatus
      }
    });
  } catch (error) {
    console.error('updateSellerStatus error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = { 
  getAdminUsers, 
  getAdminUserById, 
  blockUnblockUser, 
  deleteAdminUser,
  getAdminSellers,
  updateSellerStatus
};

// @desc    Get sales analytics per seller (Admin)
// @route   GET /api/admin/seller-analytics
// @access  Private/Admin
const getSellerAnalytics = async (req, res) => {
  try {
    const sellers = await User.find({ role: 'seller' }).select('-password');
    const Product = require('../models/Product');

    const analytics = await Promise.all(sellers.map(async (seller) => {
      const [productCount, orders] = await Promise.all([
        Product.countDocuments({ seller: seller._id, isActive: true }),
        Order.find({ 'items.seller': seller._id }).lean()
      ]);

      let totalRevenue = 0;
      let totalItemsSold = 0;
      let totalOrders = orders.length;

      orders.forEach(order => {
        (order.items || []).forEach(item => {
          if (item.seller && item.seller.toString() === seller._id.toString()) {
            totalRevenue += (item.price || 0) * (item.quantity || 1);
            totalItemsSold += (item.quantity || 1);
          }
        });
      });

      return {
        _id: seller._id,
        name: seller.name,
        email: seller.email,
        storeName: seller.storeName,
        sellerStatus: seller.sellerStatus,
        productCount,
        totalOrders,
        totalItemsSold,
        totalRevenue,
        joinedAt: seller.createdAt
      };
    }));

    res.json({ success: true, data: analytics, count: analytics.length });
  } catch (error) {
    console.error('getSellerAnalytics error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// Re-export everything (module.exports is overwritten below to include new function)
module.exports = { 
  getAdminUsers, 
  getAdminUserById, 
  blockUnblockUser, 
  deleteAdminUser,
  getAdminSellers,
  updateSellerStatus,
  getSellerAnalytics
};
