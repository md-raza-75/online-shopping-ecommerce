const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const { createNotification } = require('./notificationController');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');


// ✅ Conditional Razorpay initialization
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

// ✅ Import PDFGenerator
const PDFGenerator = require('../services/pdfGenerator');

// ✅ COUPON VALIDATION FUNCTION
const validateAndCalculateCoupon = async (couponCode, orderAmount, userId) => {
  if (!couponCode) {
    return { success: true, discount: 0, coupon: null };
  }

  try {
    // Find coupon
    const coupon = await Coupon.findOne({ 
      code: couponCode.toUpperCase(),
      isActive: true 
    });

    if (!coupon) {
      return { 
        success: false, 
        message: 'Invalid coupon code',
        discount: 0 
      };
    }

    // Check if coupon is valid
    const validation = coupon.isValid(userId);
    if (!validation.valid) {
      return { 
        success: false, 
        message: validation.message,
        discount: 0 
      };
    }

    // Check minimum order amount
    if (orderAmount < coupon.minOrderAmount) {
      return { 
        success: false, 
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
        discount: 0 
      };
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(orderAmount);

    return {
      success: true,
      discount,
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount
      }
    };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return { 
      success: false, 
      message: 'Error validating coupon',
      discount: 0 
    };
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, customerNotes, couponCode } = req.body;
    const userId = req.user._id;
    
    console.log('📦 Creating order...', { 
      itemsCount: items?.length,
      paymentMethod,
      couponCode,
      userId 
    });
    
    // Validation
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided'
      });
    }
    
    // Address validation
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
      
      // Fetch seller info if product has seller
      let sellerId = product.seller || null;
      let sellerName = 'Main Store';
      let storeName = 'ShopEasy Main Store';
      if (sellerId) {
        const sellerUser = await User.findById(sellerId).select('name storeName');
        if (sellerUser) {
          sellerName = sellerUser.name;
          storeName = sellerUser.storeName || `${sellerUser.name}'s Store`;
        }
      }

      // Add to order items
      orderItems.push({
        product: product._id,
        seller: sellerId,
        sellerName,
        storeName,
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
    
    // ✅ COUPON VALIDATION AND CALCULATION
    let discountAmount = 0;
    let couponDetails = null;
    
    if (couponCode) {
      const couponResult = await validateAndCalculateCoupon(couponCode, totalAmount, userId);
      
      if (!couponResult.success) {
        return res.status(400).json({
          success: false,
          message: couponResult.message
        });
      }
      
      discountAmount = couponResult.discount;
      couponDetails = couponResult.coupon;
      
      console.log('🎫 Coupon applied:', {
        code: couponCode,
        discount: discountAmount,
        couponDetails
      });
    }
    
    // Calculate tax and shipping
    const taxAmount = totalAmount * 0.18;
    const shippingAmount = totalAmount > 999 ? 0 : 50;
    const grandTotal = totalAmount + taxAmount + shippingAmount - discountAmount;
    
    console.log('💰 Order calculation:', {
      totalAmount,
      taxAmount,
      shippingAmount,
      discountAmount,
      grandTotal
    });
    
    // Create order
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount: grandTotal,
      taxAmount,
      shippingAmount,
      discountAmount,
      couponCode: couponDetails ? couponDetails.code : null,
      couponDetails: couponDetails,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      customerNotes,
      orderStatus: 'pending',
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending'
    });
    
    // ✅ UPDATE COUPON USAGE AFTER ORDER CREATION
    if (couponCode && couponDetails) {
      try {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          coupon.usedCount += 1;
          coupon.usedBy.push(userId);
          
          // Deactivate if usage limit reached
          if (coupon.usedCount >= coupon.maxUsage) {
            coupon.isActive = false;
          }
          
          await coupon.save();
          console.log(`✅ Coupon ${couponCode} usage updated: ${coupon.usedCount}/${coupon.maxUsage}`);
        }
      } catch (couponError) {
        console.error('Error updating coupon usage:', couponError);
        // Don't fail the order if coupon update fails
      }
    }
    
    // ✅ Safe Razorpay order creation
    let razorpayOrder = null;
    if (paymentMethod === 'Razorpay' && razorpay) {
      try {
        console.log('💳 Creating Razorpay order...');
        
        razorpayOrder = await razorpay.orders.create({
          amount: Math.round(grandTotal * 100),
          currency: 'INR',
          receipt: `order_${Date.now()}_${userId}`,
          notes: {
            userId: userId.toString(),
            orderFor: 'E-commerce Purchase'
          }
        });
        
        order.razorpayOrderId = razorpayOrder.id;
        console.log('✅ Razorpay order created:', razorpayOrder.id);
        
      } catch (razorpayError) {
        console.error('❌ Razorpay order creation error:', razorpayError.message);
        
        // Fallback to COD if Razorpay fails
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
        const user = await User.findById(userId);
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

// @desc    Validate coupon before checkout
// @route   POST /api/orders/validate-coupon
// @access  Private
const validateCoupon = async (req, res) => {
  try {
    const { couponCode, orderAmount } = req.body;
    const userId = req.user._id;

    if (!couponCode || !orderAmount) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and order amount are required'
      });
    }

    const couponResult = await validateAndCalculateCoupon(couponCode, orderAmount, userId);

    if (!couponResult.success) {
      return res.status(400).json({
        success: false,
        ...couponResult
      });
    }

    res.json({
      success: true,
      data: {
        coupon: couponResult.coupon,
        discount: couponResult.discount,
        finalAmount: orderAmount - couponResult.discount,
        originalAmount: orderAmount
      },
      message: 'Coupon is valid'
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error validating coupon'
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
      .populate('user', 'name email phone')
      .populate('items.seller', 'name email storeName')
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
    
    // Send in-app notification to user
    const statusMessages = {
      pending: 'Your order has been placed and is pending confirmation.',
      processing: 'Your order is being processed.',
      shipped: `Your order has been shipped${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}.`,
      delivered: 'Your order has been delivered! You can now download the invoice.',
      cancelled: 'Your order has been cancelled.'
    };
    try {
      await createNotification(
        order.user,
        `Order Status: ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}`,
        statusMessages[orderStatus] || `Your order status has been updated to ${orderStatus}.`,
        'order_update',
        order._id
      );
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError.message);
    }
    
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
    
    // ✅ CHECK PERMISSIONS & DELIVERED STATUS
    const isAdmin = req.user && req.user.role === 'admin';
    const isOrderOwner = order.user.toString() === req.user._id.toString();
    
    if (!isAdmin && !isOrderOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. You can only download your own invoices.' 
      });
    }
    
    // ✅ PDF download is only available once admin marks the order as 'delivered'
    if (!isAdmin && order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Invoice PDF download is available only after your order has been delivered.'
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
    
    // ✅ Check if can download - enabled only when order is delivered (or for admins)
    const canDownload = isAdmin || order.orderStatus === 'delivered';
    
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
    
    // Quick permission and delivered status check
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && order.orderStatus !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Invoice PDF download is available only after your order has been delivered.'
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

// @desc    Get orders containing seller items
// @route   GET /api/seller/orders
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();
    const orders = await Order.find({ 'items.seller': req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .lean();

    // Filter items to only include items belonging to this seller
    const sellerOrders = orders.map(order => {
      const sellerItems = (order.items || []).filter(item => 
        item.seller && item.seller.toString() === sellerId
      );
      const sellerSubtotal = sellerItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);

      return {
        ...order,
        items: sellerItems,
        sellerSubtotal
      };
    });

    res.json({
      success: true,
      count: sellerOrders.length,
      data: sellerOrders
    });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Get stats for seller dashboard
// @route   GET /api/seller/stats
// @access  Private/Seller
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id.toString();
    const productsCount = await Product.countDocuments({ seller: req.user._id, isActive: true });
    
    const orders = await Order.find({ 'items.seller': req.user._id }).lean();
    let totalRevenue = 0;
    let totalItemsSold = 0;

    orders.forEach(order => {
      (order.items || []).forEach(item => {
        if (item.seller && item.seller.toString() === sellerId) {
          totalRevenue += (item.price || 0) * (item.quantity || 1);
          totalItemsSold += (item.quantity || 1);
        }
      });
    });

    res.json({
      success: true,
      data: {
        productsCount,
        ordersCount: orders.length,
        totalRevenue,
        totalItemsSold
      }
    });
  } catch (error) {
    console.error('Get seller stats error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Cancel an order (User - only pending orders)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled.' });
    }

    order.orderStatus = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by customer';

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    await order.save();

    await createNotification(
      order.user,
      'Order Cancelled',
      `Your order has been cancelled. ${reason ? `Reason: ${reason}` : ''}`,
      'order_cancelled',
      order._id
    );

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// @desc    Request return for a delivered order (User)
// @route   PUT /api/orders/:id/return
// @access  Private
const requestReturn = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Please provide a reason for the return request' });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Return requests can only be made for delivered orders.' });
    }
    if (order.returnRequest?.requested) {
      return res.status(400).json({ success: false, message: 'A return request has already been submitted for this order.' });
    }

    order.returnRequest = { requested: true, reason, status: 'pending', requestedAt: new Date() };
    await order.save();

    await createNotification(
      order.user,
      'Return Request Submitted',
      'Your return request has been submitted and is under review.',
      'return_update',
      order._id
    );

    res.json({ success: true, message: 'Return request submitted successfully', data: order });
  } catch (error) {
    console.error('Request return error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

// ✅ Module exports
module.exports = {
  createOrder,
  validateCoupon,
  verifyPayment,
  getOrderById,
  getMyOrders,
  getOrders,
  getSellerOrders,
  getSellerStats,
  updateOrderToPaid,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  downloadInvoice,
  downloadInvoiceQuick,
  getInvoiceStatus
};