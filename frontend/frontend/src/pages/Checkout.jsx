import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaMapMarkerAlt, FaCreditCard, FaCheck, 
  FaRupeeSign, FaTag, FaTimes, FaShieldAlt, FaLock 
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
  const [shippingAddress, setShippingAddress] = useState({ name: '', address: '', city: '', state: '', country: 'India', postalCode: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    const items = getCartFromLocalStorage();
    setCartItems(items);
    if (userInfo) setShippingAddress(prev => ({ ...prev, name: userInfo.name || '', phone: userInfo.phone || '' }));
    const savedCoupon = localStorage.getItem('checkoutCoupon');
    if (savedCoupon) {
      setAppliedCoupon(JSON.parse(savedCoupon));
      localStorage.removeItem('checkoutCoupon');
    }
  }, [userInfo]);

  const validateForm = () => {
    const newErrors = {};
    if (!shippingAddress.name.trim()) newErrors.name = 'Name is required';
    if (!shippingAddress.address.trim()) newErrors.address = 'Address is required';
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required';
    if (!shippingAddress.state.trim()) newErrors.state = 'State is required';
    if (!shippingAddress.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
    if (!shippingAddress.phone.trim()) newErrors.phone = 'Phone Number is required';
    if (shippingAddress.phone && !/^\d{10}$/.test(shippingAddress.phone)) newErrors.phone = 'Phone number must be 10 digits';
    
    if (appliedCoupon) {
      if (calculateSubtotal() < appliedCoupon.minOrderAmount) {
        newErrors.coupon = `Coupon requires minimum order of ₹${appliedCoupon.minOrderAmount}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return setCouponError('Please enter a coupon code');
    const subtotal = calculateSubtotal();
    if (subtotal === 0) return setCouponError('Add items to cart before applying coupon');

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
      setCouponError(error.response?.data?.message || 'Error applying coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponSuccess('');
    toast.info('Coupon removed');
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return toast.error('Please fill all required fields correctly');
    if (cartItems.length === 0) return navigate('/cart');

    setLoading(true);
    const orderData = {
      items: cartItems.map(item => ({ product: item.product, quantity: item.quantity })),
      shippingAddress: { ...shippingAddress },
      paymentMethod,
      customerNotes: `Order placed by ${userInfo?.name || 'Customer'}`,
      couponCode: appliedCoupon ? appliedCoupon.code : null
    };

    try {
      const { data } = await createOrder(orderData);
      toast.success('Order placed successfully!');
      clearCartFromLocalStorage();
      localStorage.removeItem('appliedCoupon');
      localStorage.removeItem('checkoutCoupon');
      window.dispatchEvent(new Event('cartUpdated'));
      navigate(`/order-success/${data._id}`, { state: { order: data, message: 'Order placed successfully!' } });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculateTax = () => calculateSubtotal() * 0.18;
  const calculateShipping = () => calculateSubtotal() > 999 ? 0 : 100;

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateSubtotal();
    let discount = appliedCoupon.discountType === 'percentage' ? (subtotal * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue;
    if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) discount = appliedCoupon.maxDiscount;
    return discount;
  };

  const calculateTotal = () => calculateSubtotal() + calculateTax() + calculateShipping() - calculateDiscount();

  if (cartItems.length === 0) {
    return (
      <div className="container py-5 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card py-5 shadow-sm max-w-lg mx-auto">
          <FaShoppingCart size={80} className="text-muted opacity-25 mb-4" />
          <h3 className="fw-bold text-dark mb-3">Your cart is empty</h3>
          <p className="text-muted mb-4">Add some products to your cart before checkout.</p>
          <button className="btn-premium px-4 py-2" onClick={() => navigate('/')}>Continue Shopping</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <h1 className="h2 fw-bold gradient-text d-flex align-items-center gap-3">
          <FaLock /> Secure Checkout
        </h1>
        <p className="text-muted mb-0">Complete your order securely</p>
      </motion.div>

      <div className="row g-5">
        <div className="col-lg-7">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="d-flex flex-column gap-4">
            
            {/* Shipping Address */}
            <div className="glass-panel p-4">
              <h4 className="fw-bold mb-4 pb-3 border-bottom d-flex align-items-center gap-2">
                <FaMapMarkerAlt className="text-primary" /> Shipping Address
              </h4>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">Full Name *</label>
                  <input type="text" className={`input-premium ${errors.name ? 'border-danger' : ''}`} value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} placeholder="John Doe" />
                  {errors.name && <small className="text-danger fw-bold">{errors.name}</small>}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">Phone Number *</label>
                  <input type="tel" className={`input-premium ${errors.phone ? 'border-danger' : ''}`} value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} placeholder="10-digit number" />
                  {errors.phone && <small className="text-danger fw-bold">{errors.phone}</small>}
                </div>
                <div className="col-12">
                  <label className="fw-bold text-muted mb-2">Complete Address *</label>
                  <textarea rows="3" className={`input-premium ${errors.address ? 'border-danger' : ''}`} value={shippingAddress.address} onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })} placeholder="House/Flat No., Street Name, Area" />
                  {errors.address && <small className="text-danger fw-bold">{errors.address}</small>}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">City *</label>
                  <input type="text" className={`input-premium ${errors.city ? 'border-danger' : ''}`} value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} placeholder="e.g. Mumbai" />
                  {errors.city && <small className="text-danger fw-bold">{errors.city}</small>}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">State *</label>
                  <input type="text" className={`input-premium ${errors.state ? 'border-danger' : ''}`} value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} placeholder="e.g. Maharashtra" />
                  {errors.state && <small className="text-danger fw-bold">{errors.state}</small>}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">Postal Code *</label>
                  <input type="text" className={`input-premium ${errors.postalCode ? 'border-danger' : ''}`} value={shippingAddress.postalCode} onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })} placeholder="e.g. 400001" />
                  {errors.postalCode && <small className="text-danger fw-bold">{errors.postalCode}</small>}
                </div>
                <div className="col-md-6">
                  <label className="fw-bold text-muted mb-2">Country</label>
                  <input type="text" className="input-premium bg-light" value={shippingAddress.country} readOnly />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-panel p-4">
              <h4 className="fw-bold mb-4 pb-3 border-bottom d-flex align-items-center gap-2">
                <FaCreditCard className="text-primary" /> Payment Method
              </h4>
              <div className="d-flex flex-column gap-3">
                <label className={`glass-card p-3 d-flex align-items-center gap-3 cursor-pointer ${paymentMethod === 'COD' ? 'border-primary shadow' : ''}`}>
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                  <div>
                    <h6 className="fw-bold m-0 text-dark">Cash on Delivery (COD)</h6>
                    <small className="text-muted">Pay when your order is delivered</small>
                  </div>
                </label>
                <label className={`glass-card p-3 d-flex align-items-center gap-3 cursor-pointer ${paymentMethod === 'Razorpay' ? 'border-primary shadow' : ''}`}>
                  <input type="radio" name="payment" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '20px', height: '20px' }} />
                  <div>
                    <h6 className="fw-bold m-0 text-dark">Online Payment (Razorpay)</h6>
                    <small className="text-muted">Pay securely with Credit/Debit Card, UPI, or Netbanking</small>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-5">
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="sticky-top" style={{ top: '20px' }}>
            <div className="glass-card p-4">
              <h4 className="fw-bold mb-4 pb-3 border-bottom text-dark">Order Summary</h4>
              
              {/* Items List */}
              <div className="d-flex flex-column gap-3 mb-4 max-h-64 overflow-auto">
                {cartItems.map((item, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div className="position-relative">
                        <img src={item.image} alt={item.name} className="rounded object-fit-cover shadow-sm" style={{ width: '50px', height: '50px' }} />
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary">{item.quantity}</span>
                      </div>
                      <div className="text-truncate" style={{ maxWidth: '150px' }}>
                        <span className="fw-bold d-block text-dark text-truncate">{item.name}</span>
                        <small className="text-muted"><FaRupeeSign size={10} />{item.price.toFixed(2)} each</small>
                      </div>
                    </div>
                    <span className="fw-bold"><FaRupeeSign size={12} />{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className="bg-light p-3 rounded-4 border mb-4">
                {appliedCoupon ? (
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <FaTag className="me-2 text-success" />
                      <strong className="text-dark">{appliedCoupon.code}</strong>
                      <small className="ms-2 text-success fw-bold">({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`})</small>
                    </div>
                    <button className="btn btn-link p-0 text-danger" onClick={handleRemoveCoupon}><FaTimes /></button>
                  </div>
                ) : (
                  <div>
                    <label className="fw-bold text-muted mb-2 small">Have a coupon code?</label>
                    <div className="d-flex gap-2">
                      <input type="text" placeholder="Enter coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="form-control shadow-none rounded-3 border" />
                      <button className="btn-premium px-3 py-2" onClick={handleApplyCoupon} disabled={couponLoading}>{couponLoading ? '...' : 'Apply'}</button>
                    </div>
                    {couponError && <small className="text-danger fw-bold d-block mt-1">{couponError}</small>}
                    {couponSuccess && <small className="text-success fw-bold d-block mt-1">{couponSuccess}</small>}
                  </div>
                )}
                {errors.coupon && <small className="text-danger fw-bold d-block mt-2">{errors.coupon}</small>}
              </div>

              {/* Totals */}
              <div className="d-flex flex-column gap-3 mb-4 text-dark">
                <div className="d-flex justify-content-between">
                  <span className="text-muted fw-bold">Subtotal</span>
                  <span className="fw-bold"><FaRupeeSign className="me-1" size={14} />{calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted fw-bold">Tax (18% GST)</span>
                  <span className="fw-bold"><FaRupeeSign className="me-1" size={14} />{calculateTax().toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted fw-bold">Shipping</span>
                  <span className={calculateShipping() === 0 ? "text-success fw-bold" : "fw-bold"}>
                    {calculateShipping() === 0 ? 'FREE' : <><FaRupeeSign className="me-1" size={14} />100</>}
                  </span>
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

              <button 
                className="btn-premium w-100 py-3 mb-3 fw-bold shadow-lg"
                onClick={handlePlaceOrder}
                disabled={loading || cartItems.length === 0}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <FaCheck className="me-2" />}
                {loading ? 'Processing...' : `Pay ₹${calculateTotal().toFixed(2)}`}
              </button>

              <button className="btn btn-light w-100 border fw-bold text-muted py-2 mb-4" onClick={() => navigate('/cart')}>Back to Cart</button>

              <div className="text-center small text-muted d-flex align-items-center justify-content-center gap-2 bg-light p-3 rounded-4 border">
                <FaShieldAlt className="text-success fs-5" /> 
                <span className="fw-bold">256-bit SSL Encrypted Secure Checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;