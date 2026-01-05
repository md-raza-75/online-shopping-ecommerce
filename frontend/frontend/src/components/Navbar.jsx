import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, NavDropdown, Badge, Button } from 'react-bootstrap';
import { 
  FaShoppingCart, 
  FaUser, 
  FaSignOutAlt, 
  FaHome, 
  FaBox, 
  FaUserShield,
  FaBars,
  FaStore,
  FaShoppingBag
} from 'react-icons/fa';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load initial data
  useEffect(() => {
    loadUserInfo();
    loadCartItems();
  }, []);

  // Listen for events and location changes
  useEffect(() => {
    const handleUserChange = () => {
      loadUserInfo();
    };

    const handleCartChange = () => {
      loadCartItems();
    };

    // Add event listeners
    window.addEventListener('userLogin', handleUserChange);
    window.addEventListener('userLogout', handleUserChange);
    window.addEventListener('cartUpdated', handleCartChange);
    
    // Also refresh on route change
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
      // ✅ FIX: Check if localStorage item exists
      const userData = localStorage.getItem('userInfo');
      
      if (!userData || userData === 'undefined' || userData === 'null') {
        setUserInfo(null);
        return;
      }
      
      const user = JSON.parse(userData);
      console.log('Navbar - Loaded user:', user);
      setUserInfo(user);
    } catch (error) {
      console.error('Error loading user info:', error);
      setUserInfo(null);
      
      // Clear invalid data
      localStorage.removeItem('userInfo');
    }
  };

  const loadCartItems = () => {
    try {
      // ✅ FIX: Check if localStorage item exists
      const cartData = localStorage.getItem('cartItems');
      
      if (!cartData || cartData === 'undefined' || cartData === 'null') {
        setCartItems([]);
        setCartCount(0);
        return;
      }
      
      const cart = JSON.parse(cartData);
      setCartItems(cart);
      
      // Calculate cart count
      const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart items:', error);
      setCartItems([]);
      setCartCount(0);
      
      // Clear invalid data
      localStorage.removeItem('cartItems');
    }
  };

  const logoutHandler = () => {
    // Clear local storage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cartItems');
    
    // Reset state
    setUserInfo(null);
    setCartItems([]);
    setCartCount(0);
    
    // Dispatch events
    window.dispatchEvent(new Event('userLogout'));
    window.dispatchEvent(new Event('cartUpdated'));
    
    // Navigate to login
    navigate('/login');
  };

  // Check if current route is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="shadow-sm py-3 sticky-top">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold fs-3">
          <FaStore className="me-2" />
          ShopEasy
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="navbar-nav">
          <FaBars />
        </BootstrapNavbar.Toggle>
        
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`mx-2 ${isActive('/') ? 'active fw-bold' : ''}`}
            >
              <FaHome className="me-1" />
              Home
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/products" 
              className={`mx-2 ${isActive('/products') ? 'active fw-bold' : ''}`}
            >
              <FaShoppingBag className="me-1" />
              Products
            </Nav.Link>
          </Nav>
          
          <Nav className="ms-auto align-items-center">
            {/* Cart with Badge */}
            <Nav.Link 
              as={Link} 
              to="/cart" 
              className={`position-relative mx-3 ${isActive('/cart') ? 'active fw-bold' : ''}`}
            >
              <FaShoppingCart className="fs-5" />
              {cartCount > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ 
                    fontSize: '0.7rem',
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
              <span className="ms-2 d-none d-lg-inline">Cart</span>
            </Nav.Link>
            
            {/* User Authentication */}
            {userInfo ? (
              <>
                {/* Welcome message for large screens */}
                <div className="d-none d-lg-block text-white mx-3">
                  Welcome, <strong>{userInfo.name?.split(' ')[0]}</strong>
                  {userInfo.role === 'admin' && (
                    <Badge bg="danger" className="ms-2" pill>Admin</Badge>
                  )}
                </div>
                
                {/* User Dropdown */}
                <NavDropdown 
                  title={
                    <span className="d-flex align-items-center">
                      <FaUser className="me-2" />
                      <span className="d-lg-none">
                        {userInfo.name?.split(' ')[0]}
                        {userInfo.role === 'admin' && (
                          <Badge bg="danger" className="ms-2" pill>A</Badge>
                        )}
                      </span>
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                  className="mx-2"
                >
                  {/* User Info */}
                  <div className="px-3 py-2 border-bottom">
                    <small className="text-muted d-block">Signed in as</small>
                    <div className="fw-bold">{userInfo.name}</div>
                    <small className="text-muted">{userInfo.email}</small>
                    {userInfo.role === 'admin' && (
                      <Badge bg="danger" className="mt-1">Administrator</Badge>
                    )}
                  </div>
                  
                  {/* User Links */}
                  <NavDropdown.Item as={Link} to="/profile" className="py-2">
                    <FaUser className="me-2" /> My Profile
                  </NavDropdown.Item>
                  
                  <NavDropdown.Item as={Link} to="/orders" className="py-2">
                    <FaBox className="me-2" /> My Orders
                  </NavDropdown.Item>
                  
                  {/* Admin Links */}
                  {userInfo.role === 'admin' && (
                    <>
                      <NavDropdown.Divider />
                      <NavDropdown.Header className="fw-bold text-primary">
                        Admin Panel
                      </NavDropdown.Header>
                      <NavDropdown.Item as={Link} to="/admin" className="py-2">
                        <FaUserShield className="me-2" /> Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/products" className="py-2">
                        <i className="bi bi-box-seam me-2"></i> Products
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/orders" className="py-2">
                        <FaBox className="me-2" /> Orders
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/users" className="py-2">
                        <FaUser className="me-2" /> Users
                      </NavDropdown.Item>
                    </>
                  )}
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logoutHandler} className="py-2 text-danger">
                    <FaSignOutAlt className="me-2" /> Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Nav.Link as={Link} to="/login" className="mx-2">
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    className="px-3"
                  >
                    <FaUser className="me-2" /> Login
                  </Button>
                </Nav.Link>
                
                {/* Register Button */}
                <Nav.Link as={Link} to="/register" className="mx-2">
                  <Button variant="light" size="sm" className="px-3 fw-bold">
                    Register
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;