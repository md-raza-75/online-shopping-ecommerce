const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiryDate,
      maxUsage
    } = req.body;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    // Create coupon
    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      expiryDate: new Date(expiryDate),
      maxUsage: maxUsage || 1,
      createdBy: req.user._id,
      isActive: true
    });

    const createdCoupon = await coupon.save();

    res.status(201).json({
      success: true,
      data: createdCoupon,
      message: 'Coupon created successfully'
    });
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating coupon'
    });
  }
};

// @desc    Validate a coupon
// @route   POST /api/coupons/validate
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    // ✅ ACCEPT BOTH parameter names for compatibility
    const { code, couponCode, orderAmount } = req.body;
    const userId = req.user._id;

    // ✅ Use whichever is available
    const actualCode = code || couponCode;
    
    if (!actualCode || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and order amount are required'
      });
    }

    // ✅ Find coupon WITHOUT isActive condition
    const coupon = await Coupon.findOne({ 
      code: actualCode.toUpperCase()
      // ❌ REMOVE: isActive: true - because isValid() method will check this
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is valid
    const validation = coupon.isValid(userId);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(orderAmount);
    
    // Final amount after discount
    const finalAmount = orderAmount - discount;

    res.json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxDiscount: coupon.maxDiscount
        },
        discount,
        finalAmount,
        originalAmount: orderAmount
      },
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error validating coupon'
    });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    if (status === 'active') {
      query.isActive = true;
      query.expiryDate = { $gt: new Date() };
    } else if (status === 'expired') {
      query.expiryDate = { $lt: new Date() };
    } else if (status === 'used') {
      query.usedCount = { $gte: query.maxUsage || 1 };
    }

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Coupon.countDocuments(query);

    // Format coupons for frontend
    const formattedCoupons = coupons.map(coupon => {
      const isExpired = new Date(coupon.expiryDate) < new Date();
      const isUsedUp = coupon.usedCount >= coupon.maxUsage;
      
      return {
        ...coupon,
        status: !coupon.isActive ? 'inactive' : 
                isUsedUp ? 'used' : 
                isExpired ? 'expired' : 'active',
        discountDisplay: coupon.discountType === 'percentage' ? 
                        `${coupon.discountValue}%` : 
                        `₹${coupon.discountValue}`,
        usageDisplay: `${coupon.usedCount}/${coupon.maxUsage}`,
        remainingDays: Math.ceil((new Date(coupon.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
      };
    });

    res.json({
      success: true,
      count: coupons.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: formattedCoupons
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching coupons'
    });
  }
};

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Private/Admin
const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('usedBy', 'name email');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Get coupon by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching coupon'
    });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
const updateCoupon = async (req, res) => {
  try {
    const {
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiryDate,
      maxUsage,
      isActive
    } = req.body;

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Update fields
    if (description !== undefined) coupon.description = description;
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (expiryDate !== undefined) coupon.expiryDate = new Date(expiryDate);
    if (maxUsage !== undefined) coupon.maxUsage = maxUsage;
    if (isActive !== undefined) coupon.isActive = isActive;

    const updatedCoupon = await coupon.save();

    res.json({
      success: true,
      data: updatedCoupon,
      message: 'Coupon updated successfully'
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating coupon'
    });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Check if coupon has been used
    if (coupon.usedCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete coupon that has been used'
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error deleting coupon'
    });
  }
};

module.exports = {
  createCoupon,
  validateCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon
};