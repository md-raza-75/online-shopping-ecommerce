const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ✅ FIX 1: Conditional Razorpay initialization
let razorpay = null;
try {
  const Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️ Razorpay keys missing. Online payments disabled.');
  }
} catch (error) {
  console.error('❌ Razorpay initialization failed:', error.message);
}

// ✅ FIX 2: Import PDFGenerator (aapke paas hai ye file)
const PDFGenerator = require('../services/pdfGenerator');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, customerNotes } = req.body;
    
    console.log('📦 Creating order...', { 
      itemsCount: items?.length,
      paymentMethod,
      userId: req.user._id 
    });
    
    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }
    
    // ✅ FIX 3: Better address validation
    const requiredFields = ['name', 'address', 'city', 'postalCode', 'phone'];
    const missingFields = requiredFields.filter(field => !shippingAddress?.[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing shipping address fields: ${missingFields.join(', ')}`
      });
    }
    
    let totalAmount = 0;
    const orderItems = [];
    const productUpdates = [];
    
    // Check all products and calculate total
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
        price: product.price,
        image: product.image
      });
      
      totalAmount += product.price * item.quantity;
      
      // Prepare stock update
      productUpdates.push({
        productId: product._id,
        quantity: item.quantity
      });
    }
    
    // Calculate tax and shipping
    const taxAmount = totalAmount * 0.18;
    const shippingAmount = totalAmount > 999 ? 0 : 50;
    const discountAmount = 0;
    const grandTotal = totalAmount + taxAmount + shippingAmount - discountAmount;
    
    console.log('💰 Order calculation:', {
      totalAmount,
      taxAmount,
      shippingAmount,
      grandTotal
    });
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: grandTotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      customerNotes,
      orderStatus: 'pending',
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending'
    });
    
    // ✅ FIX 4: Safe Razorpay order creation
    let razorpayOrder = null;
    if (paymentMethod === 'Razorpay' && razorpay) {
      try {
        console.log('💳 Creating Razorpay order...');
        
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          receipt: `order_${Date.now()}_${req.user._id}`,
          notes: {
            userId: req.user._id.toString(),
            orderFor: 'E-commerce Purchase'
          }
        });
        
        order.razorpayOrderId = razorpayOrder.id;
        console.log('✅ Razorpay order created:', razorpayOrder.id);
        
      } catch (razorpayError) {
        console.error('❌ Razorpay order creation error:', razorpayError.message);
        
        // ✅ FIX 5: Fallback to COD if Razorpay fails
        return res.status(400).json({
          success: false,
          message: 'Online payment currently unavailable. Please use Cash on Delivery (COD).',
          fallback: true
        });
      }
    } else if (paymentMethod === 'Razorpay' && !razorpay) {
      // If Razorpay not initialized
      return res.status(400).json({
        success: false,
        message: 'Online payments are currently disabled. Please use Cash on Delivery (COD).'
      });
    }
    
    // Save order
    const createdOrder = await order.save();
    console.log('✅ Order saved to database:', createdOrder._id);
    
    // Reduce stock
    for (const update of productUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { $inc: { stock: -update.quantity } },
        { new: true }
      );
    }
    console.log('📉 Stock updated for products');
    
    // Generate invoice for COD orders
    if (paymentMethod === 'COD') {
      try {
        const user = await User.findById(req.user._id);
        const invoiceData = await PDFGenerator.generateInvoice(createdOrder, user);
        
        createdOrder.invoice = {
          invoiceNumber: invoiceData.invoiceNumber,
          generated: true,
          pdfPath: invoiceData.pdfPath,
          generatedAt: new Date()
        };
        
        await createdOrder.save();
        console.log('📄 Invoice generated for COD order');
        
      } catch (invoiceError) {
        console.error('Invoice generation error:', invoiceError);
        // Continue even if invoice generation fails
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
    
    console.log('✅ Order creation complete, sending response');
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating order',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      .populate('items.product', 'name image category brand');
    
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
    
    res.json({
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
    
    res.status(500).json({
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
      .populate('items.product', 'name image')
      .lean();
    
    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      ...order,
      orderId: `ORD${order._id.toString().slice(-8).toUpperCase()}`,
      formattedDate: new Date(order.createdAt).toLocaleDateString('en-IN'),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
    }));
    
    res.json({
      success: true,
      count: orders.length,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
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
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const query = {};
    
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email')
      .lean();
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order to paid (Admin)
// @route   PUT /api/orders/:id/pay
// @access  Private/Admin
const updateOrderToPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // ✅ GET ACTUAL USER DATA
    const user = await User.findById(order.user).select('name email phone');
    
    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = Date.now();
    
    if (req.body.paymentId) {
      order.razorpayPaymentId = req.body.paymentId;
    }
    
    // Generate invoice with ACTUAL user data
    try {
      const invoiceData = await PDFGenerator.generateInvoice(order, user);
      
      order.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        generated: true,
        pdfPath: invoiceData.pdfPath,
        generatedAt: new Date()
      };
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError);
    }
    
    const updatedOrder = await order.save();
    
    res.json({
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
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, trackingNumber, courierName, adminNotes } = req.body;
    
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
    
    // Add tracking info if provided
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    if (adminNotes) order.adminNotes = adminNotes;
    
    // If delivered, set delivered date
    if (orderStatus === 'delivered') {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      
      // ✅ IMPORTANT: Auto-mark COD orders as paid when delivered
      if (order.paymentMethod === 'COD' && order.paymentStatus === 'pending') {
        order.paymentStatus = 'completed';
        order.isPaid = true;
        order.paidAt = Date.now();
        
        console.log(`✅ Auto-marked COD order ${order._id} as paid on delivery`);
      }
    }
    
    const updatedOrder = await order.save();
    
    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Download invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // ✅ CHECK PERMISSIONS
    const isAdmin = req.user && req.user.role === 'admin';
    const isOrderOwner = order.user.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOrderOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only download your own invoices.' 
      });
    }
    
    // ✅ CHECK PAYMENT STATUS - UPDATED: Allow download for delivered COD orders
    const canDownloadWithoutPayment = isAdmin || 
                                      order.paymentMethod === 'COD' || 
                                      order.orderStatus === 'delivered';
    const paymentCompleted = order.paymentStatus === 'completed';
    
    if (!canDownloadWithoutPayment && !paymentCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Invoice will be available after payment is completed'
      });
    }
    
    // ✅ GET USER DATA
    let userData;
    
    // Try to get user from database
    const userFromDB = await User.findById(order.user).select('name email phone');
    
    if (userFromDB) {
      userData = userFromDB;
    } else {
      // Fallback to request user or shipping address
      userData = {
        name: order.shippingAddress?.name || req.user?.name || 'Customer',
        email: req.user?.email || 'Not provided',
        phone: order.shippingAddress?.phone || req.user?.phone || 'Not provided'
      };
    }
    
    // Fix shipping address name if it's empty
    if (order.shippingAddress && 
        (!order.shippingAddress.name || order.shippingAddress.name.trim() === '')) {
      order.shippingAddress.name = userData.name;
    }
    
    // ✅ GENERATE INVOICE
    let pdfPath = order.invoice?.pdfPath;
    let invoiceNumber = order.invoice?.invoiceNumber;
    let shouldRegenerate = false;
    
    // Check if file exists
    if (pdfPath && fs.existsSync(pdfPath)) {
      // File exists, use it
    } else {
      shouldRegenerate = true;
    }
    
    // Generate new invoice if needed
    if (!order.invoice?.generated || shouldRegenerate) {
      try {
        // ✅ PASS USER DATA
        const invoiceData = await PDFGenerator.generateInvoice(order, userData);
        
        order.invoice = {
          invoiceNumber: invoiceData.invoiceNumber,
          generated: true,
          pdfPath: invoiceData.pdfPath,
          generatedAt: new Date(),
          downloadCount: (order.invoice?.downloadCount || 0) + 1
        };
        
        await order.save();
        pdfPath = invoiceData.pdfPath;
        invoiceNumber = invoiceData.invoiceNumber;
        
      } catch (invoiceError) {
        console.error('Invoice generation error:', invoiceError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate invoice'
        });
      }
    } else {
      // Increment download count
      order.invoice.downloadCount = (order.invoice.downloadCount || 0) + 1;
      await order.save();
    }
    
    // Verify file exists
    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Invoice file not found: ${pdfPath}`);
      return res.status(500).json({
        success: false,
        message: 'Invoice file not found on server'
      });
    }
    
    // Set headers for download
    const fileName = `ShopEasy-Invoice-${invoiceNumber || order._id}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
    });
    
  } catch (error) {
    console.error('Download invoice error:', error);
    
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
    const order = await Order.findById(orderId).select('invoice paymentStatus paymentMethod user orderStatus');
    
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
    
    // ✅ UPDATED: Check if can download - allow for delivered COD orders
    const canDownload = isAdmin || 
                       order.paymentStatus === 'completed' || 
                       order.paymentMethod === 'COD' ||
                       order.orderStatus === 'delivered';
    
    res.json({
      success: true,
      data: {
        invoice: order.invoice,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        canDownload,
        isAdmin: isAdmin
      }
    });
    
  } catch (error) {
    console.error('Get invoice status error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error' 
    });
  }
};

// @desc    Verify Razorpay payment
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
    
    // ✅ GET USER DATA
    const actualUser = await User.findById(req.user._id).select('name email phone');
    
    // Update order details
    order.paymentStatus = 'completed';
    order.isPaid = true;
    order.paidAt = Date.now();
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.razorpaySignature = razorpay_signature;
    
    // Generate invoice with USER data
    try {
      const invoiceData = await PDFGenerator.generateInvoice(order, actualUser);
      
      order.invoice = {
        invoiceNumber: invoiceData.invoiceNumber,
        generated: true,
        pdfPath: invoiceData.pdfPath,
        generatedAt: new Date()
      };
    } catch (invoiceError) {
      console.error('Invoice generation error:', invoiceError);
    }
    
    await order.save();
    
    res.json({
      success: true,
      data: order,
      message: 'Payment verified successfully'
    });
    
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error verifying payment'
    });
  }
};

// ✅ NEW FUNCTION: Optimized invoice download for frontend
// @desc    Quick download invoice (for frontend auto-download)
// @route   GET /api/orders/:id/invoice-quick
// @access  Private
const downloadInvoiceQuick = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }
    
    // Quick permission check (for COD orders only)
    if (order.paymentMethod !== 'COD') {
      return res.status(400).json({
        success: false,
        message: 'Quick download only available for COD orders'
      });
    }
    
    // Get existing invoice path
    const pdfPath = order.invoice?.pdfPath;
    
    if (!pdfPath || !fs.existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not generated yet'
      });
    }
    
    // Set headers for download
    const invoiceNumber = order.invoice?.invoiceNumber || `INV-${order._id}`;
    const fileName = `ShopEasy-Invoice-${invoiceNumber}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
    
    // Increment download count quietly
    order.invoice.downloadCount = (order.invoice.downloadCount || 0) + 1;
    await order.save();
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
    });
    
  } catch (error) {
    console.error('Quick download invoice error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        message: 'Server error while downloading invoice'
      });
    }
  }
};

// ✅ Module exports
module.exports = {
  createOrder,
  verifyPayment,
  getOrderById,
  getMyOrders,
  getOrders,  
  updateOrderToPaid,
  updateOrderStatus,
  downloadInvoice,
  downloadInvoiceQuick,
  getInvoiceStatus
};