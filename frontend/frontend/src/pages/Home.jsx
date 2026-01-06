import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Row, Col, Alert, Card, Button, 
  Form, InputGroup, Badge 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaFire, FaTag, FaShippingFast, FaShieldAlt, FaArrowRight,
  FaSearch, FaShoppingBag, FaBox, FaHeadset, FaGift
} from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';
import { getProducts } from '../services/api';

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        console.log('Fetched products:', data); // Debug log
        
        // Handle different response structures
        if (data && data.data) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Unable to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Client-side search function (works instantly)
  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Search in already loaded products
    const searchTerm = query.toLowerCase().trim();
    const filteredProducts = products.filter(product => {
      if (!product) return false;
      
      const productName = product.name?.toLowerCase() || '';
      const productDesc = product.description?.toLowerCase() || '';
      const productCategory = product.category?.toLowerCase() || '';
      const productBrand = product.brand?.toLowerCase() || '';
      
      return (
        productName.includes(searchTerm) ||
        productDesc.includes(searchTerm) ||
        productCategory.includes(searchTerm) ||
        productBrand.includes(searchTerm)
      );
    });
    
    console.log('Search results:', filteredProducts); // Debug log
    setSearchResults(filteredProducts);
    setIsSearching(false);
  }, [products]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    handleSearch(value);
  };

  // Handle form submit - navigate to products page with search query
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Featured products (first 3 products)
  const featuredProducts = products.slice(0, 3);
  // Latest products
  const latestProducts = products.slice().reverse().slice(0, 6);

  // Products to display
  const displayProducts = searchQuery && searchResults.length > 0 ? searchResults : featuredProducts;
  const displayLatestProducts = searchQuery && searchResults.length > 0 ? [] : latestProducts;

  return (
    <div className="home-page">
      {/* Hero Section with Search Bar */}
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
              
              {/* Search Bar */}
              <div className="mb-4 position-relative">
                <Form onSubmit={handleSearchSubmit}>
                  <InputGroup size="lg" className="shadow">
                    <InputGroup.Text className="bg-white border-0">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Search for products, brands, categories..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="border-0"
                    />
                    <Button 
                      type="submit" 
                      variant="warning" 
                      className="px-4"
                      disabled={!searchQuery.trim()}
                    >
                      Search
                    </Button>
                  </InputGroup>
                </Form>
                
                {/* Show search status */}
                {isSearching && (
                  <div className="position-absolute bg-white shadow-sm p-2 rounded w-100 mt-1">
                    <div className="text-center text-primary">
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Searching...</span>
                      </div>
                      Searching...
                    </div>
                  </div>
                )}
                
                {/* Search Results Dropdown */}
                {searchQuery && searchResults.length > 0 && !isSearching && (
                  <div className="position-absolute bg-white shadow-sm p-2 rounded w-100 mt-1">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Badge bg="info" className="px-3 py-1">
                        {searchResults.length} products found
                      </Badge>
                      <Button 
                        variant="link" 
                        className="p-0 text-decoration-none"
                        onClick={clearSearch}
                        size="sm"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="search-results-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {searchResults.slice(0, 5).map((product) => (
                        <div 
                          key={product._id} 
                          className="search-result-item p-2 border-bottom hover-bg-light cursor-pointer"
                          onClick={() => navigate(`/product/${product._id}`)}
                        >
                          <div className="d-flex align-items-center">
                            <img 
                              src={product.image || '/images/default-product.jpg'} 
                              alt={product.name}
                              className="rounded me-2"
                              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-0 text-dark">{product.name}</h6>
                              <small className="text-muted">₹{product.price}</small>
                            </div>
                            <FaArrowRight className="text-primary" />
                          </div>
                        </div>
                      ))}
                      {searchResults.length > 5 && (
                        <div className="text-center p-2">
                          <Button 
                            variant="link" 
                            className="text-primary p-0"
                            onClick={handleSearchSubmit}
                          >
                            View all {searchResults.length} results
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No Results Message */}
                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="position-absolute bg-white shadow-sm p-3 rounded w-100 mt-1">
                    <div className="text-center">
                      <p className="mb-2 text-dark">
                        No products found for "<strong>{searchQuery}</strong>"
                      </p>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate('/products')}
                      >
                        Browse All Products
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Quick Search Tips */}
                <div className="mt-3">
                  <small className="text-white-80">
                    <strong>Try searching for:</strong> Mobile, Laptop, Shoes, T-Shirt, etc.
                  </small>
                </div>
              </div>
              
              <div className="d-flex flex-wrap gap-3">
                <Button variant="warning" size="lg" as={Link} to="/products">
                  <FaShoppingBag className="me-2" />
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

      {/* Search Results Section */}
      {searchQuery && searchResults.length > 0 && (
        <section className="search-results-section mb-5">
          <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold">
                <FaSearch className="me-2" />
                Search Results for "{searchQuery}"
              </h2>
              <div>
                <Badge bg="info" className="px-3 py-2 me-2">
                  {searchResults.length} products found
                </Badge>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={clearSearch}
                >
                  Clear Search
                </Button>
              </div>
            </div>
            
            {isSearching ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Searching...</span>
                </div>
                <p className="mt-3">Searching products...</p>
              </div>
            ) : (
              <Row>
                {searchResults.map((product) => (
                  <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            )}
            
            <div className="text-center mt-4">
              <Button 
                variant="primary" 
                as={Link} 
                to={`/products?search=${encodeURIComponent(searchQuery)}`}
              >
                View All Search Results <FaArrowRight className="ms-2" />
              </Button>
            </div>
          </Container>
        </section>
      )}

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

      {/* Featured Products (Only show when not searching) */}
      {!searchQuery && (
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
                {displayProducts.map((product) => (
                  <Col key={product._id} sm={12} md={6} lg={4} className="mb-4">
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </section>
      )}

      {/* Latest Products (Only show when not searching) */}
      {!searchQuery && (
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
                {displayLatestProducts.map((product) => (
                  <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <ProductCard product={product} />
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </section>
      )}

      {/* Popular Categories (Only show when not searching) */}
      {!searchQuery && (
        <section className="popular-categories mb-5">
          <Container>
            <h2 className="fw-bold mb-4">Popular Categories</h2>
            <Row className="g-3">
              <Col xs={6} md={3}>
                <Card as={Link} to="/products?category=electronics" className="text-center h-100 border-0 shadow-sm text-decoration-none">
                  <Card.Body className="py-4">
                    <div className="mb-3 fs-1">📱</div>
                    <Card.Title>Electronics</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card as={Link} to="/products?category=fashion" className="text-center h-100 border-0 shadow-sm text-decoration-none">
                  <Card.Body className="py-4">
                    <div className="mb-3 fs-1">👕</div>
                    <Card.Title>Fashion</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card as={Link} to="/products?category=home" className="text-center h-100 border-0 shadow-sm text-decoration-none">
                  <Card.Body className="py-4">
                    <div className="mb-3 fs-1">🏠</div>
                    <Card.Title>Home & Kitchen</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={6} md={3}>
                <Card as={Link} to="/products?category=beauty" className="text-center h-100 border-0 shadow-sm text-decoration-none">
                  <Card.Body className="py-4">
                    <div className="mb-3 fs-1">💄</div>
                    <Card.Title>Beauty</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Call to Action */}
      <section className="cta-section bg-dark text-white py-5 mt-5">
        <Container className="text-center">
          <h2 className="mb-3">Ready to Shop?</h2>
          <p className="lead mb-4">
            Join thousands of satisfied customers who shop with us.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Button variant="warning" size="lg" as={Link} to="/register">
              Create Free Account
            </Button>
            <Button variant="outline-light" size="lg" as={Link} to="/products">
              Browse All Products
            </Button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Home;