const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String,
    default: ''
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter recipient name']
  },
  address: { 
    type: String, 
    required: [true, 'Please enter address'] 
  },
  city: { 
    type: String, 
    required: [true, 'Please enter city'] 
  },
  state: {
    type: String,
    required: [true, 'Please enter state']
  },
  country: { 
    type: String, 
    default: 'India' 
  },
  postalCode: { 
    type: String, 
    required: [true, 'Please enter postal code'] 
  },
  phone: {
    type: String,
    required: [true, 'Please enter phone number']
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    default: ''
  },
  generated: {
    type: Boolean,
    default: false
  },
  pdfPath: {
    type: String,
    default: ''
  },
  generatedAt: {
    type: Date
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'Razorpay', 'Card', 'Wallet'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Payment details
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  
  // Delivery details
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  
  // Invoice system
  invoice: invoiceSchema,
  
  // Tracking
  trackingNumber: String,
  courierName: String,
  estimatedDelivery: Date,
  
  // Notes
  adminNotes: String,
  customerNotes: String,
  
  // Discount
  discountAmount: {
    type: Number,
    default: 0
  },
  couponCode: String,
  
  // Shipping
  shippingAmount: {
    type: Number,
    default: 0
  },
  taxAmount: {
    type: Number,
    default: 0
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-calculate tax if not set
  if (!this.taxAmount && this.totalAmount) {
    this.taxAmount = this.totalAmount * 0.18;
  }
  
  next();
});

// Virtual for readable order ID
orderSchema.virtual('orderId').get(function() {
  return `ORD${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for invoice number
orderSchema.virtual('formattedInvoiceNumber').get(function() {
  if (this.invoice?.invoiceNumber) {
    return this.invoice.invoiceNumber;
  }
  return `TEMP-INV-${this._id.toString().slice(-6)}`;
});

// Virtual for grand total
orderSchema.virtual('grandTotal').get(function() {
  return this.totalAmount + this.taxAmount + this.shippingAmount - this.discountAmount;
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;