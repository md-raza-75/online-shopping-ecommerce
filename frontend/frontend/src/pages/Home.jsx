import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Row, Col, Alert, Card, Button, 
  Form, InputGroup, Badge 
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaFire, FaTag, FaShippingFast, FaShieldAlt, FaArrowRight,
  FaSearch, FaShoppingBag, FaBox, FaHeadset, FaGift,
  FaStar, FaRupeeSign
} from 'react-icons/fa';
import Loader from '../components/Loader';
import { getProducts, formatCurrency } from '../services/api';

// Updated Product Card with Premium Animations
const ProductCard = ({ product, index }) => {
  const navigate = useNavigate();
  
  if (!product) return null;
  
  return (
    <Card className="product-card-premium shadow-lg border-0 h-100 animate__animated animate__fadeInUp"
          style={{ 
            animationDelay: `${index * 0.1}s`,
            '--animate-duration': '0.6s'
          }}>
      <div className="position-relative overflow-hidden product-image-container" style={{ height: '200px' }}>
        <Card.Img
          variant="top"
          src={product.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'}
          alt={product.name}
          className="product-img h-100"
          style={{ objectFit: 'cover' }}
          onClick={() => navigate(`/product/${product._id || product.id}`)}
        />
        
        {/* Hover Overlay Effect */}
        <div className="product-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0">
          <Button 
            variant="warning" 
            className="btn-premium-pulse"
            onClick={() => navigate(`/product/${product._id || product.id}`)}
          >
            <FaShoppingBag className="me-2" />
            Quick View
          </Button>
        </div>
        
        {product.stock <= 0 && (
          <Badge bg="danger" className="position-absolute top-0 end-0 m-2 animate__animated animate__pulse animate__infinite">
            Out of Stock
          </Badge>
        )}
        
        {/* Discount Badge with Animation */}
        {product.price > 1000 && (
          <div className="discount-badge position-absolute top-0 start-0 m-2 animate__animated animate__bounceIn">
            <Badge bg="warning" className="text-dark px-3 py-2 discount-flash">
              SALE
            </Badge>
          </div>
        )}
      </div>
      
      <Card.Body className="d-flex flex-column">
        <Card.Title 
          className="mb-2 cursor-pointer text-hover-glow"
          onClick={() => navigate(`/product/${product._id || product.id}`)}
          style={{ 
            fontSize: '1rem',
            minHeight: '48px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {product.name}
        </Card.Title>
        
        <div className="mb-2">
          <Badge bg="info" className="mb-2 category-badge animate__animated animate__fadeIn">
            {product.category || 'Uncategorized'}
          </Badge>
        </div>
        
        {/* Star Rating with Animation */}
        <div className="d-flex align-items-center mb-2 star-rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} className="star-icon me-1 animate__animated animate__bounceIn" 
                   style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
          <small className="text-muted ms-2">(4.5)</small>
        </div>
        
        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="text-primary mb-0 price-float">
              <FaRupeeSign className="me-1" />
              {product.price ? formatCurrency(product.price) : '₹0'}
            </h5>
            {product.stock > 0 && (
              <small className="text-success stock-pulse">
                <strong>{product.stock}</strong> in stock
              </small>
            )}
          </div>
          
          <Button 
            variant="primary" 
            className="w-100 btn-premium-hover"
            onClick={() => navigate(`/product/${product._id || product.id}`)}
            disabled={product.stock <= 0}
          >
            <FaShoppingBag className="me-2" />
            {product.stock > 0 ? 'View Details' : 'Out of Stock'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHero, setShowHero] = useState(false);
  const navigate = useNavigate();

  // Fetch all products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Fetching products...');
        const response = await getProducts();
        console.log('API Response:', response);
        
        // Handle different response structures
        let productsData = [];
        
        if (response && response.data) {
          productsData = response.data;
        } else if (Array.isArray(response)) {
          productsData = response;
        } else if (response && Array.isArray(response.products)) {
          productsData = response.products;
        }
        
        console.log('Processed products:', productsData);
        setProducts(productsData || []);
        setLoading(false);
        
        // Trigger hero animation after products load
        setTimeout(() => {
          setShowHero(true);
        }, 300);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Unable to fetch products. Please try again later.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Client-side search function
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
      
      const productName = (product.name || '').toString().toLowerCase();
      const productDesc = (product.description || '').toString().toLowerCase();
      const productCategory = (product.category || '').toString().toLowerCase();
      const productBrand = (product.brand || '').toString().toLowerCase();
      
      return (
        productName.includes(searchTerm) ||
        productDesc.includes(searchTerm) ||
        productCategory.includes(searchTerm) ||
        productBrand.includes(searchTerm)
      );
    });
    
    console.log('Search results:', filteredProducts);
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

  // Get featured products (first 6 products)
  const featuredProducts = products.slice(0, 6);
  // Get latest products (by creation date or last 6)
  const latestProducts = products.length > 6 ? products.slice(-6) : products;

  // Products to display based on search
  const displayProducts = searchQuery && searchResults.length > 0 ? searchResults : featuredProducts;
  const displayLatestProducts = searchQuery && searchResults.length > 0 ? [] : latestProducts;

  // Get unique categories for quick navigation
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].slice(0, 4);

  return (
    <div className="home-page animate__animated animate__fadeIn">
      {/* Hero Section with Awesome Animations */}
      <section className={`hero-section-premium text-white py-5 mb-5 ${showHero ? 'hero-visible' : ''}`}>
        {/* Animated Background Elements */}
        <div className="hero-bg-animation">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
        
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              {/* Title with Typewriter Effect */}
              <h1 className="display-4 fw-bold mb-3 hero-title animate__animated animate__fadeInDown">
                Welcome to <span className="text-warning text-glow">ShopEasy</span>
              </h1>
              
              {/* Subtitle with Slide In */}
              <p className="lead mb-4 hero-subtitle animate__animated animate__fadeInUp animate__delay-1s">
                Discover amazing products at unbeatable prices. 
                <span className="d-block mt-2 animate__animated animate__fadeInUp animate__delay-2s">
                  Fast shipping, secure payments, and excellent customer service.
                </span>
              </p>
              
              {/* Search Bar with Glow Effect */}
              <div className="mb-4 position-relative search-bar-container animate__animated animate__zoomIn animate__delay-2s">
                <Form onSubmit={handleSearchSubmit}>
                  <InputGroup size="lg" className="search-bar-glow rounded-pill overflow-hidden">
                    <InputGroup.Text className="bg-white border-0 ps-4 search-icon-animate">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <Form.Control
                      type="search"
                      placeholder="Search products, brands, categories..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="border-0 py-3 search-input-animate"
                      style={{ fontSize: '1.1rem' }}
                    />
                    <Button 
                      type="submit" 
                      variant="warning" 
                      className="px-4 fw-bold border-0 btn-search-pulse"
                      disabled={!searchQuery.trim()}
                      style={{ borderRadius: '0 50px 50px 0' }}
                    >
                      <FaSearch className="me-2" />
                      Search
                    </Button>
                  </InputGroup>
                </Form>
                
                {/* Search Results Dropdown with Animation */}
                {searchQuery && searchResults.length > 0 && !isSearching && (
                  <div className="position-absolute bg-white shadow-lg rounded-3 w-100 mt-2 border search-dropdown animate__animated animate__fadeInDown">
                    <div className="p-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg="info" className="px-3 py-2 badge-bounce">
                          <FaSearch className="me-2" />
                          {searchResults.length} products found
                        </Badge>
                        <Button 
                          variant="link" 
                          className="p-0 text-decoration-none text-danger fw-bold btn-clear-animate"
                          onClick={clearSearch}
                          size="sm"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    
                    <div className="search-results-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {searchResults.slice(0, 5).map((product, index) => (
                        <div 
                          key={product._id || product.id} 
                          className="search-result-item p-3 border-bottom cursor-pointer hover-bg-light search-item-animate"
                          onClick={() => navigate(`/product/${product._id || product.id}`)}
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <Row className="align-items-center g-3">
                            <Col xs={3}>
                              <img 
                                src={product.image || 'https://via.placeholder.com/80x80?text=No+Image'} 
                                alt={product.name}
                                className="rounded img-fluid product-thumb-animate"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                            </Col>
                            <Col xs={7}>
                              <h6 className="mb-1 text-dark fw-bold">{product.name}</h6>
                              <p className="mb-1 text-muted small" style={{
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {product.description || 'No description available'}
                              </p>
                              <div className="d-flex align-items-center">
                                <Badge bg="info" className="me-2">
                                  {product.category || 'Uncategorized'}
                                </Badge>
                                <span className="text-primary fw-bold">
                                  ₹{product.price || 0}
                                </span>
                              </div>
                            </Col>
                            <Col xs={2} className="text-end">
                              <FaArrowRight className="text-primary arrow-animate" />
                            </Col>
                          </Row>
                        </div>
                      ))}
                      
                      {searchResults.length > 5 && (
                        <div className="text-center p-3 bg-light">
                          <Button 
                            variant="primary" 
                            className="px-4 btn-view-all"
                            onClick={handleSearchSubmit}
                          >
                            View all {searchResults.length} results
                            <FaArrowRight className="ms-2 arrow-bounce" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No Results Message */}
                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="position-absolute bg-white shadow-lg rounded-3 w-100 mt-2 border p-4 no-results-animate animate__animated animate__shakeX">
                    <div className="text-center">
                      <div className="display-1 text-muted mb-3 emoji-bounce">🔍</div>
                      <h5 className="mb-3 text-dark">
                        No products found for "<span className="text-primary">{searchQuery}</span>"
                      </h5>
                      <div className="d-flex flex-wrap gap-2 justify-content-center">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => navigate('/products')}
                        >
                          Browse All Products
                        </Button>
                        <Button 
                          variant="link" 
                          size="sm"
                          onClick={clearSearch}
                          className="text-danger"
                        >
                          Clear Search
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons with Hover Effects */}
              <div className="d-flex flex-wrap gap-3 hero-buttons animate__animated animate__fadeInUp animate__delay-3s">
                <Button variant="warning" size="lg" as={Link} to="/products" 
                        className="px-4 rounded-pill btn-shop-glow">
                  <FaShoppingBag className="me-2" />
                  Shop Now <FaArrowRight className="ms-2 arrow-slide" />
                </Button>
                <Button variant="outline-light" size="lg" as={Link} to="/products" 
                        className="px-4 rounded-pill btn-browse-hover">
                  <FaBox className="me-2" />
                  Browse All Products
                </Button>
              </div>
            </Col>
            
            {/* Hero Image with Parallax Effect */}
            <Col lg={6}>
              <div className="position-relative hero-image-container animate__animated animate__fadeInRight animate__delay-1s">
                <img 
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Shopping"
                  className="img-fluid rounded-4 shadow-lg hero-image-float"
                  style={{ 
                    maxHeight: '500px', 
                    objectFit: 'cover',
                    width: '100%'
                  }}
                />
                {/* Sale Badge with Pulse Animation */}
                <div className="position-absolute bottom-0 start-0 bg-dark bg-opacity-75 text-white p-4 rounded-end-top sale-badge-pulse">
                  <h4 className="mb-0">
                    <span className="text-warning emoji-spin">🎉</span> Sale up to 50% OFF
                  </h4>
                  <p className="mb-0 small">Limited time offer</p>
                </div>
                
                {/* Floating Elements */}
                <div className="floating-tag tag-1 animate__animated animate__bounceInDown animate__delay-2s">
                  <span className="badge bg-success">🔥 Hot Deal</span>
                </div>
                <div className="floating-tag tag-2 animate__animated animate__bounceInDown animate__delay-3s">
                  <span className="badge bg-primary">🚚 Free Shipping</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Search Results Section with Animation */}
      {searchQuery && searchResults.length > 0 && (
        <section className="search-results-section py-5 mb-5 bg-light animate__animated animate__fadeIn">
          <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold section-title-animate">
                <FaSearch className="me-2" />
                Search Results for "<span className="text-primary">{searchQuery}</span>"
              </h2>
              <div className="d-flex gap-2">
                <Badge bg="info" className="px-3 py-2 fs-6 badge-count-animate">
                  {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found
                </Badge>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={clearSearch}
                  className="rounded-pill btn-clear-animate"
                >
                  Clear Search
                </Button>
              </div>
            </div>
            
            {isSearching ? (
              <div className="text-center py-5">
                <div className="spinner-glow text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Searching...</span>
                </div>
                <p className="mt-3 fs-5 searching-text">Searching products...</p>
              </div>
            ) : (
              <>
                <Row>
                  {searchResults.map((product, index) => (
                    <Col key={product._id || product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                      <ProductCard product={product} index={index} />
                    </Col>
                  ))}
                </Row>
                
                <div className="text-center mt-5">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    as={Link} 
                    to={`/products?search=${encodeURIComponent(searchQuery)}`}
                    className="px-5 rounded-pill btn-view-all-glow"
                  >
                    View All Search Results ({searchResults.length})
                    <FaArrowRight className="ms-2 arrow-slide" />
                  </Button>
                </div>
              </>
            )}
          </Container>
        </section>
      )}

      {/* Features Section with Stagger Animation */}
      <section className="features-section py-5 mb-5 animate__animated animate__fadeInUp">
        <Container>
          <Row className="g-4">
            {[
              { icon: FaShippingFast, title: 'Free Shipping', desc: 'Free delivery on orders above ₹999', color: 'primary', delay: 0 },
              { icon: FaShieldAlt, title: 'Secure Payment', desc: '100% secure with SSL encryption', color: 'success', delay: 1 },
              { icon: FaTag, title: 'Best Price', desc: 'Guaranteed best prices on all products', color: 'danger', delay: 2 },
              { icon: FaHeadset, title: '24/7 Support', desc: 'Round-the-clock customer support', color: 'warning', delay: 3 }
            ].map((feature, index) => (
              <Col key={index} md={3} sm={6}>
                <Card className={`text-center h-100 border-0 shadow-sm rounded-3 feature-card feature-card-${index} animate__animated animate__fadeInUp`}
                      style={{ animationDelay: `${feature.delay * 0.2}s` }}>
                  <Card.Body className="py-4 px-3">
                    <div className="mb-3">
                      <div className={`bg-${feature.color} bg-opacity-10 p-3 rounded-circle d-inline-block icon-float`}>
                        <feature.icon size={30} className={`text-${feature.color}`} />
                      </div>
                    </div>
                    <Card.Title className="fw-bold mb-2">{feature.title}</Card.Title>
                    <Card.Text className="text-muted small">
                      {feature.desc}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Products with Stagger Animation */}
      {!searchQuery && featuredProducts.length > 0 && (
        <section className="featured-products py-5 mb-5 animate__animated animate__fadeIn">
          <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold section-title-animate">
                <FaFire className="me-2 text-danger fire-animate" />
                Featured Products
              </h2>
              <Link to="/products" className="text-decoration-none fw-bold text-primary link-hover-animate">
                View All <FaArrowRight className="ms-1 arrow-slide" />
              </Link>
            </div>
            
            {error && (
              <Alert variant="danger" className="text-center alert-shake">
                {error}
              </Alert>
            )}
            
            {loading ? (
              <div className="text-center py-5">
                <Loader />
                <p className="mt-3">Loading featured products...</p>
              </div>
            ) : featuredProducts.length === 0 ? (
              <Alert variant="info" className="text-center">
                No featured products available.
              </Alert>
            ) : (
              <Row>
                {displayProducts.map((product, index) => (
                  <Col key={product._id || product.id} sm={6} md={4} lg={3} className="mb-4">
                    <ProductCard product={product} index={index} />
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </section>
      )}

      {/* Latest Products Section */}
      {!searchQuery && latestProducts.length > 0 && (
        <section className="latest-products py-5 mb-5 bg-light animate__animated animate__fadeIn">
          <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="fw-bold section-title-slide">Latest Products</h2>
              <Link to="/products" className="text-decoration-none fw-bold text-primary link-hover-animate">
                View All <FaArrowRight className="ms-1 arrow-slide" />
              </Link>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <Loader />
                <p className="mt-3">Loading latest products...</p>
              </div>
            ) : latestProducts.length === 0 ? (
              <Alert variant="info" className="text-center">
                No products available yet.
              </Alert>
            ) : (
              <Row>
                {displayLatestProducts.map((product, index) => (
                  <Col key={product._id || product.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                    <ProductCard product={product} index={index} />
                  </Col>
                ))}
              </Row>
            )}
          </Container>
        </section>
      )}

      {/* Categories Section */}
      {!searchQuery && uniqueCategories.length > 0 && (
        <section className="popular-categories py-5 mb-5 animate__animated animate__fadeInUp">
          <Container>
            <h2 className="fw-bold mb-4 text-center section-title-bounce">Popular Categories</h2>
            <Row className="g-4">
              {uniqueCategories.map((category, index) => (
                <Col key={index} xs={6} md={3}>
                  <Card 
                    as={Link} 
                    to={`/products?category=${encodeURIComponent(category)}`}
                    className="text-center h-100 border-0 shadow-sm text-decoration-none category-card-hover"
                    style={{ 
                      transition: 'all 0.3s ease',
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <Card.Body className="py-4 px-3">
                      <div className="mb-3">
                        <div className="display-4 category-icon-animate">
                          {category === 'electronics' && '📱'}
                          {category === 'fashion' && '👕'}
                          {category === 'home' && '🏠'}
                          {category === 'beauty' && '💄'}
                          {!['electronics', 'fashion', 'home', 'beauty'].includes(category) && '🛍️'}
                        </div>
                      </div>
                      <Card.Title className="fw-bold mb-0">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Card.Title>
                      <Card.Text className="text-muted small mt-2">
                        {products.filter(p => p.category === category).length} products
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* CTA Section with Glow Effect */}
      <section className="cta-section py-5 bg-dark text-white animate__animated animate__fadeIn">
        <Container className="text-center">
          <h2 className="mb-3 fw-bold cta-title-glow">Ready to Shop?</h2>
          <p className="lead mb-4 cta-text-slide">
            Join thousands of satisfied customers who shop with us.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Button variant="warning" size="lg" as={Link} to="/register" 
                    className="px-5 rounded-pill btn-register-pulse">
              <FaGift className="me-2 gift-spin" />
              Create Free Account
            </Button>
            <Button variant="outline-light" size="lg" as={Link} to="/products" 
                    className="px-5 rounded-pill btn-browse-glow">
              <FaShoppingBag className="me-2" />
              Browse All Products
            </Button>
          </div>
        </Container>
      </section>
      
      {/* Scroll to Top Button */}
      <Button 
        variant="warning" 
        className="position-fixed bottom-0 end-0 m-3 p-3 rounded-circle btn-scroll-top"
        style={{ zIndex: 1000 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <FaArrowRight className="rotate-90" />
      </Button>
    </div>
  );
};

export default Home;