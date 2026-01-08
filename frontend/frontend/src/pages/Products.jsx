import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Form, 
  Spinner, Alert, Badge 
} from 'react-bootstrap';
import { 
  FaSearch, FaFilter, FaExclamationTriangle, 
  FaShoppingBag, FaBoxOpen 
} from 'react-icons/fa';
import { getProducts } from '../services/api';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      const productsData = data.data || data;
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name?.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterAndSortProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5" style={{ animation: 'fadeIn 0.5s ease' }}>
          <Spinner animation="border" variant="primary" size="lg" />
          <h4 className="mt-3 text-muted">Loading Products...</h4>
          <p className="text-muted">Please wait while we fetch the best deals for you</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5" style={{ animation: 'fadeIn 0.5s ease' }}>
        <Alert variant="danger" className="text-center">
          <FaExclamationTriangle size={48} className="mb-3" />
          <h4>Oops! Something went wrong</h4>
          <p>{error}</p>
          <Button variant="primary" onClick={fetchProducts} className="mt-2">
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div className="text-center mb-5" style={{ animation: 'slideDown 0.5s ease' }}>
        <h1 className="display-5 fw-bold mb-3">
          <FaShoppingBag className="me-2" />
          Shop Products
        </h1>
        <p className="lead text-muted">
          Discover amazing products at great prices
        </p>
      </div>

      {/* Filters Section */}
      <Card className="mb-4 shadow-sm border-0" style={{ animation: 'slideUp 0.5s ease' }}>
        <Card.Body>
          <Row className="g-3">
            <Col md={5}>
              <Form onSubmit={handleSearch}>
                <Form.Group className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Search products by name, description or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="py-2 ps-4"
                  />
                  <FaSearch className="position-absolute top-50 translate-middle-y" style={{ left: '15px', color: '#6c757d' }} />
                </Form.Group>
              </Form>
            </Col>
            
            <Col md={3}>
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2"
              >
                <option value="all">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Form.Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2"
              >
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </Form.Select>
            </Col>
            
            <Col md={2}>
              <Button
                variant="outline-secondary"
                className="w-100 py-2"
                onClick={clearFilters}
              >
                <FaFilter className="me-2" />
                Clear Filters
              </Button>
            </Col>
          </Row>
          
          <div className="mt-3 text-muted small">
            Showing {filteredProducts.length} of {products.length} products
            {searchTerm && ` for "${searchTerm}"`}
            {categoryFilter !== 'all' && ` in ${categoryFilter}`}
          </div>
        </Card.Body>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-5" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="empty-state">
            <FaShoppingBag size={64} className="text-muted mb-4" />
            <h4 className="mb-3">No products found</h4>
            <p className="text-muted mb-4">
              {searchTerm || categoryFilter !== 'all' 
                ? "Try adjusting your search or filters" 
                : "No products available at the moment. Check back soon!"}
            </p>
            {(searchTerm || categoryFilter !== 'all') && (
              <Button variant="primary" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Row>
          {filteredProducts.map((product, index) => (
            <Col 
              key={product._id} 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3} 
              className="mb-4"
            >
              <Card 
                className="h-100 shadow-sm border-0 product-card"
                style={{ 
                  animation: `fadeIn 0.5s ease ${index * 0.1}s`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                }}
                onClick={() => window.location.href = `/product/${product._id}`}
              >
                <div className="position-relative">
                  <Card.Img
                    variant="top"
                    src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'}
                    alt={product.name}
                    style={{ 
                      height: '200px', 
                      objectFit: 'cover',
                      borderTopLeftRadius: '8px',
                      borderTopRightRadius: '8px'
                    }}
                    className="product-image"
                  />
                  {product.stock === 0 && (
                    <div className="position-absolute top-0 start-0 w-100 text-center bg-danger text-white py-1">
                      Out of Stock
                    </div>
                  )}
                  {product.discount && product.discount > 0 && (
                    <div className="position-absolute top-0 end-0 bg-success text-white px-2 py-1 m-2 rounded-circle">
                      -{product.discount}%
                    </div>
                  )}
                </div>
                
                <Card.Body className="d-flex flex-column p-3">
                  <div className="mb-2">
                    <Badge bg="secondary" className="mb-2">
                      {product.category || 'Uncategorized'}
                    </Badge>
                  </div>
                  
                  <Card.Title 
                    className="h6 fw-bold mb-2 product-title"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: '48px'
                    }}
                  >
                    {product.name}
                  </Card.Title>
                  
                  <Card.Text 
                    className="text-muted small mb-3"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      height: '40px'
                    }}
                  >
                    {product.description || 'No description available'}
                  </Card.Text>
                  
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <h5 className="text-primary mb-0 fw-bold">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </h5>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <small className="text-muted text-decoration-line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </small>
                        )}
                      </div>
                      {product.stock > 0 && (
                        <small className="text-success">
                          <FaBoxOpen className="me-1" />
                          {product.stock} in stock
                        </small>
                      )}
                    </div>
                    
                    <Link to={`/product/${product._id}`} onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="primary" 
                        className="w-100 py-2"
                        disabled={product.stock === 0}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .product-card {
          border-radius: 12px;
          overflow: hidden;
        }
        
        .product-image {
          transition: transform 0.5s ease;
        }
        
        .product-card:hover .product-image {
          transform: scale(1.05);
        }
        
        .product-title {
          color: #2c3e50;
        }
        
        .empty-state {
          max-width: 400px;
          margin: 0 auto;
          padding: 40px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }
        
        @media (max-width: 768px) {
          .product-card {
            margin-bottom: 20px;
          }
        }
      `}</style>
    </Container>
  );
};

export default Products;