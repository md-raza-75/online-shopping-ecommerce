const express = require('express');
const router = express.Router();
const {
  createCoupon,
  validateCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon
} = require('../controllers/couponController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/validate', protect, validateCoupon);

// Admin routes
router.route('/')
  .post(protect, admin, createCoupon)
  .get(protect, admin, getCoupons);

router.route('/:id')
  .get(protect, admin, getCouponById)
  .put(protect, admin, updateCoupon)
  .delete(protect, admin, deleteCoupon);

module.exports = router;