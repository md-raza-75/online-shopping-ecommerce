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
      user: req.user._id
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
    
    // Soft delete - just mark as inactive
    product.isActive = false;
    await product.save();
    
    // Alternatively, hard delete:
    // await product.deleteOne();
    
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

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};