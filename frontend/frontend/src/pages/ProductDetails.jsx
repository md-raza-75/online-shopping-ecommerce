import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { 
  FaShoppingCart, 
  FaRupeeSign, 
  FaArrowLeft, 
  FaShareAlt, 
  FaHeart,
  FaStar,
  FaTruck,
  FaShieldAlt,
  FaUndo,
  FaTag
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader, { PageLoader } from '../components/Loader';
import { getProductById } from '../services/api';
import { saveCartToLocalStorage, getCartFromLocalStorage } from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data.data || data);
        setLoading(false);
        
        // TODO: Fetch related products based on category
        // For now, we'll use a mock
        setRelatedProducts([
          { _id: '1', name: 'Related Product 1', price: 999, image: 'https://via.placeholder.com/150' },
          { _id: '2', name: 'Related Product 2', price: 1499, image: 'https://via.placeholder.com/150' },
        ]);
        
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Product not found or server error');
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const addToCartHandler = () => {
    try {
      const cartItems = getCartFromLocalStorage();
      const existingItem = cartItems.find(item => item.product === product._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Only ${product.stock} items available in stock`);
          return;
        }
        existingItem.quantity = newQuantity;
      } else {
        cartItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: quantity
        });
      }
      
      saveCartToLocalStorage(cartItems);
      toast.success(`${quantity} × ${product.name} added to cart!`);
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const buyNowHandler = () => {
    addToCartHandler();
    navigate('/checkout');
  };

  const toggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    toast.success(
      isInWishlist 
        ? 'Removed from wishlist' 
        : 'Added to wishlist'
    );
  };

  if (loading) return <PageLoader />;

  if (error || !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          {error || 'Product not found'}
        </Alert>
        <div className="text-center">
          <Button variant="outline-primary" onClick={() => navigate('/')}>
            <FaArrowLeft className="me-2" />
            Back to Home
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <a href="/" className="text-decoration-none">Home</a>
          </li>
          <li className="breadcrumb-item">
            <a href="/products" className="text-decoration-none">Products</a>
          </li>
          <li className="breadcrumb-item">
            <a href={`/category/${product.category}`} className="text-decoration-none">
              {product.category}
            </a>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <Row>
        {/* Product Images */}
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center p-4">
              <img 
                src={product.image || 'https://via.placeholder.com/500x500?text=No+Image'} 
                alt={product.name}
                className="img-fluid rounded"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x500?text=No+Image';
                }}
              />
              <div className="d-flex justify-content-center gap-2 mt-3">
                {[1, 2, 3, 4].map((num) => (
                  <img 
                    key={num}
                    src={product.image || 'https://via.placeholder.com/80x80?text=Thumb'} 
                    alt={`Thumb ${num}`}
                    className="img-thumbnail"
                    style={{ width: '80px', height: '80px', cursor: 'pointer' }}
                  />
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Info */}
        <Col lg={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <Badge bg="secondary" className="mb-2">
                    {product.category || 'Uncategorized'}
                  </Badge>
                  <h1 className="h3 fw-bold mb-2">{product.name}</h1>
                  <div className="d-flex align-items-center mb-3">
                    <div className="text-warning me-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} size={16} className="me-1" />
                      ))}
                    </div>
                    <span className="text-muted">(4.5 • 120 reviews)</span>
                  </div>
                </div>
                <div>
                  <Button 
                    variant={isInWishlist ? "danger" : "outline-danger"} 
                    size="sm"
                    onClick={toggleWishlist}
                    className="rounded-circle"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <FaHeart />
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    className="rounded-circle ms-2"
                    style={{ width: '40px', height: '40px' }}
                  >
                    <FaShareAlt />
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center">
                  <h2 className="text-primary fw-bold mb-0 me-3">
                    <FaRupeeSign />
                    {product.price?.toLocaleString() || '0'}
                  </h2>
                  {product.originalPrice && (
                    <span className="text-muted text-decoration-line-through me-2">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                  {product.originalPrice && (
                    <Badge bg="danger">
                      Save {Math.round((1 - product.price/product.originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex align-items-center mb-3">
                  <Badge bg={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"} className="me-2">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </Badge>
                  <small className="text-muted">Product ID: {product._id}</small>
                </div>
                
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <div className="d-flex align-items-center text-muted">
                    <FaTruck className="me-2" /> Free Delivery
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <FaShieldAlt className="me-2" /> 1 Year Warranty
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <FaUndo className="me-2" /> 30 Days Return
                  </div>
                </div>
              </div>

              {product.stock > 0 ? (
                <>
                  <Form.Group className="mb-4" controlId="quantity">
                    <Form.Label className="fw-bold">Quantity</Form.Label>
                    <div className="d-flex align-items-center" style={{ maxWidth: '200px' }}>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="px-3"
                      >
                        -
                      </Button>
                      <Form.Control
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1 && val <= product.stock) {
                            setQuantity(val);
                          }
                        }}
                        className="mx-2 text-center"
                      />
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={quantity >= product.stock}
                        className="px-3"
                      >
                        +
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Available: {product.stock} units
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-3">
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={addToCartHandler}
                      className="py-3 fw-bold"
                    >
                      <FaShoppingCart className="me-2" />
                      Add to Cart
                    </Button>
                    
                    <Button 
                      variant="success" 
                      size="lg"
                      onClick={buyNowHandler}
                      className="py-3 fw-bold"
                    >
                      Buy Now
                    </Button>
                  </div>
                </>
              ) : (
                <Alert variant="warning">
                  <FaTag className="me-2" />
                  This product is currently out of stock. Check back soon!
                </Alert>
              )}

              <div className="mt-4 pt-3 border-top">
                <div className="d-flex flex-wrap gap-3">
                  <div>
                    <small className="text-muted d-block">SKU</small>
                    <strong>SKU-{product._id?.substring(0, 8)}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Category</small>
                    <strong>{product.category}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Added</small>
                    <strong>{new Date(product.createdAt).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Product Tabs */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="description" title="Description">
                  <div className="p-3">
                    <h4>Product Description</h4>
                    <p className="text-muted">{product.description}</p>
                  </div>
                </Tab>
                <Tab eventKey="specifications" title="Specifications">
                  <div className="p-3">
                    <h4>Specifications</h4>
                    <table className="table">
                      <tbody>
                        <tr>
                          <td><strong>Brand</strong></td>
                          <td>ShopEasy</td>
                        </tr>
                        <tr>
                          <td><strong>Model</strong></td>
                          <td>{product.name}</td>
                        </tr>
                        <tr>
                          <td><strong>Category</strong></td>
                          <td>{product.category}</td>
                        </tr>
                        <tr>
                          <td><strong>Stock</strong></td>
                          <td>{product.stock} units</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Tab>
                <Tab eventKey="reviews" title="Reviews (120)">
                  <div className="p-3">
                    <h4>Customer Reviews</h4>
                    <div className="text-center py-5">
                      <p className="text-muted">No reviews yet. Be the first to review!</p>
                      <Button variant="outline-primary">Write a Review</Button>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <Row className="mt-5">
          <Col>
            <h3 className="mb-4">Related Products</h3>
            <Row>
              {relatedProducts.map((item) => (
                <Col key={item._id} sm={6} md={4} lg={3}>
                  <Card className="shadow-sm border-0 h-100">
                    <Card.Img variant="top" src={item.image} />
                    <Card.Body>
                      <Card.Title className="fs-6">{item.name}</Card.Title>
                      <Card.Text className="text-primary fw-bold">
                        ₹{item.price.toLocaleString()}
                      </Card.Text>
                      <Button variant="outline-primary" size="sm" block>
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default ProductDetails;