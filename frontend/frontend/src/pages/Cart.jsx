import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowRight, FaHome, FaExclamationTriangle, FaRupeeSign } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getCartFromLocalStorage, saveCartToLocalStorage, clearCartFromLocalStorage } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);

  useEffect(() => {
    loadCartItems();
    
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
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 999 ? 0 : 100;
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.18;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart? All items will be removed.')) {
      setCartItems([]);
      clearCartFromLocalStorage();
      toast.info('Cart cleared successfully');
      window.dispatchEvent(new Event('cartUpdated'));
    }
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
    
    navigate('/checkout');
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getSavingsAmount = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 999 ? 100 : 0;
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
                  
                  {/* Savings */}
                  {getSavingsAmount() > 0 && (
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Shipping Savings</span>
                      <span className="text-success fw-bold">
                        - <FaRupeeSign className="me-1" size={12} />
                        {getSavingsAmount()}
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
                  
                  {/* Free Shipping Alert */}
                  {calculateSubtotal() < 999 && (
                    <Alert variant="info" className="small text-center py-2 mb-4">
                      <strong>Get FREE shipping!</strong><br />
                      Add ₹<strong>{(999 - calculateSubtotal()).toFixed(2)}</strong> more to save ₹100
                    </Alert>
                  )}
                </div>

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
            
            {/* Promo Code Section */}
            <Card className="shadow-sm border-0 mt-4">
              <Card.Body>
                <Card.Title className="h6 mb-3">Apply Promo Code</Card.Title>
                <Form className="d-flex mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Enter promo code"
                    className="me-2"
                  />
                  <Button variant="outline-primary">Apply</Button>
                </Form>
                <small className="text-muted">
                  Available: SUMMER10 (10% off), FREESHIP (Free shipping)
                </small>
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
    </Container>
  );
};

export default Cart;