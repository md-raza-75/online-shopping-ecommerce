import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button, Form, Alert, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowRight, FaHome } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getCartFromLocalStorage, saveCartToLocalStorage, clearCartFromLocalStorage } from '../services/api';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load cart from localStorage
    const cart = getCartFromLocalStorage();
    setCartItems(cart);
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      const updatedCart = getCartFromLocalStorage();
      setCartItems(updatedCart);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const removeFromCart = (id) => {
    const updatedCart = cartItems.filter(item => item.product !== id);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    toast.success('Item removed from cart');
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (id, newQuantity) => {
    const updatedCart = cartItems.map(item => {
      if (item.product === id) {
        const validQuantity = Math.max(1, Math.min(item.stock, newQuantity));
        return { ...item, quantity: validQuantity };
      }
      return item;
    });
    
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = subtotal > 0 && subtotal < 999 ? 100 : 0; // Free shipping above ₹999
    const tax = subtotal * 0.18; // 18% GST
    return subtotal + shipping + tax;
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
      clearCartFromLocalStorage();
      toast.info('Cart cleared');
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const checkoutHandler = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
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

  return (
    <Container className="py-5">
      <h1 className="mb-4">
        <FaShoppingCart className="me-2" />
        Shopping Cart
        {cartItems.length > 0 && (
          <Badge bg="primary" className="ms-2">
            {cartItems.reduce((total, item) => total + item.quantity, 0)} items
          </Badge>
        )}
      </h1>

      {cartItems.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body>
            <div className="mb-4">
              <FaShoppingCart size={80} className="text-muted" />
            </div>
            <Card.Title className="h3 mb-3">Your cart is empty</Card.Title>
            <Card.Text className="text-muted mb-4">
              Looks like you haven't added any products to your cart yet.
            </Card.Text>
            <Button variant="primary" size="lg" as={Link} to="/">
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
                        <th className="ps-4">Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th className="pe-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.product}>
                          <td className="ps-4">
                            <div className="d-flex align-items-center">
                              <img 
                                src={item.image || 'https://via.placeholder.com/80x80?text=No+Image'} 
                                alt={item.name}
                                className="rounded me-3"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                              <div>
                                <Link to={`/product/${item.product}`} className="text-decoration-none fw-bold">
                                  {item.name}
                                </Link>
                                <br />
                                <small className="text-muted">
                                  Stock: {item.stock} available
                                </small>
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            <span className="fw-bold">₹{item.price.toLocaleString()}</span>
                          </td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => updateQuantity(item.product, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="px-3"
                              >
                                <FaMinus />
                              </Button>
                              <Form.Control
                                type="number"
                                min="1"
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product, parseInt(e.target.value) || 1)}
                                className="mx-2 text-center"
                                style={{ width: '60px' }}
                              />
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => updateQuantity(item.product, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="px-3"
                              >
                                <FaPlus />
                              </Button>
                            </div>
                          </td>
                          <td className="align-middle">
                            <span className="fw-bold text-primary">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                          </td>
                          <td className="align-middle pe-4">
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              onClick={() => removeFromCart(item.product)}
                              className="rounded-circle"
                              style={{ width: '36px', height: '36px' }}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center">
              <Button variant="outline-primary" as={Link} to="/">
                <FaHome className="me-2" />
                Continue Shopping
              </Button>
              <Button variant="danger" onClick={clearCart}>
                <FaTrash className="me-2" />
                Clear Cart
              </Button>
            </div>
          </Col>

          <Col lg={4}>
            <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body>
                <Card.Title className="h4 mb-4">Order Summary</Card.Title>
                
                <div className="mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span className="fw-bold">₹{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span>Shipping</span>
                    <span className={calculateSubtotal() >= 999 ? "text-success" : ""}>
                      {calculateSubtotal() >= 999 ? 'FREE' : '₹100'}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span>Tax (18% GST)</span>
                    <span>₹{(calculateSubtotal() * 0.18).toFixed(2)}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="d-flex justify-content-between mb-4">
                    <strong className="fs-5">Total</strong>
                    <strong className="fs-5 text-primary">₹{calculateTotal().toFixed(2)}</strong>
                  </div>
                  
                  {calculateSubtotal() < 999 && (
                    <Alert variant="info" className="small">
                      Add ₹{(999 - calculateSubtotal()).toFixed(2)} more for FREE shipping!
                    </Alert>
                  )}
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 py-3 mb-3 fw-bold"
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout <FaArrowRight className="ms-2" />
                </Button>

                <div className="text-center">
                  <small className="text-muted">
                    By placing your order, you agree to our Terms & Conditions
                  </small>
                </div>
              </Card.Body>
            </Card>
            
            {/* Promo Code */}
            <Card className="shadow-sm border-0 mt-4">
              <Card.Body>
                <Card.Title className="h6 mb-3">Have a Promo Code?</Card.Title>
                <Form className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder="Enter promo code"
                    className="me-2"
                  />
                  <Button variant="outline-secondary">Apply</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Cart;