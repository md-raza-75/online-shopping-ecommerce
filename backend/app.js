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

// ✅ FIX: Import ALL controllers properly
const { registerUser, loginUser, getUserProfile, getUsers } = require('./src/controllers/authController');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getAdminProducts 
} = require('./src/controllers/productController');
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getOrders,
  updateOrderToPaid, 
  updateOrderStatus,
  downloadInvoice, 
  getInvoiceStatus, 
  verifyPayment 
} = require('./src/controllers/orderController');
const { protect, admin } = require('./src/middleware/authMiddleware');

// ✅ FIX: Import ALL routes
const productRoutes = require('./src/routes/productRoutes');
const couponRoutes = require('./src/routes/couponRoutes'); // ✅ LINE 1: ADD THIS LINE
// const orderRoutes = require('./src/routes/orderRoutes'); // Agar aapke paas orderRoutes file hai

// ✅ FIX: Use all routes
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes); // ✅ LINE 2: ADD THIS LINE

// ✅ FIX: Import check karo
console.log('Checking imports...');
console.log('getOrders exists:', typeof getOrders);
console.log('updateOrderStatus exists:', typeof updateOrderStatus);

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.get('/api/auth/users', protect, admin, getUsers);

// Product Routes (via router)
// Already handled by: app.use('/api/products', productRoutes);

// ✅ FIX: Order Routes (DIRECTLY in app.js if missing from routes file)
app.post('/api/orders', protect, createOrder);
app.get('/api/orders/myorders', protect, getMyOrders);
app.get('/api/orders/:id', protect, getOrderById);
app.post('/api/orders/:id/verify-payment', protect, verifyPayment);
app.get('/api/orders/:id/invoice', protect, downloadInvoice);
app.get('/api/orders/:id/invoice-status', protect, getInvoiceStatus);

// ✅ CRITICAL FIX: Add these missing routes
app.get('/api/orders', protect, admin, getOrders);  // Ye line add karo
app.put('/api/orders/:id/pay', protect, admin, updateOrderToPaid);
app.put('/api/orders/:id/status', protect, admin, updateOrderStatus);  // Ye line add karo

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 ShopEasy E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      coupons: '/api/coupons' // ✅ LINE 3: ADD THIS LINE
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
  console.log(`✅ Coupon API enabled at: http://localhost:${PORT}/api/coupons`); // ✅ LINE 4: ADD THIS LINE
});

module.exports = app;