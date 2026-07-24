const express = require('express');
const router = express.Router();
const { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getOrders, 
  updateOrderToPaid, 
  updateOrderStatus, 
  downloadInvoice, 
  getInvoiceStatus, 
  verifyPayment,
  validateCoupon
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.post('/validate-coupon', protect, validateCoupon);
router.get('/myorders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.post('/:id/verify-payment', protect, verifyPayment);
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id/invoice-status', protect, getInvoiceStatus);
router.get('/', protect, admin, getOrders);
router.put('/:id/pay', protect, admin, updateOrderToPaid);
router.put('/:id/status', protect, admin, updateOrderStatus);

module.exports = router;