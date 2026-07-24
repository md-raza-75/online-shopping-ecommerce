const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    
    return res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all products for admin dashboard
// @route   GET /api/products/admin/all
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    const pageSize = 20;
    const page = Number(req.query.page) || 1;
    const keyword = req.query.keyword 
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i'
          }
        } 
      : {};

    // Filter by seller if seller user is calling
    const filter = { ...keyword };
    if (req.user && req.user.role === 'seller') {
      filter.seller = req.user._id;
    }

    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('seller', 'name storeName email')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: {
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
      }
    });
  } catch (error) {
    console.error('Get admin products error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product && product.isActive) {
      return res.json({
        success: true,
        data: product
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
  } catch (error) {
    console.error('Get product by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, image, category } = req.body;
    
    // Validation
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, price, stock and category'
      });
    }
    
    const product = new Product({
      name,
      description,
      price,
      stock,
      image: image || '/images/default-product.jpg',
      category,
      seller: req.user._id
    });
    
    const createdProduct = await product.save();
    
    return res.status(201).json({
      success: true,
      data: createdProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, image, category, isActive } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership if seller
    if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only edit your own products'
      });
    }
    
    // Update fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.image = image || product.image;
    product.category = category || product.category;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    
    const updatedProduct = await product.save();
    
    return res.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership if seller
    if (req.user.role === 'seller' && product.seller && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only delete your own products'
      });
    }
    
    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();
    
    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Check if rating and comment are provided
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating and a comment'
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed the product
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'Product already reviewed'
      });
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: product.reviews
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private
const deleteProductReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find the review
    const review = product.reviews.find(
      (r) => r._id.toString() === req.params.reviewId
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check authorization: User can delete only their own, admin can delete any
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    // Remove the review
    product.reviews.pull(req.params.reviewId);

    // Recalculate values
    product.numReviews = product.reviews.length;
    if (product.reviews.length > 0) {
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
    } else {
      product.rating = 0;
    }

    await product.save();

    return res.json({
      success: true,
      message: 'Review deleted successfully',
      data: product.reviews
    });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get products belonging to seller
// @route   GET /api/seller/products
// @access  Private/Seller
const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    
    return res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  getProducts,
  getAdminProducts,
  getSellerProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  deleteProductReview
};