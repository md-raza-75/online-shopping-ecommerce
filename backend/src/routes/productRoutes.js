const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getAdminProducts,
  createProductReview,
  deleteProductReview
} = require('../controllers/productController');
const { protect, admin, approvedSeller } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Review routes
router.post('/:id/reviews', protect, createProductReview);
router.delete('/:id/reviews/:reviewId', protect, deleteProductReview);

// Admin-only route (full product list with inactive)
router.get('/admin/all', protect, admin, getAdminProducts);

// Create product — Admin OR approved Seller can create
router.post('/', protect, approvedSeller, createProduct);

// Update/Delete product — Admin OR approved Seller (controller enforces ownership for sellers)
router.put('/:id', protect, approvedSeller, updateProduct);
router.delete('/:id', protect, approvedSeller, deleteProduct);

module.exports = router;