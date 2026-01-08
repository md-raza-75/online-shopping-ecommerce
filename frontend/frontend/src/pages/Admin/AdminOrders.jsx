import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Badge, Button,
  Form, Alert, Modal, Dropdown, Spinner
} from 'react-bootstrap';
import {
  FaEye, FaSearch, FaArrowLeft, FaShoppingBag,
  FaFilter, FaDownload, FaPrint, FaSync
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, updateOrderStatus, downloadInvoice } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }

      const data = await getAllOrders();
      const ordersData = Array.isArray(data) ? data : (data.data || []);
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterOrders();
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      
      // ✅ FIX: Send as JSON object, not just string
      const statusData = { orderStatus: newStatus };
      await updateOrderStatus(orderId, statusData);
      
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadInvoice = async (orderId, e) => {
    e.stopPropagation();
    
    try {
      setDownloadingId(orderId);
      const response = await downloadInvoice(orderId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Get order for filename
      const order = orders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoiceNumber || `Invoice-${orderId}`;
      const fileName = `Invoice-${invoiceNumber}.pdf`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'warning',
      'processing': 'info',
      'shipped': 'primary',
      'delivered': 'success',
      'cancelled': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getPaymentBadge = (status) => {
    if (status === 'completed') {
      return <Badge bg="success">Paid</Badge>;
    } else if (status === 'failed') {
      return <Badge bg="danger">Failed</Badge>;
    } else {
      return <Badge bg="warning">Pending</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateOrderTotal = (order) => {
    if (order.totalAmount) return order.totalAmount;
    
    if (order.items && Array.isArray(order.items)) {
      return order.items.reduce((total, item) => {
        return total + (item.price || 0) * (item.quantity || 1);
      }, 0);
    }
    
    return 0;
  };

  if (loading) return <PageLoader />;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" as={Link} to="/admin" className="me-3">
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h1 className="h3 fw-bold d-inline-block mb-0">
            <FaShoppingBag className="me-2" />
            Manage Orders ({filteredOrders.length})
          </h1>
        </div>
        <Button variant="outline-primary" onClick={fetchOrders}>
          <FaSync className="me-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form onSubmit={handleSearch}>
                <Form.Control
                  type="text"
                  placeholder="Search by Order ID, Customer Name or Email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-2"
                />
              </Form>
            </Col>
            <Col md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button variant="info" className="w-100 py-2" onClick={filterOrders}>
                <FaFilter className="me-2" />
                Filter
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="text-muted">
                        <FaShoppingBag size={48} className="mb-3" />
                        <h5>No orders found</h5>
                        <p>Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <small className="text-muted">#{order._id.substring(0, 8)}</small>
                      </td>
                      <td>
                        <div className="fw-bold">{order.user?.name || 'N/A'}</div>
                        <small className="text-muted">{order.user?.email || ''}</small>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td className="fw-bold">{formatCurrency(calculateOrderTotal(order))}</td>
                      <td>{getStatusBadge(order.orderStatus)}</td>
                      <td>{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                            title="View Details"
                          >
                            <FaEye />
                          </Button>
                          
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-primary" size="sm" id="status-dropdown">
                              Status
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleStatusUpdate(order._id, 'processing')}>
                                Mark as Processing
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusUpdate(order._id, 'shipped')}>
                                Mark as Shipped
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusUpdate(order._id, 'delivered')}>
                                Mark as Delivered
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                className="text-danger"
                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                              >
                                Cancel Order
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                          
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={(e) => handleDownloadInvoice(order._id, e)}
                            disabled={downloadingId === order._id}
                            title="Download Invoice"
                          >
                            {downloadingId === order._id ? (
                              <Spinner size="sm" animation="border" />
                            ) : (
                              <FaDownload />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Order Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h6>Order Information</h6>
                  <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedOrder.orderStatus)}</p>
                </Col>
                <Col md={6}>
                  <h6>Customer Information</h6>
                  <p><strong>Name:</strong> {selectedOrder.user?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p><strong>Payment:</strong> {getPaymentBadge(selectedOrder.paymentStatus)}</p>
                </Col>
              </Row>

              {selectedOrder.shippingAddress && (
                <div className="mb-3">
                  <h6>Shipping Address</h6>
                  <p>{selectedOrder.shippingAddress.address}</p>
                  <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                </div>
              )}

              <div className="mb-3">
                <h6>Order Items</h6>
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td><strong>{formatCurrency(calculateOrderTotal(selectedOrder))}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowDetailsModal(false);
            navigate(`/admin/orders/${selectedOrder?._id}`);
          }}>
            View Full Details
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;