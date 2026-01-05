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

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files (invoices)
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// API Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 E-commerce API is running...',
    version: '1.0.0',
    documentation: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (Protected)'
      },
      products: {
        getAll: 'GET /api/products',
        getSingle: 'GET /api/products/:id',
        create: 'POST /api/products (Admin)',
        update: 'PUT /api/products/:id (Admin)',
        delete: 'DELETE /api/products/:id (Admin)'
      },
      orders: {
        create: 'POST /api/orders (Protected)',
        myOrders: 'GET /api/orders/myorders (Protected)',
        getSingle: 'GET /api/orders/:id (Protected)',
        getAll: 'GET /api/orders (Admin)',
        downloadInvoice: 'GET /api/orders/:id/invoice (Protected)', // ✅ New
        invoiceStatus: 'GET /api/orders/:id/invoice-status (Protected)' // ✅ New
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    suggestion: 'Check / for available endpoints'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server started successfully!`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
  console.log(`🔌 API Base URL: http://${HOST}:${PORT}/api`);
  console.log(`🗄️  Database: ${process.env.MONGODB_URI}`);
  console.log(`📄 Invoice Path: ${path.join(__dirname, 'invoices')}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log(`\n✅ Ready to accept requests...\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('⚠️  Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

module.exports = app;