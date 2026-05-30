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
import { getProductById, createProductReview, deleteProductReview, saveCartToLocalStorage, getCartFromLocalStorage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProduct = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await getProductById(id);
      setProduct(data.data || data);
      if (showLoader) setLoading(false);
      
      // TODO: Fetch related products based on category
      // For now, we'll use a mock
      setRelatedProducts([
        { _id: '1', name: 'Related Product 1', price: 999, image: 'https://via.placeholder.com/150' },
        { _id: '2', name: 'Related Product 2', price: 1499, image: 'https://via.placeholder.com/150' },
      ]);
      
    } catch (err) {
      console.error('Error fetching product:', err);
      setError('Product not found or server error');
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct(true);
    }
  }, [id]);

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await createProductReview(product._id, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      setRating(5);
      fetchProduct(false); // reload product without full screen loading spinner
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReviewHandler = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteProductReview(product._id, reviewId);
        toast.success('Review deleted successfully');
        fetchProduct(false); // reload product details
      } catch (err) {
        toast.error(err.message || 'Failed to delete review');
      }
    }
  };

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
                        <FaStar 
                          key={star} 
                          size={16} 
                          className="me-1" 
                          color={star <= (product.rating || 0) ? '#ffc107' : '#e4e5e9'}
                        />
                      ))}
                    </div>
                    <span className="text-muted">
                      ({(product.rating || 0).toFixed(1)} • {product.numReviews || 0} {product.numReviews === 1 ? 'review' : 'reviews'})
                    </span>
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
                <Tab eventKey="reviews" title={`Reviews (${product.numReviews || 0})`}>
                  <div className="p-3">
                    <Row>
                      <Col md={6} className="mb-4">
                        <h4 className="mb-4">Customer Reviews</h4>
                        {!product.reviews || product.reviews.length === 0 ? (
                          <Alert variant="info">No reviews yet. Be the first to review!</Alert>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {product.reviews.map((review) => (
                              <Card key={review._id} className="border-0 bg-light shadow-sm">
                                <Card.Body className="p-3">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <strong>{review.name}</strong>
                                    <small className="text-muted">
                                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </small>
                                  </div>
                                  <div className="text-warning mb-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <FaStar 
                                        key={star} 
                                        size={14} 
                                        color={star <= review.rating ? '#ffc107' : '#e4e5e9'}
                                        className="me-1"
                                      />
                                    ))}
                                  </div>
                                  <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line' }}>
                                    {review.comment}
                                  </p>
                                  {user && (user._id === review.user || user.role === 'admin') && (
                                    <div className="text-end mt-2">
                                      <Button 
                                        variant="link" 
                                        className="text-danger p-0 text-decoration-none" 
                                        size="sm"
                                        onClick={() => deleteReviewHandler(review._id)}
                                      >
                                        Delete Review
                                      </Button>
                                    </div>
                                  )}
                                </Card.Body>
                              </Card>
                            ))}
                          </div>
                        )}
                      </Col>

                      <Col md={6}>
                        <h4 className="mb-4">Write a Review</h4>
                        {user ? (
                          product.reviews?.some((r) => r.user?.toString() === user?._id?.toString()) ? (
                            <Alert variant="success">
                              You have already reviewed this product. Thank you!
                            </Alert>
                          ) : (
                            <Form onSubmit={submitReviewHandler} className="bg-light p-4 rounded shadow-sm">
                              <Form.Group className="mb-3" controlId="review-rating">
                                <Form.Label className="fw-bold">Rating</Form.Label>
                                <Form.Select 
                                  value={rating} 
                                  onChange={(e) => setRating(Number(e.target.value))}
                                  className="w-auto"
                                >
                                  <option value="5">5 - Excellent</option>
                                  <option value="4">4 - Very Good</option>
                                  <option value="3">3 - Good</option>
                                  <option value="2">2 - Fair</option>
                                  <option value="1">1 - Poor</option>
                                </Form.Select>
                              </Form.Group>

                              <Form.Group className="mb-3" controlId="review-comment">
                                <Form.Label className="fw-bold">Review Comment</Form.Label>
                                <Form.Control 
                                  as="textarea" 
                                  rows={4} 
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  placeholder="Share your thoughts about this product..."
                                  required
                                />
                              </Form.Group>

                              <Button 
                                type="submit" 
                                variant="primary" 
                                disabled={submittingReview}
                                className="fw-bold px-4 py-2"
                              >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                              </Button>
                            </Form>
                          )
                        ) : (
                          <Alert variant="warning">
                            Please <a href="/login" className="alert-link">login</a> to write a review.
                          </Alert>
                        )}
                      </Col>
                    </Row>
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