import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Table, Button, Form, Alert, 
  Badge, Spinner, Modal, InputGroup 
} from 'react-bootstrap';
import { 
  FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowRight, 
  FaHome, FaExclamationTriangle, FaRupeeSign, FaTag,
  FaCheck, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  getCartFromLocalStorage, saveCartToLocalStorage, 
  clearCartFromLocalStorage, validateCoupon 
} from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  
  // ✅ COUPON STATES
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    loadCartItems();
    
    // Load applied coupon from localStorage
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon));
    }
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      loadCartItems();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCartItems = () => {
    const cart = getCartFromLocalStorage();
    setCartItems(cart);
  };

  const removeFromCart = (id, name) => {
    const updatedCart = cartItems.filter(item => item.product !== id);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    toast.success(`${name} removed from cart`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = async (id, newQuantity) => {
    setUpdatingItem(id);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const updatedCart = cartItems.map(item => {
      if (item.product === id) {
        const validQuantity = Math.max(1, Math.min(item.stock, newQuantity));
        
        if (validQuantity > item.stock) {
          toast.error(`Only ${item.stock} items available in stock`);
          return item;
        }
        
        return { ...item, quantity: validQuantity };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
    setUpdatingItem(null);
    
    // Clear coupon if quantity changes
    if (appliedCoupon) {
      handleRemoveCoupon();
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 999 ? 0 : 100;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.18;
  };

  // ✅ COUPON CALCULATION
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = calculateSubtotal();
    let discount = 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      
      // Apply max discount limit if set
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      // Fixed amount discount
      discount = appliedCoupon.discountValue;
    }
    
    return discount;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const tax = calculateTax();
    const discount = calculateDiscount();
    
    return subtotal + shipping + tax - discount;
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart? All items will be removed.')) {
      setCartItems([]);
      clearCartFromLocalStorage();
      toast.info('Cart cleared successfully');
      window.dispatchEvent(new Event('cartUpdated'));
      handleRemoveCoupon();
    }
  };

  // ✅ APPLY COUPON FUNCTION
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const subtotal = calculateSubtotal();
    
    if (subtotal === 0) {
      setCouponError('Add items to cart before applying coupon');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      
      if (!userInfo) {
        setCouponError('Please login to apply coupon');
        setCouponLoading(false);
        return;
      }

      const response = await validateCoupon(couponCode, subtotal);
      
      if (response.success) {
        const couponData = {
          code: response.data.coupon.code,
          discountType: response.data.coupon.discountType,
          discountValue: response.data.coupon.discountValue,
          maxDiscount: response.data.coupon.maxDiscount,
          discount: response.data.discount,
          minOrderAmount: response.data.coupon.minOrderAmount
        };
        
        setAppliedCoupon(couponData);
        setCouponSuccess(`Coupon applied! You saved ₹${response.data.discount}`);
        setCouponCode('');
        setShowCouponModal(false);
        
        // Save to localStorage
        localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
        
        toast.success('Coupon applied successfully!');
      } else {
        setCouponError(response.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Apply coupon error:', error);
      setCouponError(error.response?.data?.message || 'Error applying coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // ✅ REMOVE COUPON FUNCTION
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponSuccess('');
    localStorage.removeItem('appliedCoupon');
    toast.info('Coupon removed');
  };

  const checkoutHandler = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Check stock availability
    const outOfStockItems = cartItems.filter(item => item.quantity > item.stock);
    if (outOfStockItems.length > 0) {
      toast.error(`Some items are out of stock. Please update quantities.`);
      return;
    }
    
    // Check if user is logged in
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (!userInfo) {
      toast.info('Please login to proceed to checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
    
    // Check minimum order amount for coupon
    if (appliedCoupon) {
      const subtotal = calculateSubtotal();
      if (subtotal < appliedCoupon.minOrderAmount) {
        toast.error(`Coupon requires minimum order of ₹${appliedCoupon.minOrderAmount}`);
        return;
      }
    }
    
    // Save coupon to pass to checkout
    if (appliedCoupon) {
      localStorage.setItem('checkoutCoupon', JSON.stringify(appliedCoupon));
    }
    
    navigate('/checkout');
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getSavingsAmount = () => {
    const subtotal = calculateSubtotal();
    const shippingSavings = subtotal >= 999 ? 100 : 0;
    const couponSavings = calculateDiscount();
    return shippingSavings + couponSavings;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading your cart...</p>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 fw-bold">
          <FaShoppingCart className="me-2" />
          Shopping Cart
        </h1>
        {cartItems.length > 0 && (
          <Badge bg="primary" pill className="px-3 py-2">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
          </Badge>
        )}
      </div>

      {cartItems.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body className="py-5">
            <div className="mb-4">
              <FaShoppingCart size={100} className="text-muted opacity-25" />
            </div>
            <Card.Title className="h3 mb-3 text-muted">Your cart is empty</Card.Title>
            <Card.Text className="text-muted mb-4">
              Looks like you haven't added any products to your cart yet.
            </Card.Text>
            <Button variant="primary" size="lg" as={Link} to="/" className="px-4">
              <FaHome className="me-2" />
              Continue Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="ps-4 py-3" style={{ width: '45%' }}>Product</th>
                        <th className="py-3 text-center">Price</th>
                        <th className="py-3 text-center">Quantity</th>
                        <th className="py-3 text-center">Total</th>
                        <th className="pe-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.product} className="align-middle">
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.image || 'https://via.placeholder.com/100x100?text=Product'} 
                                alt={item.name}
                                className="rounded me-3 border"
                                style={{ 
                                  width: '80px', 
                                  height: '80px', 
                                  objectFit: 'cover' 
                                }}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Product';
                                }}
                              />
                              <div>
                                <Link 
                                  to={`/product/${item.product}`} 
                                  className="text-decoration-none fw-bold text-dark"
                                >
                                  {item.name}
                                </Link>
                                <div className="mt-1">
                                  <small className="text-muted">
                                    Stock: <span className={item.stock < 10 ? "text-danger fw-bold" : "text-success"}>
                                      {item.stock} available
                                    </span>
                                  </small>
                                  {item.stock < 10 && item.stock > 0 && (
                                    <small className="ms-2 text-warning">
                                      <FaExclamationTriangle className="me-1" />
                                      Low stock
                                    </small>
                                  )}
                                  {item.stock === 0 && (
                                    <Badge bg="danger" className="ms-2">
                                      Out of stock
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center align-middle">
                            <div className="fw-bold">
                              <FaRupeeSign className="me-1" size={12} />
                              {item.price.toLocaleString()}
                            </div>
                          </td>
                          <td className="text-center align-middle">
                            <div className="d-flex align-items-center justify-content-center">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => updateQuantity(item.product, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingItem === item.product}
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px' }}
                              >
                                {updatingItem === item.product && item.quantity === 1 ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaMinus size={12} />
                                )}
                              </Button>
                              
                              <Form.Control
                                type="number"
                                min="1"
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  updateQuantity(item.product, value);
                                }}
                                className="mx-2 text-center"
                                style={{ width: '70px' }}
                                disabled={updatingItem === item.product}
                              />
                              
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => updateQuantity(item.product, item.quantity + 1)}
                                disabled={item.quantity >= item.stock || updatingItem === item.product}
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '32px', height: '32px' }}
                              >
                                {updatingItem === item.product ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <FaPlus size={12} />
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="text-center align-middle">
                            <div className="fw-bold text-primary">
                              <FaRupeeSign className="me-1" size={12} />
                              {(item.price * item.quantity).toLocaleString()}
                            </div>
                          </td>
                          <td className="text-center pe-4 align-middle">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeFromCart(item.product, item.name)}
                              className="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: '36px', height: '36px' }}
                              title="Remove item"
                            >
                              <FaTrash size={14} />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button variant="outline-primary" as={Link} to="/" className="px-4">
                <FaHome className="me-2" />
                Continue Shopping
              </Button>
              
              <div>
                <Button 
                  variant="outline-danger" 
                  onClick={clearCart}
                  className="me-2"
                >
                  <FaTrash className="me-2" />
                  Clear Cart
                </Button>
                
                <Button 
                  variant="outline-secondary" 
                  onClick={loadCartItems}
                >
                  Refresh Cart
                </Button>
              </div>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <Card.Title className="h4 mb-4 border-bottom pb-3">
                  Order Summary
                </Card.Title>
                
                <div className="mb-4">
                  {/* Applied Coupon */}
                  {appliedCoupon && (
                    <Alert variant="success" className="p-2 mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <FaTag className="me-2" />
                          <strong>{appliedCoupon.code}</strong>
                          <small className="ms-2">
                            ({appliedCoupon.discountType === 'percentage' 
                              ? `${appliedCoupon.discountValue}%` 
                              : `₹${appliedCoupon.discountValue}`})
                          </small>
                        </div>
                        <Button 
                          variant="link" 
                          className="p-0 text-danger"
                          onClick={handleRemoveCoupon}
                          title="Remove coupon"
                        >
                          <FaTimes />
                        </Button>
                      </div>
                    </Alert>
                  )}
                  
                  {/* Items Count */}
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Items ({getTotalItems()})</span>
                    <span className="fw-bold">
                      <FaRupeeSign className="me-1" size={12} />
                      {calculateSubtotal().toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Shipping */}
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Shipping</span>
                    <span className={calculateShipping() === 0 ? "text-success fw-bold" : ""}>
                      {calculateShipping() === 0 ? (
                        <>
                          FREE
                          <Badge bg="success" className="ms-2">Saved: ₹100</Badge>
                        </>
                      ) : (
                        <>
                          <FaRupeeSign className="me-1" size={12} />
                          100
                        </>
                      )}
                    </span>
                  </div>
                  
                  {/* Tax */}
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">Tax (18% GST)</span>
                    <span>
                      <FaRupeeSign className="me-1" size={12} />
                      {calculateTax().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Coupon Discount */}
                  {appliedCoupon && (
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Coupon Discount</span>
                      <span className="text-success fw-bold">
                        - <FaRupeeSign className="me-1" size={12} />
                        {calculateDiscount().toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <hr className="my-3" />
                  
                  {/* Total */}
                  <div className="d-flex justify-content-between mb-4">
                    <span className="h5 mb-0 fw-bold">Total Amount</span>
                    <span className="h4 mb-0 text-primary fw-bold">
                      <FaRupeeSign className="me-1" size={16} />
                      {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Total Savings */}
                  {getSavingsAmount() > 0 && (
                    <Alert variant="info" className="small text-center py-2 mb-4">
                      <strong>Total Savings: ₹{getSavingsAmount().toFixed(2)}</strong>
                    </Alert>
                  )}
                  
                  {/* Free Shipping Alert */}
                  {calculateSubtotal() < 999 && (
                    <Alert variant="info" className="small text-center py-2 mb-4">
                      <strong>Get FREE shipping!</strong><br />
                      Add ₹<strong>{(999 - calculateSubtotal()).toFixed(2)}</strong> more to save ₹100
                    </Alert>
                  )}
                </div>

                {/* Apply Coupon Button */}
                <Button 
                  variant="outline-primary" 
                  className="w-100 mb-3"
                  onClick={() => setShowCouponModal(true)}
                >
                  <FaTag className="me-2" />
                  {appliedCoupon ? 'Change Coupon' : 'Apply Coupon'}
                </Button>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 py-3 mb-3 fw-bold shadow-sm"
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                >
                  <FaArrowRight className="me-2" />
                  Proceed to Checkout
                </Button>

                <div className="text-center small text-muted">
                  <p className="mb-1">
                    <FaExclamationTriangle className="me-1" />
                    Secure checkout with SSL encryption
                  </p>
                  <p className="mb-0">
                    By placing your order, you agree to our Terms & Conditions
                  </p>
                </div>
              </Card.Body>
            </Card>
            
            {/* Security Info */}
            <Card className="shadow-sm border-0 mt-4 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center">
                  <div className="bg-white rounded-circle p-2 me-3">
                    <FaExclamationTriangle className="text-primary" />
                  </div>
                  <div>
                    <p className="small mb-0">
                      <strong>100% Secure Checkout</strong><br />
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Coupon Modal */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTag className="me-2" />
            Apply Coupon Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {couponSuccess && (
            <Alert variant="success" className="py-2">
              <FaCheck className="me-2" />
              {couponSuccess}
            </Alert>
          )}
          
          {couponError && (
            <Alert variant="danger" className="py-2">
              <FaTimes className="me-2" />
              {couponError}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Enter Coupon Code</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="e.g., WELCOME20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponLoading}
              />
              <Button 
                variant="primary"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  'Apply'
                )}
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Enter your coupon code and click apply
            </Form.Text>
          </Form.Group>
          
          <div className="mt-4">
            <h6>Available Coupons:</h6>
            <div className="small">
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold">WELCOME20</span>
                <span>20% off on min. ₹500</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="fw-bold">SUMMER50</span>
                <span>₹50 off on min. ₹300</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="fw-bold">FREESHIP</span>
                <span>Free shipping on all orders</span>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCouponModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Cart;