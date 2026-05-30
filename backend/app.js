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

// ✅ UPDATED CORS - Sab allow karega Cloudflare Tunnel ke liye
app.use(cors({
  origin: '*',  // All origins allow for demo
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

// Import controllers
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

// ✅ Import couponController
const { validateCoupon } = require('./src/controllers/couponController');

const { protect, admin } = require('./src/middleware/authMiddleware');

// Import routes
const productRoutes = require('./src/routes/productRoutes');
const couponRoutes = require('./src/routes/couponRoutes');

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/coupons', couponRoutes);

// Auth Routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/profile', protect, getUserProfile);
app.get('/api/auth/users', protect, admin, getUsers);

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

// ✅ Coupon validation route
app.post('/api/orders/validate-coupon', protect, validateCoupon);

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
      coupons: '/api/coupons'
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

// ✅ Cloudflare Tunnel testing route
app.get('/api/tunnel-test', (req, res) => {
  res.json({
    success: true,
    message: 'Cloudflare Tunnel Working!',
    tunnel: 'Active',
    frontend_url: 'https://ecommerce-demo.trycloudflare.com',
    backend_url: 'https://ecommerce-demo.trycloudflare.com/api',
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
  console.log(`🌐 Cloudflare Tunnel Ready!`);
  console.log(`🔗 Use this for demo: cloudflared tunnel --config tunnel-config.yml run ecommerce-demo`);
  console.log(`✅ CORS configured for Cloudflare Tunnel`);
});

module.exports = app;