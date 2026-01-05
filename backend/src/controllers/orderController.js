const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFGenerator = require('../services/pdfGenerator');
const fs = require('fs');
const path = require('path');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }
    
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complete shipping address'
      });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    const productUpdates = [];
    
    // Step 1: Check all products and calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }
      
      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`
        });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }
      
      // Add to order items
      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
      
      totalAmount += product.price * item.quantity;
      
      // Prepare stock update
      productUpdates.push({
        productId: product._id,
        quantity: item.quantity,
        currentStock: product.stock
      });
    }
    
    // Step 2: Create order in database
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD'
    });
    
    // Step 3: If Razorpay payment, create Razorpay order
    let razorpayOrder = null;
    if (paymentMethod === 'Razorpay') {
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // Convert to paise
          currency: 'INR',
          receipt: `order_${Date.now()}_${req.user._id}`,
          notes: {
            userId: req.user._id.toString(),
            orderFor: 'E-commerce Purchase'
          }
        });
        
        order.razorpayOrderId = razorpayOrder.id;
      } catch (razorpayError) {
        console.error('Razorpay order creation error:', razorpayError);
        return res.status(500).json({
          success: false,
          message: 'Payment gateway error',
          error: razorpayError.message
        });
      }
    }
    
    // Step 4: Save order
    const createdOrder = await order.save();
    
    // Step 5: Reduce stock (after order is saved successfully)
    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { $inc: { stock: -update.quantity } }
      );
    }
    
    // Step 6: Generate invoice automatically if payment is COD (immediate)
    if (paymentMethod === 'COD') {
      try {
        const user = await User.findById(req.user._id);
        const invoiceData = await PDFGenerator.generateInvoice(createdOrder, user);
        
        // Update order with invoice info
        createdOrder.invoice = {
          invoiceNumber: invoiceData.invoiceNumber,
          generated: true,
          pdfPath: invoiceData.pdfPath,
          generatedAt: new Date()
        };
        
        await createdOrder.save();
        
      } catch (invoiceError) {
        console.error('Invoice generation error:', invoiceError);
        // Don't fail the order if invoice generation fails
      }
    }
    
    // Prepare response
    const response = {
      success: true,
      data: createdOrder,
      message: 'Order created successfully'
    };
    
    // Add Razorpay details if applicable
    if (razorpayOrder) {
      response.razorpayOrder = {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID
      };
    }
    
    return res.status(201).json(response);
    
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error creating order'
    });
  }
};

// @desc    Verify Razorpay payment AND generate invoice
// @route   POST /api/orders/:id/verify-payment
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
    
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
    
    // Update order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }
    
    // Update order details
    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = Date.now();
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.razorpaySignature = razorpay_signature;
    
    // ✅ Generate invoice for Razorpay payment
    try {
      const user = await User.findById(req.user._id);
      const invoiceData = await PDFGenerator.generateInvoice(order, user);
      
      order.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        generated: true,
        pdfPath: invoiceData.pdfPath,
        generatedAt: new Date()
      };
    } catch (invoiceError) {
      console.error('Invoice generation error in verify payment:', invoiceError);
      // Continue even if invoice generation fails
    }
    
    await order.save();
    
    return res.json({
      success: true,
      data: order,
      message: 'Payment verified successfully'
    });
    
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying payment'
    });
  }
};

// @desc    Download invoice - FIXED VERSION
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Check if user has permission
    const isAdmin = req.user.role === 'admin';
    const isOrderOwner = order.user._id.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOrderOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only download your own invoices.' 
      });
    }
    
    // Check if payment is completed
    if (order.paymentStatus !== 'completed' && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Invoice is available only after payment is completed'
      });
    }
    
    // Generate invoice if not already generated
    let pdfPath = order.invoice?.pdfPath;
    let invoiceNumber = order.invoice?.invoiceNumber;
    
    if (!order.invoice?.generated) {
      try {
        const invoiceData = await PDFGenerator.generateInvoice(order, order.user);
        
        order.invoice = {
          invoiceNumber: invoiceData.invoiceNumber,
          generated: true,
          pdfPath: invoiceData.pdfPath,
          generatedAt: new Date()
        };
        
        await order.save();
        pdfPath = invoiceData.pdfPath;
        invoiceNumber = invoiceData.invoiceNumber;
      } catch (invoiceError) {
        console.error('Invoice generation error:', invoiceError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate invoice. Please try again.'
        });
      }
    }
    
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      // Regenerate if file is missing
      try {
        console.log('PDF file not found, regenerating...', pdfPath);
        const invoiceData = await PDFGenerator.generateInvoice(order, order.user);
        pdfPath = invoiceData.pdfPath;
        invoiceNumber = invoiceData.invoiceNumber;
        
        order.invoice.pdfPath = pdfPath;
        order.invoice.invoiceNumber = invoiceNumber;
        await order.save();
      } catch (regenerateError) {
        console.error('Invoice regeneration error:', regenerateError);
        return res.status(500).json({
          success: false,
          message: 'Invoice file not found. Please contact support.'
        });
      }
    }
    
    // ✅ FIX: Set proper headers for PDF download
    const fileName = `Invoice-${invoiceNumber || order._id}.pdf`;
    
    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fs.statSync(pdfPath).size);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error streaming invoice file'
        });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Download invoice error:', error);
    
    // Check if headers already sent
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Server error while downloading invoice' 
      });
    }
  }
};

// @desc    Get invoice status
// @route   GET /api/orders/:id/invoice-status
// @access  Private
const getInvoiceStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).select('invoice paymentStatus user');
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Check permissions
    const isAdmin = req.user.role === 'admin';
    const isOrderOwner = order.user.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOrderOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }
    
    res.json({
      success: true,
      invoice: order.invoice,
      paymentStatus: order.paymentStatus,
      canDownload: order.paymentStatus === 'completed' || isAdmin
    });
    
  } catch (error) {
    console.error('Get invoice status error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error' 
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if user owns order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }
    
    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image');
    
    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    
    return res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = Date.now();
    
    if (req.body.paymentId) {
      order.razorpayPaymentId = req.body.paymentId;
    }
    
    // Generate invoice when admin marks as paid
    try {
      const invoiceData = await PDFGenerator.generateInvoice(order, order.user);
      
      order.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        generated: true,
        pdfPath: invoiceData.pdfPath,
        generatedAt: new Date()
      };
    } catch (invoiceError) {
      console.error('Invoice generation error in admin mark paid:', invoiceError);
    }
    
    const updatedOrder = await order.save();
    
    return res.json({
      success: true,
      data: updatedOrder,
      message: 'Order marked as paid'
    });
  } catch (error) {
    console.error('Update order to paid error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    
    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: 'Please provide order status'
      });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    order.orderStatus = orderStatus;
    
    // If delivered, set delivered date
    if (orderStatus === 'delivered') {
      order.deliveredAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    return res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getOrderById,
  getMyOrders,
  getOrders,
  updateOrderToPaid,
  updateOrderStatus,
  downloadInvoice,
  getInvoiceStatus
};