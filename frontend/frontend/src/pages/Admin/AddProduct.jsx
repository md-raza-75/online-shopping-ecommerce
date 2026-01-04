import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { FaPlusCircle, FaUpload, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createProduct } from '../../services/api';

const AddProduct = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Clothing',
    image: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState('');

  const categories = ['Clothing', 'Electronics', 'Home', 'Books', 'Beauty', 'Sports', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Preview image URL
    if (name === 'image') {
      setPreviewImage(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Product description is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return;
    }
    
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('Valid stock quantity is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      await createProduct(productData);
      
      toast.success('Product added successfully!');
      navigate('/admin');
      
    } catch (err) {
      console.error('Error adding product:', err);
      setError(typeof err === 'string' ? err : 'Failed to add product. Please try again.');
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex align-items-center mb-4">
        <Button variant="outline-secondary" as={Link} to="/admin" className="me-3">
          <FaArrowLeft className="me-2" />
          Back
        </Button>
        <h1 className="h3 fw-bold mb-0">
          <FaPlusCircle className="me-2" />
          Add New Product
        </h1>
      </div>

      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4 p-md-5">
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Product Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        required
                        className="py-2"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="py-2"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label>Price (₹) *</Form.Label>
                          <Form.Control
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-4">
                          <Form.Label>Stock Quantity *</Form.Label>
                          <Form.Control
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            placeholder="0"
                            min="0"
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>

                  <Col lg={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Product Image URL</Form.Label>
                      <div className="input-group">
                        <Form.Control
                          type="url"
                          name="image"
                          value={formData.image}
                          onChange={handleChange}
                          placeholder="https://example.com/image.jpg"
                          className="py-2"
                        />
                        <Button variant="outline-secondary">
                          <FaUpload />
                        </Button>
                      </div>
                      <Form.Text className="text-muted">
                        Enter a valid image URL or upload an image
                      </Form.Text>
                      
                      {previewImage && (
                        <div className="mt-3">
                          <Form.Label>Preview</Form.Label>
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="img-fluid rounded border"
                            style={{ maxHeight: '200px' }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                            }}
                          />
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter detailed product description..."
                    required
                    className="py-2"
                  />
                </Form.Group>

                <div className="d-flex justify-content-between pt-3">
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to="/admin"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="px-4"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Adding Product...
                      </>
                    ) : (
                      <>
                        <FaPlusCircle className="me-2" />
                        Add Product
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
          
          {/* Sample Image URLs */}
          <Card className="shadow-sm border-0 mt-4">
            <Card.Body>
              <h6 className="mb-3">Sample Image URLs for Testing:</h6>
              <div className="d-flex flex-wrap gap-2">
                {[
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
                  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w-400',
                  'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w-400',
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w-400'
                ].map((url, index) => (
                  <Button
                    key={index}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, image: url }));
                      setPreviewImage(url);
                    }}
                  >
                    Use Sample {index + 1}
                  </Button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddProduct;