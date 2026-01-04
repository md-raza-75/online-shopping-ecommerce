const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please enter product description']
  },
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
    min: [0, 'Price cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Please enter stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  image: {
    type: String,
    required: [true, 'Please add product image URL'],
    default: '/images/default-product.jpg'
  },
  category: {
    type: String,
    required: [true, 'Please enter product category'],
    enum: ['Clothing', 'Electronics', 'Home', 'Books', 'Other']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;