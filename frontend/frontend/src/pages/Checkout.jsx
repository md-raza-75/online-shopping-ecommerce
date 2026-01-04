import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup, Modal, Badge } from 'react-bootstrap';
import { FaCreditCard, FaMoneyBill, FaLock, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { createOrder, getCartFromLocalStorage, clearCartFromLocalStorage } from '../services/api';

const Checkout = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    address: '',
    city: '',
    postalCode: '',
    country: 'India'
  });

  const [cartItems, setCartItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/login?redirect=/checkout');
      return;
    }
    
    setUserInfo(user);
    
    // Load cart items
    const cart = getCartFromLocalStorage();
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }
    
    setCartItems(cart);
  }, [navigate]);

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = subtotal > 0 && subtotal < 999 ? 100 : 0;
    const tax = subtotal * 0.18;
    return subtotal + shipping + tax;
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!shippingAddress.address.trim() || !shippingAddress.city.trim() || !shippingAddress.postalCode.trim()) {
      setError('Please fill all address fields');
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    if (!userInfo) {
      setError('Please login to place order');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item.product,
          quantity: item.quantity
        })),
        shippingAddress,
        paymentMethod,
        totalAmount: calculateTotal()
      };

      const response = await createOrder(orderData);
      
      // Clear cart
      clearCartFromLocalStorage();
      window.dispatchEvent(new Event('cartUpdated'));
      
      // Save order ID for success modal
      setOrderId(response.data?._id || `ORD-${Date.now()}`);
      setShowSuccessModal(true);
      
      toast.success('Order placed successfully!');
      
    } catch (err) {
      console.error('Order error:', err);
      setError(typeof err === 'string' ? err : 'Failed to place order. Please try again.');
      toast.error('Order failed!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4 fw-bold">Checkout</h1>

      {/* Progress Steps */}
      <Row className="mb-5">
        <Col>
          <div className="d-flex justify-content-between align-items-center position-relative">
            {/* Progress Line */}
            <div 
              className="position-absolute top-50 start-0 end-0 bg-light" 
              style={{ height: '2px', zIndex: 1 }}
            ></div>
            <div 
              className="position-absolute top-50 start-0 bg-primary" 
              style={{ 
                height: '2px', 
                width: `${(step - 1) * 50}%`, 
                zIndex: 2,
                transition: 'width 0.3s ease'
              }}
            ></div>
            
            {[1, 2, 3].map((stepNumber) => (
              <div 
                key={stepNumber} 
                className={`d-flex flex-column align-items-center position-relative ${step >= stepNumber ? 'text-primary' : 'text-muted'}`}
                style={{ zIndex: 3 }}
              >
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center ${step >= stepNumber ? 'bg-primary text-white' : 'bg-light'}`}
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    border: '3px solid',
                    borderColor: step >= stepNumber ? 'var(--bs-primary)' : '#dee2e6'
                  }}
                >
                  {step > stepNumber ? (
                    <FaCheckCircle size={20} />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="mt-2 fw-medium">
                  {stepNumber === 1 && 'Address'}
                  {stepNumber === 2 && 'Payment'}
                  {stepNumber === 3 && 'Confirm'}
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {step === 1 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Card.Title className="h4 mb-4">Shipping Address</Card.Title>
                <Form onSubmit={handleAddressSubmit}>
                  {userInfo && (
                    <Alert variant="info" className="mb-4">
                      Shipping to: <strong>{userInfo.name}</strong> ({userInfo.email})
                    </Alert>
                  )}

                  <Form.Group className="mb-3" controlId="address">
                    <Form.Label>Full Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter your complete address with landmark"
                      value={shippingAddress.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      required
                      className="py-2"
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="city">
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter city"
                          value={shippingAddress.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="postalCode">
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter postal code"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4" controlId="country">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      value="India"
                      readOnly
                      className="py-2 bg-light"
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => navigate('/cart')}>
                      <FaArrowLeft className="me-2" />
                      Back to Cart
                    </Button>
                    <Button variant="primary" type="submit" className="px-4">
                      Continue to Payment
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {step === 2 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <Card.Title className="h4 mb-4">Payment Method</Card.Title>
                
                <Form.Group className="mb-4">
                  <div className="mb-3">
                    <Form.Check
                      type="radio"
                      id="cod"
                      label={
                        <div className="d-flex align-items-center">
                          <div className="bg-success rounded-circle p-2 me-3">
                            <FaMoneyBill className="text-white" />
                          </div>
                          <div>
                            <h6 className="mb-1">Cash on Delivery (COD)</h6>
                            <p className="text-muted mb-0 small">
                              Pay when you receive your order
                            </p>
                          </div>
                        </div>
                      }
                      name="paymentMethod"
                      value="COD"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="p-3 border rounded"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <Form.Check
                      type="radio"
                      id="razorpay"
                      label={
                        <div className="d-flex align-items-center">
                          <div className="bg-primary rounded-circle p-2 me-3">
                            <FaCreditCard className="text-white" />
                          </div>
                          <div>
                            <h6 className="mb-1">Razorpay</h6>
                            <p className="text-muted mb-0 small">
                              Pay securely with Credit/Debit Card, UPI, NetBanking
                            </p>
                          </div>
                        </div>
                      }
                      name="paymentMethod"
                      value="Razorpay"
                      checked={paymentMethod === 'Razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="p-3 border rounded"
                    />
                  </div>
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button variant="outline-secondary" onClick={() => setStep(1)}>
                    <FaArrowLeft className="me-2" />
                    Back to Address
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handlePlaceOrder}
                    disabled={loading || cartItems.length === 0}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <FaLock className="ms-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Order Summary */}
        <Col lg={4}>
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Body>
              <Card.Title className="h4 mb-4">Order Summary</Card.Title>
              
              <ListGroup variant="flush" className="mb-3">
                {cartItems.map((item) => (
                  <ListGroup.Item key={item.product} className="d-flex justify-content-between py-3">
                    <div className="d-flex">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="rounded me-3"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div>
                        <div className="fw-medium">{item.name}</div>
                        <small className="text-muted">Qty: {item.quantity}</small>
                      </div>
                    </div>
                    <div className="fw-bold">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </ListGroup.Item>
                ))}
                
                <ListGroup.Item className="d-flex justify-content-between py-2">
                  <div>Subtotal</div>
                  <div>₹{calculateSubtotal().toLocaleString()}</div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between py-2">
                  <div>Shipping</div>
                  <div className={calculateSubtotal() >= 999 ? "text-success fw-bold" : ""}>
                    {calculateSubtotal() >= 999 ? 'FREE' : '₹100'}
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between py-2">
                  <div>Tax (18% GST)</div>
                  <div>₹{(calculateSubtotal() * 0.18).toFixed(2)}</div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex justify-content-between py-3 bg-light">
                  <div className="h5 mb-0">Total</div>
                  <div className="h5 mb-0 text-primary">₹{calculateTotal().toFixed(2)}</div>
                </ListGroup.Item>
              </ListGroup>

              <div className="text-center small">
                <p className="text-muted">
                  <FaLock className="me-1" />
                  Secure payment. Your information is protected.
                </p>
              </div>
            </Card.Body>
          </Card>
          
          {/* Need Help */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Body>
              <h6 className="mb-3">Need Help?</h6>
              <p className="small text-muted mb-2">
                Call us: <strong>1800-123-4567</strong>
              </p>
              <p className="small text-muted">
                Email: <strong>support@shopeasy.com</strong>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => navigate('/orders')} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="text-success">Order Successful!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <div className="mb-4">
            <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                 style={{ width: '80px', height: '80px' }}>
              <FaCheckCircle size={40} className="text-white" />
            </div>
            <h4 className="mb-3">Thank you for your order!</h4>
            <p className="text-muted mb-4">
              Your order has been placed successfully. You will receive a confirmation email shortly.
            </p>
            <div className="bg-light p-3 rounded mb-4">
              <p className="mb-1 small text-muted">Order ID</p>
              <p className="h5 mb-0">{orderId}</p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="primary" onClick={() => navigate('/orders')} className="px-4">
            View My Orders
          </Button>
          <Button variant="outline-primary" onClick={() => navigate('/')} className="px-4">
            Continue Shopping
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Checkout;