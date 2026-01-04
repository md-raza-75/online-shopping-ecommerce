import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Carousel, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFire, FaTag, FaShippingFast, FaShieldAlt, FaArrowRight } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { getProducts } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.data || data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Unable to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Featured products (first 3 products)
  const featuredProducts = products.slice(0, 3);
  // Latest products
  const latestProducts = products.slice().reverse().slice(0, 6);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5 mb-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <h1 className="display-4 fw-bold mb-3">
                Welcome to <span className="text-warning">ShopEasy</span>
              </h1>
              <p className="lead mb-4">
                Discover amazing products at unbeatable prices. 
                Fast shipping, secure payments, and excellent customer service.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Button variant="warning" size="lg" as={Link} to="/products">
                  Shop Now <FaArrowRight className="ms-2" />
                </Button>
                <Button variant="outline-light" size="lg" as={Link} to="/categories">
                  Browse Categories
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="position-relative">
                <img 
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Shopping"
                  className="img-fluid rounded shadow-lg"
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                />
                <div className="position-absolute bottom-0 start-0 bg-dark bg-opacity-75 text-white p-3 rounded-end">
                  <h5 className="mb-0">🎉 Sale up to 50% OFF</h5>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section mb-5">
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <div className="mb-3">
                    <FaShippingFast size={40} className="text-primary" />
                  </div>
                  <Card.Title>Free Shipping</Card.Title>
                  <Card.Text className="text-muted">
                    Free delivery on all orders above ₹999
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <div className="mb-3">
                    <FaShieldAlt size={40} className="text-success" />
                  </div>
                  <Card.Title>Secure Payment</Card.Title>
                  <Card.Text className="text-muted">
                    100% secure payment with SSL encryption
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center h-100 border-0 shadow-sm">
                <Card.Body className="py-4">
                  <div className="mb-3">
                    <FaTag size={40} className="text-danger" />
                  </div>
                  <Card.Title>Best Price</Card.Title>
                  <Card.Text className="text-muted">
                    Guaranteed best prices on all products
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Products */}
      <section className="featured-products mb-5">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">
              <FaFire className="me-2 text-danger" />
              Featured Products
            </h2>
            <Link to="/products" className="text-decoration-none">
              View All <FaArrowRight className="ms-1" />
            </Link>
          </div>
          
          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Loader />
          ) : featuredProducts.length === 0 ? (
            <Alert variant="info" className="text-center">
              No featured products available. Please add products from admin panel.
            </Alert>
          ) : (
            <Row>
              {featuredProducts.map((product) => (
                <Col key={product._id} sm={12} md={6} lg={4} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Latest Products */}
      <section className="latest-products">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Latest Products</h2>
            <Link to="/products" className="text-decoration-none">
              View All <FaArrowRight className="ms-1" />
            </Link>
          </div>
          
          {loading ? (
            <Loader />
          ) : latestProducts.length === 0 ? (
            <Alert variant="info" className="text-center">
              No products available yet.
            </Alert>
          ) : (
            <Row>
              {latestProducts.map((product) => (
                <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Call to Action */}
      <section className="cta-section bg-dark text-white py-5 mt-5">
        <Container className="text-center">
          <h2 className="mb-3">Ready to Shop?</h2>
          <p className="lead mb-4">
            Join thousands of satisfied customers who shop with us.
          </p>
          <Button variant="warning" size="lg" as={Link} to="/register">
            Create Free Account
          </Button>
        </Container>
      </section>
    </div>
  );
};

export default Home;