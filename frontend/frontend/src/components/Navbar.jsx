import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar as BootstrapNavbar, NavDropdown, Badge, Button } from 'react-bootstrap';
import { 
  FaShoppingCart, 
  FaUser, 
  FaSignOutAlt, 
  FaHome, 
  FaBox, 
  FaUserShield,
  FaBars 
} from 'react-icons/fa';

const Navbar = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Load user from localStorage
    const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
    setUserInfo(user);
    
    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(cart);
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cartItems');
    setUserInfo(null);
    navigate('/login');
  };

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <BootstrapNavbar bg="primary" variant="dark" expand="lg" className="shadow-sm py-3">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="fw-bold fs-3">
          <FaHome className="me-2" />
          ShopEasy
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="navbar-nav">
          <FaBars />
        </BootstrapNavbar.Toggle>
        
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/cart" className="position-relative mx-3">
              <FaShoppingCart className="fs-5" />
              {cartItemCount > 0 && (
                <Badge 
                  pill 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.7rem' }}
                >
                  {cartItemCount}
                </Badge>
              )}
              <span className="ms-2 d-none d-lg-inline">Cart</span>
            </Nav.Link>
            
            {userInfo ? (
              <NavDropdown 
                title={
                  <span className="d-flex align-items-center">
                    <FaUser className="me-2" />
                    {userInfo.name.split(' ')[0]}
                  </span>
                } 
                id="user-dropdown"
                align="end"
                className="mx-3"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/orders">
                  <FaBox className="me-2" /> My Orders
                </NavDropdown.Item>
                
                {userInfo.role === 'admin' && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/admin">
                      <FaUserShield className="me-2" /> Admin Dashboard
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/add-product">
                      Add Product
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/products">
                      Manage Products
                    </NavDropdown.Item>
                  </>
                )}
                
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={logoutHandler} className="text-danger">
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="mx-2">
                  <Button variant="outline-light" size="sm" className="px-3">
                    <FaUser className="me-2" /> Sign In
                  </Button>
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="mx-2">
                  <Button variant="light" size="sm" className="px-3">
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