import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { 
  FaGithub, 
  FaLinkedin, 
  FaTwitter, 
  FaInstagram, 
  FaFacebook,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-white py-5 mt-5">
      <Container>
        <Row className="g-4">
          <Col lg={4} md={6}>
            <h4 className="fw-bold mb-3">
              <span className="text-primary">Shop</span>Easy
            </h4>
            <p className="text-light mb-4">
              Your trusted online shopping destination. We offer premium products 
              with fast delivery and excellent customer service.
            </p>
            <div className="d-flex gap-3">
              <a href="https://github.com" className="text-white fs-5">
                <FaGithub />
              </a>
              <a href="https://linkedin.com" className="text-white fs-5">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" className="text-white fs-5">
                <FaTwitter />
              </a>
              <a href="https://instagram.com" className="text-white fs-5">
                <FaInstagram />
              </a>
              <a href="https://facebook.com" className="text-white fs-5">
                <FaFacebook />
              </a>
            </div>
          </Col>
          
          <Col lg={2} md={6}>
            <h5 className="fw-bold mb-3">Quick Links</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-light text-decoration-none">
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/products" className="text-light text-decoration-none">
                  Products
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-light text-decoration-none">
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="text-light text-decoration-none">
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="text-light text-decoration-none">
                  FAQ
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col lg={3} md={6}>
            <h5 className="fw-bold mb-3">Categories</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/category/clothing" className="text-light text-decoration-none">
                  Clothing
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/category/electronics" className="text-light text-decoration-none">
                  Electronics
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/category/home" className="text-light text-decoration-none">
                  Home & Living
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/category/books" className="text-light text-decoration-none">
                  Books
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/category/beauty" className="text-light text-decoration-none">
                  Beauty
                </Link>
              </li>
            </ul>
          </Col>
          
          <Col lg={3} md={6}>
            <h5 className="fw-bold mb-3">Contact Info</h5>
            <ul className="list-unstyled">
              <li className="mb-3 d-flex align-items-start">
                <FaMapMarkerAlt className="me-2 mt-1 text-primary" />
                <span className="text-light">
                  123 Shopping Street, Mumbai, Maharashtra 400001
                </span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaPhone className="me-2 text-primary" />
                <span className="text-light">+91 98765 43210</span>
              </li>
              <li className="mb-3 d-flex align-items-center">
                <FaEnvelope className="me-2 text-primary" />
                <span className="text-light">support@shopeasy.com</span>
              </li>
            </ul>
          </Col>
        </Row>
        
        <hr className="bg-secondary my-4" />
        
        <Row>
          <Col className="text-center">
            <p className="mb-0 text-light">
              &copy; {currentYear} ShopEasy. All rights reserved. | 
              <Link to="/privacy" className="text-light text-decoration-none mx-2">
                Privacy Policy
              </Link>
              |
              <Link to="/terms" className="text-light text-decoration-none mx-2">
                Terms of Service
              </Link>
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;