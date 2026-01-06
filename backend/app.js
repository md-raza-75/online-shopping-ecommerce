const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// ✅ FIX: Import controllers and create routes properly
const { registerUser, loginUser, getUserProfile, getUsers } = require('./src/controllers/authController');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('./src/controllers/productController');
const { createOrder, getMyOrders, getOrderById, getOrders, updateOrderToPaid, updateOrderStatus, downloadInvoice, getInvoiceStatus, verifyPayment } = require('./src/controllers/orderController');
const { protect, admin } = require('./src/middleware/authMiddleware');

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.get('/api/auth/users', protect, admin, getUsers);

// Product Routes
app.get('/api/products', getProducts);
app.get('/api/products/:id', getProductById);
app.post('/api/products', protect, admin, createProduct);
app.put('/api/products/:id', protect, admin, updateProduct);
app.delete('/api/products/:id', protect, admin, deleteProduct);

// Order Routes
app.post('/api/orders', protect, createOrder);
app.get('/api/orders/myorders', protect, getMyOrders);
app.get('/api/orders/:id', protect, getOrderById);
app.post('/api/orders/:id/verify-payment', protect, verifyPayment);
app.get('/api/orders/:id/invoice', protect, downloadInvoice);
app.get('/api/orders/:id/invoice-status', protect, getInvoiceStatus);
app.get('/api/orders', protect, admin, getOrders);
app.put('/api/orders/:id/pay', protect, admin, updateOrderToPaid);
app.put('/api/orders/:id/status', protect, admin, updateOrderStatus);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 ShopEasy E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}`);
  console.log(`🔄 Mode: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;