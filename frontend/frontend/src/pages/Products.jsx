import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import { getProducts } from '../services/api';
import { Link } from 'react-router-dom';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data.data || data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-5 text-danger">{error}</div>;
  }

  return (
    <Container className="py-4">
      <h1 className="mb-4">All Products</h1>
      
      <Row>
        {products.length === 0 ? (
          <Col>
            <div className="text-center py-5">
              <h4>No products found</h4>
              <p>Check back later for new products!</p>
            </div>
          </Col>
        ) : (
          products.map((product) => (
            <Col key={product._id} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={product.image || 'https://via.placeholder.com/300x200'}
                  alt={product.name}
                  style={{ height: '200px', objectFit: 'cover' }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{product.name}</Card.Title>
                  <Card.Text className="text-muted">
                    {product.description?.substring(0, 80)}...
                  </Card.Text>
                  <div className="mt-auto">
                    <h5 className="text-primary">₹{product.price}</h5>
                    <Link to={`/product/${product._id}`}>
                      <Button variant="primary" className="w-100">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default Products;