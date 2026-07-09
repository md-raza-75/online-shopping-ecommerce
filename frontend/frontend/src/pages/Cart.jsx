import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import { 
  FaShoppingCart, FaTrash, FaPlus, FaMinus, FaArrowRight, 
  FaHome, FaExclamationTriangle, FaRupeeSign, FaTag,
  FaCheck, FaTimes, FaShieldAlt
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
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    loadCartItems();
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) setAppliedCoupon(JSON.parse(savedCoupon));
    
    const handleCartUpdate = () => loadCartItems();
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCartItems = () => setCartItems(getCartFromLocalStorage());

  const removeFromCart = (id, name) => {
    const updatedCart = cartItems.filter(item => item.product !== id);
    setCartItems(updatedCart);
    saveCartToLocalStorage(updatedCart);
    toast.success(`${name} removed from cart`);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = async (id, newQuantity) => {
    setUpdatingItem(id);
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
    if (appliedCoupon) handleRemoveCoupon();
  };

  const calculateSubtotal = () => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const calculateShipping = () => calculateSubtotal() >= 999 ? 0 : 100;
  const calculateTax = () => calculateSubtotal() * 0.18;

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    let discount = 0;
    
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) discount = appliedCoupon.maxDiscount;
    } else {
      discount = appliedCoupon.discountValue;
    }
    return discount;
  };

  const calculateTotal = () => calculateSubtotal() + calculateShipping() + calculateTax() - calculateDiscount();

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCartItems([]);
      clearCartFromLocalStorage();
      toast.info('Cart cleared successfully');
      window.dispatchEvent(new Event('cartUpdated'));
      handleRemoveCoupon();
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError('Please enter a coupon code');
    const subtotal = calculateSubtotal();
    if (subtotal === 0) return setCouponError('Add items to cart before applying coupon');

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
        localStorage.setItem('appliedCoupon', JSON.stringify(couponData));
        toast.success('Coupon applied successfully!');
      } else {
        setCouponError(response.message || 'Invalid coupon code');
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || 'Error applying coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponSuccess('');
    localStorage.removeItem('appliedCoupon');
    toast.info('Coupon removed');
  };

  const checkoutHandler = () => {
    if (cartItems.length === 0) return toast.error('Your cart is empty');
    if (cartItems.some(item => item.quantity > item.stock)) return toast.error('Some items are out of stock.');
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (!userInfo) {
      toast.info('Please login to proceed to checkout');
      return navigate('/login?redirect=/checkout');
    }
    
    if (appliedCoupon && calculateSubtotal() < appliedCoupon.minOrderAmount) {
      return toast.error(`Coupon requires minimum order of ₹${appliedCoupon.minOrderAmount}`);
    }
    
    if (appliedCoupon) localStorage.setItem('checkoutCoupon', JSON.stringify(appliedCoupon));
    navigate('/checkout');
  };

  const getTotalItems = () => cartItems.reduce((total, item) => total + item.quantity, 0);
  const getSavingsAmount = () => (calculateSubtotal() >= 999 ? 100 : 0) + calculateDiscount();

  return (
    <div className="container py-5">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="d-flex flex-wrap justify-content-between align-items-center mb-5"
      >
        <h1 className="h2 fw-bold gradient-text d-flex align-items-center gap-3">
          <FaShoppingCart /> Shopping Cart
        </h1>
        {cartItems.length > 0 && (
          <div className="premium-badge badge-primary px-4 py-2 fs-5 mt-3 mt-md-0">
            {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
          </div>
        )}
      </motion.div>

      {cartItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card text-center py-5 shadow-sm"
        >
          <div className="mb-4">
            <FaShoppingCart size={100} className="text-muted opacity-25" />
          </div>
          <h3 className="fw-bold text-dark mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4 lead mx-auto" style={{ maxWidth: '500px' }}>
            Looks like you haven't added any products to your cart yet. Discover something new!
          </p>
          <Link to="/" className="btn-premium px-5 py-3 d-inline-block text-decoration-none">
            <FaHome className="me-2" /> Continue Shopping
          </Link>
        </motion.div>
      ) : (
        <div className="row g-5">
          <div className="col-lg-8">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel overflow-hidden mb-4"
            >
              <div className="table-responsive">
                <table className="table table-hover table-premium mb-0 align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4 py-4 text-muted fw-bold" style={{ width: '45%' }}>Product</th>
                      <th className="py-4 text-center text-muted fw-bold">Price</th>
                      <th className="py-4 text-center text-muted fw-bold">Quantity</th>
                      <th className="py-4 text-center text-muted fw-bold">Total</th>
                      <th className="pe-4 py-4 text-center text-muted fw-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {cartItems.map((item) => (
                        <motion.tr 
                          key={item.product}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          layout
                        >
                          <td className="ps-4 py-4">
                            <div className="d-flex align-items-center gap-3">
                              <img 
                                src={item.image || 'https://via.placeholder.com/100x100?text=Product'} 
                                alt={item.name}
                                className="rounded shadow-sm"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100x100?text=Product'; }}
                              />
                              <div>
                                <Link to={`/product/${item.product}`} className="text-decoration-none fw-bold text-dark d-block mb-1 fs-6">
                                  {item.name}
                                </Link>
                                <small className={`fw-bold ${item.stock < 10 ? "text-danger" : "text-success"}`}>
                                  {item.stock} available {item.stock < 10 && item.stock > 0 && <span className="ms-1 text-warning"><FaExclamationTriangle /> Low stock</span>}
                                </small>
                                {item.stock === 0 && <span className="premium-badge badge-danger ms-2">Out of stock</span>}
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-4 fw-bold text-muted">
                            <FaRupeeSign className="me-1" size={14} />{item.price.toLocaleString()}
                          </td>
                          <td className="text-center py-4">
                            <div className="d-flex align-items-center justify-content-center bg-light rounded-pill p-1 mx-auto" style={{ width: 'fit-content' }}>
                              <button 
                                className="btn btn-sm btn-light rounded-circle border-0 text-muted"
                                onClick={() => updateQuantity(item.product, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updatingItem === item.product}
                                style={{ width: '32px', height: '32px' }}
                              >
                                {updatingItem === item.product && item.quantity === 1 ? <span className="spinner-border spinner-border-sm"></span> : <FaMinus size={10} />}
                              </button>
                              
                              <input
                                type="number"
                                min="1"
                                max={item.stock}
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product, parseInt(e.target.value) || 1)}
                                className="form-control border-0 bg-transparent text-center fw-bold shadow-none p-0"
                                style={{ width: '40px' }}
                                disabled={updatingItem === item.product}
                              />
                              
                              <button 
                                className="btn btn-sm btn-light rounded-circle border-0 text-muted"
                                onClick={() => updateQuantity(item.product, item.quantity + 1)}
                                disabled={item.quantity >= item.stock || updatingItem === item.product}
                                style={{ width: '32px', height: '32px' }}
                              >
                                {updatingItem === item.product ? <span className="spinner-border spinner-border-sm"></span> : <FaPlus size={10} />}
                              </button>
                            </div>
                          </td>
                          <td className="text-center py-4 fw-bold text-primary">
                            <FaRupeeSign className="me-1" size={14} />{(item.price * item.quantity).toLocaleString()}
                          </td>
                          <td className="text-center pe-4 py-4">
                            <button 
                              className="btn btn-light rounded-circle shadow-sm text-danger d-flex align-items-center justify-content-center mx-auto"
                              onClick={() => removeFromCart(item.product, item.name)}
                              style={{ width: '40px', height: '40px' }}
                              title="Remove item"
                            >
                              <FaTrash size={16} />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </motion.div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <Link to="/" className="btn-premium-outline px-4">
                <FaHome className="me-2" /> Continue Shopping
              </Link>
              <div className="d-flex gap-2">
                <button className="btn btn-light border text-danger fw-bold" onClick={clearCart}>
                  <FaTrash className="me-2" /> Clear Cart
                </button>
                <button className="btn btn-light border text-primary fw-bold" onClick={loadCartItems}>
                  Refresh Cart
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="sticky-top" 
              style={{ top: '20px' }}
            >
              <div className="glass-card p-4">
                <h4 className="fw-bold mb-4 pb-3 border-bottom text-dark">Order Summary</h4>
                
                {appliedCoupon && (
                  <div className="alert alert-success p-3 rounded-4 mb-4 d-flex justify-content-between align-items-center border-0 shadow-sm">
                    <div>
                      <FaTag className="me-2 text-success" />
                      <strong className="text-dark">{appliedCoupon.code}</strong>
                      <small className="ms-2 text-success fw-bold">
                        ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`})
                      </small>
                    </div>
                    <button className="btn btn-link p-0 text-danger" onClick={handleRemoveCoupon}>
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                <div className="d-flex flex-column gap-3 mb-4 text-dark">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted fw-bold">Items ({getTotalItems()})</span>
                    <span className="fw-bold"><FaRupeeSign className="me-1" size={14} />{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  
                  <div className="d-flex justify-content-between">
                    <span className="text-muted fw-bold">Shipping</span>
                    <span className={calculateShipping() === 0 ? "text-success fw-bold" : "fw-bold"}>
                      {calculateShipping() === 0 ? (
                        <>FREE <span className="premium-badge badge-success ms-2">Saved: ₹100</span></>
                      ) : (
                        <><FaRupeeSign className="me-1" size={14} />100</>
                      )}
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between">
                    <span className="text-muted fw-bold">Tax (18% GST)</span>
                    <span className="fw-bold"><FaRupeeSign className="me-1" size={14} />{calculateTax().toFixed(2)}</span>
                  </div>
                  
                  {appliedCoupon && (
                    <div className="d-flex justify-content-between text-success">
                      <span className="fw-bold">Coupon Discount</span>
                      <span className="fw-bold">- <FaRupeeSign className="me-1" size={14} />{calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <hr className="my-4 text-muted opacity-25" />
                
                <div className="d-flex justify-content-between mb-4 align-items-center">
                  <span className="fs-5 fw-bold text-dark">Total</span>
                  <span className="fs-3 fw-bold gradient-text"><FaRupeeSign className="me-1" size={24} />{calculateTotal().toFixed(2)}</span>
                </div>
                
                {getSavingsAmount() > 0 && (
                  <div className="alert alert-info border-0 shadow-sm rounded-4 text-center py-3 mb-4 fw-bold">
                    🎉 Total Savings: ₹{getSavingsAmount().toFixed(2)}
                  </div>
                )}
                
                {calculateSubtotal() < 999 && (
                  <div className="alert alert-warning border-0 shadow-sm rounded-4 text-center py-3 mb-4 fw-bold">
                    <span className="d-block mb-1">🚚 Get FREE shipping!</span>
                    Add ₹<strong className="text-dark">{(999 - calculateSubtotal()).toFixed(2)}</strong> more to save ₹100
                  </div>
                )}

                <button 
                  className="btn-premium-outline w-100 mb-3 py-3"
                  onClick={() => setShowCouponModal(true)}
                >
                  <FaTag className="me-2" /> {appliedCoupon ? 'Change Coupon' : 'Apply Coupon'}
                </button>

                <button 
                  className="btn-premium w-100 py-3 mb-4 shadow-sm fw-bold fs-5"
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout <FaArrowRight className="ms-2" />
                </button>

                <div className="text-center text-muted small p-3 bg-light rounded-4 border">
                  <p className="mb-2 fw-bold d-flex align-items-center justify-content-center gap-2 text-dark">
                    <FaShieldAlt className="text-success" /> 100% Secure Checkout
                  </p>
                  <p className="mb-0">Your payment information is encrypted and secure. By placing your order, you agree to our Terms & Conditions.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      <Modal show={showCouponModal} onHide={() => setShowCouponModal(false)} centered>
        <div className="glass-card border-0 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
            <h4 className="fw-bold m-0 d-flex align-items-center gap-2"><FaTag className="text-primary" /> Apply Coupon</h4>
            <button className="btn btn-light rounded-circle p-2" onClick={() => setShowCouponModal(false)}><FaTimes /></button>
          </div>
          
          <div className="mb-4">
            {couponSuccess && <div className="alert alert-success rounded-3 fw-bold"><FaCheck className="me-2" />{couponSuccess}</div>}
            {couponError && <div className="alert alert-danger rounded-3 fw-bold"><FaTimes className="me-2" />{couponError}</div>}
            
            <label className="fw-bold text-muted mb-2">Enter Coupon Code</label>
            <div className="d-flex gap-2">
              <input
                type="text"
                placeholder="e.g., WELCOME20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={couponLoading}
                className="input-premium flex-grow-1"
              />
              <button 
                className="btn-premium px-4"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? <span className="spinner-border spinner-border-sm"></span> : 'Apply'}
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-light rounded-4 border">
            <h6 className="fw-bold mb-3 text-dark">Available Coupons:</h6>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm border">
                <span className="premium-badge badge-primary px-3 py-2 fs-6">WELCOME20</span>
                <span className="text-muted fw-bold">20% off on min. ₹500</span>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm border">
                <span className="premium-badge badge-primary px-3 py-2 fs-6">SUMMER50</span>
                <span className="text-muted fw-bold">₹50 off on min. ₹300</span>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-white p-3 rounded-3 shadow-sm border">
                <span className="premium-badge badge-primary px-3 py-2 fs-6">FREESHIP</span>
                <span className="text-muted fw-bold">Free shipping on all orders</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Cart;