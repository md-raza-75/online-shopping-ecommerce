import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaArrowLeft, FaSave } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getProductById, updateProduct, deleteProduct } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Clothing',
    image: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const categories = ['Clothing', 'Electronics', 'Home', 'Books', 'Beauty', 'Sports', 'Other'];

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }

      const data = await getProductById(id);
      const productData = data.data || data;
      
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || '',
        stock: productData.stock || '',
        category: productData.category || 'Clothing',
        image: productData.image || '',
        isActive: productData.isActive !== false
      });
      setPreviewImage(productData.image || '');
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Product not found');
      setLoading(false);
      toast.error('Failed to load product');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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

    setUpdating(true);
    setError('');

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      };

      await updateProduct(id, productData);
      
      toast.success('Product updated successfully!');
      navigate('/admin');
      
    } catch (err) {
      console.error('Error updating product:', err);
      setError(typeof err === 'string' ? err : 'Failed to update product. Please try again.');
      toast.error('Failed to update product');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully!');
      setShowDeleteModal(false);
      navigate('/admin');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (loading) return <PageLoader />;

  if (error && !product) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
        <div className="text-center">
          <Button variant="outline-primary" onClick={() => navigate('/admin')}>
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center">
          <Button variant="outline-secondary" as={Link} to="/admin" className="me-3">
            <FaArrowLeft className="me-2" />
            Back
          </Button>
          <h1 className="h3 fw-bold mb-0">
            <FaEdit className="me-2" />
            Edit Product
          </h1>
        </div>
        <Button
          variant="outline-danger"
          onClick={() => setShowDeleteModal(true)}
          className="d-flex align-items-center"
        >
          <FaTrash className="me-2" />
          Delete Product
        </Button>
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

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <Badge bg="secondary" className="me-2">
                      ID: {product._id.substring(0, 8)}
                    </Badge>
                    <Badge bg={formData.isActive ? "success" : "danger"}>
                      {formData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <small className="text-muted">
                    Created: {new Date(product.createdAt).toLocaleDateString()}
                  </small>
                </div>
              </div>

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
                            min="0"
                            required
                            className="py-2"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Check
                        type="checkbox"
                        name="isActive"
                        label="Product is Active"
                        checked={formData.isActive}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col lg={6}>
                    <Form.Group className="mb-4">
                      <Form.Label>Product Image URL</Form.Label>
                      <Form.Control
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="py-2"
                      />
                      
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
                    required
                    className="py-2"
                  />
                </Form.Group>

                <div className="d-flex justify-content-between pt-3">
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to="/admin"
                    disabled={updating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={updating}
                    className="px-4"
                  >
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Update Product
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <h6>Are you sure you want to delete this product?</h6>
            <p className="mb-0">
              <strong>{product.name}</strong>
            </p>
            <p className="mb-0 text-muted">
              This action cannot be undone. All associated data will be permanently removed.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <FaTrash className="me-2" />
            Delete Product
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EditProduct;