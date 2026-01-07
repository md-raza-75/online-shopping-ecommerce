import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Badge } from 'react-bootstrap';
import { 
  FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaCheck, 
  FaRupeeSign, FaTag, FaTimes 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createOrder, validateCoupon } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCartFromLocalStorage, clearCartFromLocalStorage } from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  
  const [cartItems, setCartItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // ✅ COUPON STATES
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    const items = getCartFromLocalStorage();
    setCartItems(items);
    
    // Pre-fill user info if available
    if (userInfo) {
      setShippingAddress(prev => ({
        ...prev,
        name: userInfo.name || '',
        phone: userInfo.phone || ''
      }));
    }
    
    // Load applied coupon from localStorage
    const savedCoupon = localStorage.getItem('checkoutCoupon');
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon));
      localStorage.removeItem('checkoutCoupon');
    }
  }, [userInfo]);

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!shippingAddress.name.trim()) newErrors.name = 'Name is required';
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone Number is required';
    
    // Phone number validation (10 digits)
    if (shippingAddress.phone && !/^\d{10}$/.test(shippingAddress.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    // ✅ Check minimum order amount for coupon
    if (appliedCoupon) {
      const subtotal = calculateSubtotal();
      if (subtotal < appliedCoupon.minOrderAmount) {
        newErrors.coupon = `Coupon requires minimum order of ₹${appliedCoupon.minOrderAmount}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    toast.info('Coupon removed');
  };

  const handlePlaceOrder = async () => {
    try {
      // Validate form
      if (!validateForm()) {
        toast.error('Please fill all required fields correctly');
        return;
      }

      // Validate cart
      if (cartItems.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }

      setLoading(true);

      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: shippingAddress.name,
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          country: shippingAddress.country,
          postalCode: shippingAddress.postalCode,
          phone: shippingAddress.phone
        },
        paymentMethod,
        customerNotes: `Order placed by ${userInfo?.name || 'Customer'}`,
        couponCode: appliedCoupon ? appliedCoupon.code : null // ✅ ADD COUPON CODE
      };

      console.log('Order Data:', orderData);

      // Create order
      const { data } = await createOrder(orderData);

      toast.success('Order placed successfully!');
      
      // Clear cart and coupon
      clearCartFromLocalStorage();
      localStorage.removeItem('appliedCoupon');
      localStorage.removeItem('checkoutCoupon');
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Navigate to success page
      navigate(`/order-success/${data._id}`, {
        state: { 
          order: data,
          message: 'Order placed successfully!'
        }
      });

    } catch (error) {
      console.error('Order error:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateShipping = () => {
    return calculateSubtotal() > 999 ? 0 : 50;
  };

  // ✅ COUPON DISCOUNT CALCULATION
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
    return calculateSubtotal() + calculateTax() + calculateShipping() - calculateDiscount();
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          <FaShoppingCart size={48} className="mb-3" />
          <h4>Your cart is empty</h4>
          <p>Add some products to your cart before checkout.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
            Continue Shopping
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">
        <FaShoppingCart className="me-2" />
        Checkout
      </h1>

      <Row>
        {/* Shipping Address */}
        <Col lg={8}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <FaMapMarkerAlt className="me-2" />
              Shipping Address
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          name: e.target.value
                        })}
                        isInvalid={!!errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number *</Form.Label>
                      <Form.Control
                        type="tel"
                        placeholder="Enter 10-digit phone number"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          phone: e.target.value
                        })}
                        isInvalid={!!errors.phone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        We'll contact you for delivery updates
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Address *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Enter complete address"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({
                      ...shippingAddress,
                      address: e.target.value
                    })}
                    isInvalid={!!errors.address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.address}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value
                        })}
                        isInvalid={!!errors.city}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.city}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>State *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value
                        })}
                        isInvalid={!!errors.state}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.state}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Postal Code *</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter postal code"
                        value={shippingAddress.postalCode}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value
                        })}
                        isInvalid={!!errors.postalCode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.postalCode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        type="text"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({
                          ...shippingAddress,
                          country: e.target.value
                        })}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          {/* Payment Method */}
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <FaCreditCard className="me-2" />
              Payment Method
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  id="cod"
                  label="Cash on Delivery (COD)"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-3"
                />
                <Form.Check
                  type="radio"
                  id="razorpay"
                  label="Online Payment (Razorpay)"
                  name="paymentMethod"
                  value="Razorpay"
                  checked={paymentMethod === 'Razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-3"
                />
              </Form>
              
              {paymentMethod === 'COD' && (
                <Alert variant="info" className="mt-3">
                  <FaCheck className="me-2" />
                  Pay when your order is delivered. No online payment required.
                </Alert>
              )}
              
              {paymentMethod === 'Razorpay' && (
                <Alert variant="warning" className="mt-3">
                  You will be redirected to Razorpay payment gateway after order confirmation.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-dark text-white">
              <FaShoppingCart className="me-2" />
              Order Summary
            </Card.Header>
            <Card.Body>
              {/* Coupon Section */}
              {appliedCoupon ? (
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
              ) : (
                <div className="mb-3">
                  <Form.Group>
                    <Form.Label className="small">Have a coupon code?</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Enter coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        size="sm"
                        className="me-2"
                      />
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? '...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <Form.Text className="text-danger small">
                        {couponError}
                      </Form.Text>
                    )}
                    {couponSuccess && (
                      <Form.Text className="text-success small">
                        {couponSuccess}
                      </Form.Text>
                    )}
                  </Form.Group>
                </div>
              )}
              
              {errors.coupon && (
                <Alert variant="danger" className="py-2 mb-3">
                  {errors.coupon}
                </Alert>
              )}
              
              <ListGroup variant="flush">
                {cartItems.map((item, index) => (
                  <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="text-muted small">
                        Qty: {item.quantity} × <FaRupeeSign size={10} />{item.price.toFixed(2)}
                      </div>
                    </div>
                    <span>
                      <FaRupeeSign size={12} />
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </ListGroup.Item>
                ))}
                
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span><FaRupeeSign size={12} />{calculateSubtotal().toFixed(2)}</span>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Tax (18% GST)</span>
                  <span><FaRupeeSign size={12} />{calculateTax().toFixed(2)}</span>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Shipping</span>
                  <span className={calculateShipping() === 0 ? "text-success" : ""}>
                    {calculateShipping() === 0 ? 'FREE' : <><FaRupeeSign size={12} />{calculateShipping().toFixed(2)}</>}
                  </span>
                </ListGroup.Item>
                
                {/* Coupon Discount */}
                {appliedCoupon && (
                  <ListGroup.Item className="d-flex justify-content-between text-success">
                    <span>Coupon Discount</span>
                    <span>-<FaRupeeSign size={12} />{calculateDiscount().toFixed(2)}</span>
                  </ListGroup.Item>
                )}
                
                <ListGroup.Item className="d-flex justify-content-between bg-light">
                  <strong>Total Amount</strong>
                  <strong><FaRupeeSign size={14} />{calculateTotal().toFixed(2)}</strong>
                </ListGroup.Item>
              </ListGroup>
              
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-100"
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaCheck className="me-2" />
                      Place Order
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 mt-2"
                  onClick={() => navigate('/cart')}
                >
                  Back to Cart
                </Button>
              </div>
              
              <div className="mt-3 small text-muted">
                <p className="mb-1">By placing your order, you agree to our:</p>
                <ul className="ps-3 mb-0">
                  <li>Terms & Conditions</li>
                  <li>Privacy Policy</li>
                  <li>Return Policy</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Checkout;