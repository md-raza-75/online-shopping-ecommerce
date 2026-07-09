import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaUser, FaSignOutAlt, FaHome, FaBox, 
  FaBars, FaStore, FaShoppingBag, FaTag, FaChartLine, FaUsers, FaTimes
} from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadUserInfo();
    loadCartItems();
  }, []);

  // Listen for events and location changes
  useEffect(() => {
    const handleUserChange = () => loadUserInfo();
    const handleCartChange = () => loadCartItems();

    window.addEventListener('userLogin', handleUserChange);
    window.addEventListener('userLogout', handleUserChange);
    window.addEventListener('cartUpdated', handleCartChange);
    
    loadUserInfo();
    loadCartItems();

    return () => {
      window.removeEventListener('userLogin', handleUserChange);
      window.removeEventListener('userLogout', handleUserChange);
      window.removeEventListener('cartUpdated', handleCartChange);
    };
  }, [location.pathname]);

  const loadUserInfo = () => {
    try {
      const userData = localStorage.getItem('userInfo');
      if (!userData || userData === 'undefined' || userData === 'null') {
        setUserInfo(null);
        return;
      }
      setUserInfo(JSON.parse(userData));
    } catch (error) {
      setUserInfo(null);
      localStorage.removeItem('userInfo');
    }
  };

  const loadCartItems = () => {
    try {
      const cartData = localStorage.getItem('cartItems');
      if (!cartData || cartData === 'undefined' || cartData === 'null') {
        setCartCount(0);
        return;
      }
      const cart = JSON.parse(cartData);
      setCartCount(cart.reduce((total, item) => total + (item.quantity || 1), 0));
    } catch (error) {
      setCartCount(0);
      localStorage.removeItem('cartItems');
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('checkoutCoupon');
    setUserInfo(null);
    setCartCount(0);
    window.dispatchEvent(new Event('userLogout'));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="premium-navbar glass-panel sticky-top"
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-brand gradient-text">
          <FaStore className="me-2" /> ShopEasy
        </Link>
        
        {/* Desktop Menu */}
        <div className="navbar-menu d-none d-lg-flex">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <FaHome className="nav-icon" /> Home
          </Link>
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
            <FaShoppingBag className="nav-icon" /> Products
          </Link>
        </div>

        <div className="navbar-actions d-none d-lg-flex">
          <Link to="/cart" className={`nav-link cart-link ${isActive('/cart') ? 'active' : ''}`}>
            <FaShoppingCart className="nav-icon" />
            <span>Cart</span>
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="cart-badge"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </motion.span>
            )}
          </Link>

          {userInfo ? (
            <div 
              className="user-dropdown-container"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <div className="user-trigger">
                <FaUser className="me-2" />
                <span>{userInfo.name?.split(' ')[0]}</span>
                {userInfo.role === 'admin' && <span className="premium-badge badge-danger ms-2">Admin</span>}
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="dropdown-menu-glass"
                  >
                    <div className="dropdown-header">
                      <small>Signed in as</small>
                      <strong>{userInfo.name}</strong>
                      <small className="text-muted">{userInfo.email}</small>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item"><FaUser /> My Profile</Link>
                    <Link to="/orders" className="dropdown-item"><FaBox /> My Orders</Link>
                    
                    {userInfo.role === 'admin' && (
                      <>
                        <div className="dropdown-divider"></div>
                        <div className="dropdown-header premium-text">Admin Panel</div>
                        <Link to="/admin" className="dropdown-item"><FaChartLine /> Dashboard</Link>
                        <Link to="/admin/products" className="dropdown-item"><FaShoppingBag /> Products</Link>
                        <Link to="/admin/orders" className="dropdown-item"><FaBox /> Orders</Link>
                        <Link to="/admin/coupons" className="dropdown-item"><FaTag /> Coupons</Link>
                        <Link to="/admin/users" className="dropdown-item"><FaUsers /> Users</Link>
                      </>
                    )}
                    <div className="dropdown-divider"></div>
                    <button onClick={logoutHandler} className="dropdown-item text-danger w-100 text-start">
                      <FaSignOutAlt /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-premium-outline btn-sm">Login</Link>
              <Link to="/register" className="btn-premium btn-sm">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="mobile-toggle d-lg-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mobile-menu d-lg-none"
          >
            <Link to="/" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
            <Link to="/products" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
            <Link to="/cart" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
              Cart {cartCount > 0 && <span className="mobile-badge">{cartCount}</span>}
            </Link>
            
            {userInfo ? (
              <>
                <div className="mobile-divider"></div>
                <div className="mobile-header">Profile</div>
                <Link to="/profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
                <Link to="/orders" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>My Orders</Link>
                
                {userInfo.role === 'admin' && (
                  <>
                    <div className="mobile-divider"></div>
                    <div className="mobile-header">Admin</div>
                    <Link to="/admin" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/products" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Products</Link>
                    <Link to="/admin/orders" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Orders</Link>
                    <Link to="/admin/coupons" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>Coupons</Link>
                  </>
                )}
                <div className="mobile-divider"></div>
                <button onClick={() => { logoutHandler(); setIsMobileMenuOpen(false); }} className="mobile-link text-danger text-start w-100">
                  Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth p-3">
                <Link to="/login" className="btn-premium-outline w-100 mb-2" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn-premium w-100" onClick={() => setIsMobileMenuOpen(false)}>Register</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;