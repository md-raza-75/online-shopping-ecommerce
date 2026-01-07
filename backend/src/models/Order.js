const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    name: String,
    quantity: Number,
    price: Number,
    image: String
  }],
  
  // Amount details
  totalAmount: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  shippingAmount: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  
  // Coupon details
  couponCode: {
    type: String,
    default: null
  },
  couponDetails: {
    code: String,
    discountType: String,
    discountValue: Number,
    minOrderAmount: Number,
    maxDiscount: Number
  },
  
  // Shipping details
  shippingAddress: {
    name: String,
    address: String,
    city: String,
    state: String,
    country: String,
    postalCode: String,
    phone: String
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['COD', 'Razorpay'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Order status
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  
  // Tracking
  trackingNumber: String,
  courierName: String,
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Invoice
  invoice: {
    invoiceNumber: String,
    generated: {
      type: Boolean,
      default: false
    },
    pdfPath: String,
    generatedAt: Date,
    downloadCount: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for formatted order ID
orderSchema.virtual('orderId').get(function() {
  return `ORD${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for invoice number
orderSchema.virtual('invoiceNumber').get(function() {
  return `INV${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to update order status
orderSchema.methods.updateStatus = async function(status, trackingInfo = {}) {
  this.orderStatus = status;
  
  if (status === 'delivered') {
    this.isDelivered = true;
    this.deliveredAt = Date.now();
    
    // Auto-mark COD orders as paid when delivered
    if (this.paymentMethod === 'COD' && this.paymentStatus === 'pending') {
      this.paymentStatus = 'completed';
      this.isPaid = true;
      this.paidAt = Date.now();
    }
  }
  
  if (trackingInfo.trackingNumber) {
    this.trackingNumber = trackingInfo.trackingNumber;
  }
  
  if (trackingInfo.courierName) {
    this.courierName = trackingInfo.courierName;
  }
  
  if (trackingInfo.adminNotes) {
    this.adminNotes = trackingInfo.adminNotes;
  }
  
  return this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;