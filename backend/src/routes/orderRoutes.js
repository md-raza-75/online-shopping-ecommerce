const express = require('express');
const router = express.Router();
const { 
  createOrder,
  verifyPayment,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToPaid,
  updateOrderStatus,
  downloadInvoice,      // ✅ Import new functions
  getInvoiceStatus
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// User routes
router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/verify-payment', protect, verifyPayment);

// ✅ New invoice routes
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id/invoice-status', protect, getInvoiceStatus);

// Admin routes
router.get('/', protect, admin, getOrders);
router.put('/:id/pay', protect, admin, updateOrderToPaid);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;