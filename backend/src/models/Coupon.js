const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: 0
  },
  minOrderAmount: {
    type: Number,
    required: [true, 'Minimum order amount is required'],
    min: 0,
    default: 0
  },
  maxDiscount: {
    type: Number,
    min: 0
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  maxUsage: {
    type: Number,
    required: [true, 'Maximum usage is required'],
    min: 1,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ isActive: 1 });

// Pre-save middleware to auto-deactivate expired coupons
couponSchema.pre('save', function(next) {
  if (this.expiryDate < new Date()) {
    this.isActive = false;
  }
  next();
});

// Method to check if coupon is valid
couponSchema.methods.isValid = function(userId) {
  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }
  
  // Check expiry
  if (this.expiryDate < new Date()) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  // Check usage limit
  if (this.usedCount >= this.maxUsage) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Check if user has already used it
  if (userId && this.usedBy.includes(userId)) {
    return { valid: false, message: 'You have already used this coupon' };
  }
  
  return { valid: true, message: 'Coupon is valid' };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (orderAmount * this.discountValue) / 100;
    
    // Apply max discount limit if set
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed amount discount
    discount = this.discountValue;
  }
  
  return discount;
};

module.exports = mongoose.model('Coupon', couponSchema);