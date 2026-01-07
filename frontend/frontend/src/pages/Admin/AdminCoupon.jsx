import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form,
  Modal, Alert, Badge, Spinner, InputGroup
} from 'react-bootstrap';
import {
  FaPlus, FaEdit, FaTrash, FaEye, FaTag,
  FaPercentage, FaRupeeSign, FaCalendarAlt,
  FaUsers, FaCheck, FaTimes, FaSearch
} from 'react-icons/fa';
import { toast } from 'react-toastify';
// ✅ CORRECT IMPORT PATH
import {
  getCoupons, createCoupon, updateCoupon,
  deleteCoupon
} from '../../services/api'; // Changed from "../services/api" to "../../services/api"

const AdminCoupon = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    expiryDate: '',
    maxUsage: '3',
    isActive: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getCoupons();
      setCoupons(response.data || response);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
      setLoading(false);
    }
  };

  const handleShowModal = (type = 'add', coupon = null) => {
    setModalType(type);
    setSelectedCoupon(coupon);
    
    if (type === 'edit' && coupon) {
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscount: coupon.maxDiscount || '',
        expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
        maxUsage: coupon.maxUsage,
        isActive: coupon.isActive
      });
    } else {
      // Reset form for add
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        expiryDate: '',
        maxUsage: '3',
        isActive: true
      });
    }
    
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCoupon(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.code.trim()) errors.code = 'Coupon code is required';
    if (!formData.discountValue || formData.discountValue <= 0) errors.discountValue = 'Discount value is required';
    if (!formData.minOrderAmount || formData.minOrderAmount < 0) errors.minOrderAmount = 'Minimum order amount is required';
    if (!formData.expiryDate) errors.expiryDate = 'Expiry date is required';
    if (!formData.maxUsage || formData.maxUsage <= 0) errors.maxUsage = 'Maximum usage is required';
    
    if (formData.discountType === 'percentage') {
      if (formData.discountValue > 100) errors.discountValue = 'Percentage cannot exceed 100%';
    }
    
    // Check if expiry date is in the future
    if (formData.expiryDate) {
      const expiry = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiry <= today) {
        errors.expiryDate = 'Expiry date must be in the future';
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSubmitting(true);
    
    try {
      const couponData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        maxUsage: parseInt(formData.maxUsage),
        expiryDate: new Date(formData.expiryDate).toISOString()
      };
      
      if (modalType === 'add') {
        await createCoupon(couponData);
        toast.success('Coupon created successfully!');
      } else {
        await updateCoupon(selectedCoupon._id, couponData);
        toast.success('Coupon updated successfully!');
      }
      
      fetchCoupons();
      handleCloseModal();
    } catch (error) {
      console.error('Save coupon error:', error);
      toast.error(error.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(couponId);
        toast.success('Coupon deleted successfully!');
        fetchCoupons();
      } catch (error) {
        console.error('Delete coupon error:', error);
        toast.error(error.message || 'Failed to delete coupon');
      }
    }
  };

  const getStatusBadge = (coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    const isUsedUp = coupon.usedCount >= coupon.maxUsage;
    
    if (!coupon.isActive) {
      return <Badge bg="secondary">Inactive</Badge>;
    } else if (isUsedUp) {
      return <Badge bg="danger">Used Up</Badge>;
    } else if (isExpired) {
      return <Badge bg="warning">Expired</Badge>;
    } else {
      return <Badge bg="success">Active</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      coupon.code.toLowerCase().includes(searchLower) ||
      (coupon.description && coupon.description.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Container fluid className="px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">
          <FaTag className="me-2" />
          Coupon Management
        </h1>
        <Button
          variant="primary"
          onClick={() => handleShowModal('add')}
        >
          <FaPlus className="me-2" />
          Add New Coupon
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-3">
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              variant="outline-secondary"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </Button>
          </InputGroup>
        </Card.Body>
      </Card>

      {/* Coupons Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading coupons...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 py-3">Coupon Code</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Discount</th>
                    <th className="py-3">Min. Order</th>
                    <th className="py-3">Usage</th>
                    <th className="py-3">Expiry</th>
                    <th className="py-3">Status</th>
                    <th className="pe-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => (
                    <tr key={coupon._id}>
                      <td className="ps-4 align-middle">
                        <div className="fw-bold">
                          <FaTag className="me-2 text-primary" />
                          {coupon.code}
                        </div>
                        <small className="text-muted">
                          Created: {formatDate(coupon.createdAt)}
                        </small>
                      </td>
                      <td className="align-middle">
                        {coupon.description || '-'}
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          {coupon.discountType === 'percentage' ? (
                            <FaPercentage className="me-1 text-success" />
                          ) : (
                            <FaRupeeSign className="me-1 text-success" />
                          )}
                          <span className="fw-bold">
                            {coupon.discountValue}
                            {coupon.discountType === 'percentage' ? '%' : ''}
                          </span>
                          {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                            <small className="text-muted ms-1">
                              (Max: ₹{coupon.maxDiscount})
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="align-middle">
                        ₹{coupon.minOrderAmount}
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <FaUsers className="me-2 text-info" />
                          <span>
                            {coupon.usedCount || 0}/{coupon.maxUsage}
                          </span>
                        </div>
                        <small className="text-muted">
                          {coupon.maxUsage - (coupon.usedCount || 0)} remaining
                        </small>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-warning" />
                          {formatDate(coupon.expiryDate)}
                        </div>
                        <small className="text-muted">
                          {coupon.remainingDays > 0 ? (
                            <span className="text-success">
                              {coupon.remainingDays} days left
                            </span>
                          ) : (
                            <span className="text-danger">
                              Expired
                            </span>
                          )}
                        </small>
                      </td>
                      <td className="align-middle">
                        {getStatusBadge(coupon)}
                      </td>
                      <td className="pe-4 align-middle">
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleShowModal('edit', coupon)}
                            className="me-1"
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(coupon._id)}
                            title="Delete"
                            disabled={coupon.usedCount > 0}
                          >
                            <FaTrash size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredCoupons.length === 0 && (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <FaTag size={48} className="text-muted opacity-25 mb-3" />
                        <h5 className="text-muted">No coupons found</h5>
                        <p className="text-muted">
                          {searchTerm ? 'Try a different search term' : 'Create your first coupon'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Coupon Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTag className="me-2" />
            {modalType === 'add' ? 'Add New Coupon' : 'Edit Coupon'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Coupon Code *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., WELCOME20"
                    value={formData.code}
                    onChange={(e) => setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase()
                    })}
                    isInvalid={!!formErrors.code}
                    disabled={modalType === 'edit'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.code}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Unique code for the coupon (uppercase letters and numbers)
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Welcome discount for new users"
                    value={formData.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      description: e.target.value
                    })}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount Type *</Form.Label>
                  <div>
                    <Form.Check
                      inline
                      type="radio"
                      label="Percentage (%)"
                      name="discountType"
                      value="percentage"
                      checked={formData.discountType === 'percentage'}
                      onChange={(e) => setFormData({
                        ...formData,
                        discountType: e.target.value
                      })}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Fixed Amount (₹)"
                      name="discountType"
                      value="fixed"
                      checked={formData.discountType === 'fixed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        discountType: e.target.value
                      })}
                    />
                  </div>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Discount Value *
                    {formData.discountType === 'percentage' ? ' (%)' : ' (₹)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={formData.discountType === 'percentage' ? '20' : '100'}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({
                      ...formData,
                      discountValue: e.target.value
                    })}
                    isInvalid={!!formErrors.discountValue}
                    min="0"
                    step={formData.discountType === 'percentage' ? '1' : '10'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.discountValue}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Order Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({
                      ...formData,
                      minOrderAmount: e.target.value
                    })}
                    isInvalid={!!formErrors.minOrderAmount}
                    min="0"
                    step="50"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.minOrderAmount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Maximum Discount (₹)
                    {formData.discountType === 'percentage' && ' *'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({
                      ...formData,
                      maxDiscount: e.target.value
                    })}
                    min="0"
                    step="50"
                    disabled={formData.discountType !== 'percentage'}
                  />
                  <Form.Text className="text-muted">
                    {formData.discountType === 'percentage' 
                      ? 'Maximum discount amount (optional)' 
                      : 'Only applicable for percentage discounts'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Expiry Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      expiryDate: e.target.value
                    })}
                    isInvalid={!!formErrors.expiryDate}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.expiryDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Usage *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 3"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({
                      ...formData,
                      maxUsage: e.target.value
                    })}
                    isInvalid={!!formErrors.maxUsage}
                    min="1"
                    step="1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {formErrors.maxUsage}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    How many users can use this coupon?
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Active"
                checked={formData.isActive}
                onChange={(e) => setFormData({
                  ...formData,
                  isActive: e.target.checked
                })}
              />
            </Form.Group>
            
            {/* Preview Card */}
            <Card className="mt-3 border-primary">
              <Card.Header className="bg-primary text-white">
                <FaEye className="me-2" />
                Coupon Preview
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      <FaTag className="me-2" />
                      {formData.code || 'COUPONCODE'}
                    </h5>
                    <p className="mb-0 text-muted small">
                      {formData.description || 'No description'}
                    </p>
                  </div>
                  <div className="text-end">
                    <h4 className="text-success mb-1">
                      {formData.discountValue || '0'}
                      {formData.discountType === 'percentage' ? '% OFF' : '₹ OFF'}
                    </h4>
                    <p className="mb-0 small">
                      Min. order: ₹{formData.minOrderAmount || '0'}
                    </p>
                  </div>
                </div>
                <hr />
                <div className="row small">
                  <div className="col-6">
                    <p className="mb-1">
                      <FaUsers className="me-1" />
                      Max usage: {formData.maxUsage || '3'} users
                    </p>
                  </div>
                  <div className="col-6 text-end">
                    <p className="mb-1">
                      <FaCalendarAlt className="me-1" />
                      Expires: {formData.expiryDate || 'Not set'}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaCheck className="me-2" />
                  {modalType === 'add' ? 'Create Coupon' : 'Update Coupon'}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default AdminCoupon;