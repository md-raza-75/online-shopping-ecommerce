import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaTrash, FaShoppingCart, FaStar, FaShoppingBag } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getWishlist, toggleWishlist, addToCart } from '../services/api';
import Loader from '../components/Loader';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist();
      setWishlist(res.data || []);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId);
      setWishlist(wishlist.filter(item => item._id !== productId));
      toast.success('Item removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (product) => {
    if (product.stock <= 0) {
      toast.warning('Product is out of stock');
      return;
    }
    addToCart(product, 1);
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`${product.name} added to cart!`);
  };

  if (loading) return <Loader />;

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <FaHeart className="text-danger" /> My Wishlist
          </h2>
          <p className="text-muted mb-0">Saved items you love</p>
        </div>
        <Badge bg="primary" className="fs-6 px-3 py-2">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
        </Badge>
      </div>

      {wishlist.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0 rounded-4">
          <Card.Body>
            <div className="mb-3">
              <FaHeart className="text-muted" size={64} style={{ opacity: 0.3 }} />
            </div>
            <h4 className="fw-bold text-dark">Your wishlist is empty</h4>
            <p className="text-muted mb-4">Explore items and save your favorites here!</p>
            <Button as={Link} to="/products" variant="primary" size="lg" className="rounded-pill px-4">
              <FaShoppingBag className="me-2" /> Start Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {wishlist.map((product) => (
            <Col key={product._id}>
              <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden product-card position-relative">
                <Button
                  variant="light"
                  className="position-absolute top-0 end-0 m-2 rounded-circle shadow-sm p-2 text-danger border-0"
                  style={{ zIndex: 10 }}
                  onClick={() => handleRemove(product._id)}
                  title="Remove from wishlist"
                >
                  <FaTrash size={14} />
                </Button>
                <div style={{ height: '200px', overflow: 'hidden' }} className="bg-light d-flex align-items-center justify-content-center">
                  <Card.Img
                    variant="top"
                    src={product.image || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    style={{ objectFit: 'contain', maxHeight: '180px' }}
                  />
                </div>
                <Card.Body className="d-flex flex-column justify-content-between p-3">
                  <div>
                    <Badge bg="secondary" className="mb-2 text-uppercase" style={{ fontSize: '0.7rem' }}>
                      {product.category || 'General'}
                    </Badge>
                    <Card.Title as={Link} to={`/product/${product._id}`} className="text-dark text-decoration-none fw-semibold fs-6 text-truncate d-block mb-1">
                      {product.name}
                    </Card.Title>
                    <div className="d-flex align-items-center gap-1 mb-2">
                      <FaStar className="text-warning" size={12} />
                      <span className="small fw-semibold">{product.rating || 4.5}</span>
                      <span className="text-muted small">({product.numReviews || 0})</span>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex align-items-center justify-content-between my-2">
                      <span className="fs-5 fw-bold text-primary">₹{product.price?.toLocaleString()}</span>
                      {product.stock <= 0 ? (
                        <Badge bg="danger">Out of Stock</Badge>
                      ) : (
                        <Badge bg="success">In Stock</Badge>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      className="w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      <FaShoppingCart /> Add to Cart
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Wishlist;
