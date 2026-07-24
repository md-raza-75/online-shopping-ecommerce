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

// ✅ UPDATED CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// ========== Import Controllers ==========
const { 
  registerUser, loginUser, getUserProfile, getUsers,
  updateProfile, addAddress, deleteAddress, setDefaultAddress,
  getWishlist, toggleWishlist
} = require('./src/controllers/authController');

const { 
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getAdminProducts, getSellerProducts 
} = require('./src/controllers/productController');

const { 
  createOrder, validateCoupon, verifyPayment,
  getOrderById, getMyOrders, getOrders, getSellerOrders, getSellerStats,
  updateOrderToPaid, updateOrderStatus, cancelOrder, requestReturn,
  downloadInvoice, downloadInvoiceQuick, getInvoiceStatus
} = require('./src/controllers/orderController');

const { validateCoupon: couponValidate } = require('./src/controllers/couponController');

const { 
  getAdminUsers, getAdminUserById, blockUnblockUser, deleteAdminUser,
  getAdminSellers, updateSellerStatus, getSellerAnalytics
} = require('./src/controllers/userController');

const { getNotifications, markAsRead, markAllRead } = require('./src/controllers/notificationController');

const { protect, admin, seller, approvedSeller } = require('./src/middleware/authMiddleware');

// ========== Route Files ==========
const productRoutes = require('./src/routes/productRoutes');
const couponRoutes = require('./src/routes/couponRoutes');

app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);

// ========== Auth Routes ==========
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.put('/api/auth/profile', protect, updateProfile);
app.get('/api/auth/users', protect, admin, getUsers);

// ========== Address Routes ==========
app.post('/api/auth/addresses', protect, addAddress);
app.delete('/api/auth/addresses/:index', protect, deleteAddress);
app.put('/api/auth/addresses/:index/default', protect, setDefaultAddress);

// ========== Wishlist Routes ==========
app.get('/api/auth/wishlist', protect, getWishlist);
app.post('/api/auth/wishlist/:productId', protect, toggleWishlist);

// ========== Notification Routes ==========
app.get('/api/notifications', protect, getNotifications);
app.put('/api/notifications/read-all', protect, markAllRead);
app.put('/api/notifications/:id/read', protect, markAsRead);

// ========== Admin User & Seller Management Routes ==========
app.get('/api/admin/users', protect, admin, getAdminUsers);
app.get('/api/admin/users/:id', protect, admin, getAdminUserById);
app.put('/api/admin/users/:id/block', protect, admin, blockUnblockUser);
app.delete('/api/admin/users/:id', protect, admin, deleteAdminUser);
app.get('/api/admin/sellers', protect, admin, getAdminSellers);
app.put('/api/admin/sellers/:id/status', protect, admin, updateSellerStatus);
app.get('/api/admin/seller-analytics', protect, admin, getSellerAnalytics);

// ========== Seller Portal Routes ==========
app.get('/api/seller/products', protect, seller, getSellerProducts);
app.get('/api/seller/orders', protect, seller, getSellerOrders);
app.get('/api/seller/stats', protect, seller, getSellerStats);

// ========== Order Routes ==========
// IMPORTANT: Specific routes MUST come before /:id routes
app.post('/api/orders', protect, createOrder);
app.get('/api/orders/myorders', protect, getMyOrders);

// ✅ FIX: validate-coupon BEFORE /:id to avoid route conflict
app.post('/api/orders/validate-coupon', protect, couponValidate);

// Admin order routes (before /:id)
app.get('/api/orders', protect, admin, getOrders);

// Individual order routes
app.get('/api/orders/:id', protect, getOrderById);
app.post('/api/orders/:id/verify-payment', protect, verifyPayment);
app.get('/api/orders/:id/invoice', protect, downloadInvoice);
app.get('/api/orders/:id/invoice-quick', protect, downloadInvoiceQuick);
app.get('/api/orders/:id/invoice-status', protect, getInvoiceStatus);
app.put('/api/orders/:id/pay', protect, admin, updateOrderToPaid);
app.put('/api/orders/:id/status', protect, admin, updateOrderStatus);
app.put('/api/orders/:id/cancel', protect, cancelOrder);
app.put('/api/orders/:id/return', protect, requestReturn);

// ========== Welcome & Health Routes ==========
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 ShopEasy E-commerce API',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      coupons: '/api/coupons',
      notifications: '/api/notifications'
    }
  });
});

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
    message: 'API endpoint not found',
    requested_url: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Local API: http://localhost:${PORT}`);
  console.log(`✅ CORS configured`);
  console.log(`📦 Multi-vendor marketplace API ready`);
});

module.exports = app;