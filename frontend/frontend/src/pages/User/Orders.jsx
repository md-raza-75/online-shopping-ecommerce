import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Card, Alert, Row, Col, Modal } from 'react-bootstrap';
import { 
  FaShoppingBag, 
  FaEye, 
  FaRupeeSign, 
  FaCalendarAlt, 
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBox
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getMyOrders } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo) {
        window.location.href = '/login';
        return;
      }

      const data = await getMyOrders();
      setOrders(data.data || data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      setLoading(false);
      toast.error('Unable to load orders');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'warning', icon: <FaClock />, text: 'Pending' },
      'processing': { variant: 'info', icon: <FaBox />, text: 'Processing' },
      'shipped': { variant: 'primary', icon: <FaTruck />, text: 'Shipped' },
      'delivered': { variant: 'success', icon: <FaCheckCircle />, text: 'Delivered' },
      'cancelled': { variant: 'danger', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    
    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
    );
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

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) return <PageLoader />;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">
          <FaShoppingBag className="me-2" />
          My Orders
        </h1>
        <Badge bg="primary" pill>
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </Badge>
      </div>

      {error ? (
        <Alert variant="danger">{error}</Alert>
      ) : orders.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body>
            <div className="mb-4">
              <FaShoppingBag size={64} className="text-muted" />
            </div>
            <h4 className="mb-3">No Orders Yet</h4>
            <p className="text-muted mb-4">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button variant="primary" href="/">
              Start Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4">Order ID</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th className="pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td className="ps-4">
                        <small className="text-muted">#</small>
                        <strong>{order._id.substring(0, 8)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-muted" size={14} />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaBox className="me-2 text-muted" size={14} />
                          {order.items?.length || 0} items
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaRupeeSign className="me-1" size={12} />
                          <strong>{order.totalAmount?.toLocaleString() || '0'}</strong>
                        </div>
                      </td>
                      <td>{getStatusBadge(order.orderStatus)}</td>
                      <td>{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="pe-4">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => viewOrderDetails(order)}
                          className="d-flex align-items-center gap-1"
                        >
                          <FaEye size={12} />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Order Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        {selectedOrder && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title>Order Details</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order ID</small>
                    <strong>{selectedOrder._id}</strong>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order Date</small>
                    <strong>{formatDate(selectedOrder.createdAt)}</strong>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order Status</small>
                    <div className="mt-1">{getStatusBadge(selectedOrder.orderStatus)}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Payment Status</small>
                    <div className="mt-1">{getPaymentBadge(selectedOrder.paymentStatus)}</div>
                  </div>
                </Col>
              </Row>

              <hr />

              <h6 className="mb-3">Order Items</h6>
              <div className="table-responsive mb-4">
                <Table size="sm">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">₹{item.price.toLocaleString()}</td>
                        <td className="text-end">₹{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <Row>
                <Col md={6}>
                  <h6 className="mb-3">Shipping Address</h6>
                  <Card className="bg-light border-0">
                    <Card.Body className="p-3">
                      <p className="mb-1">
                        <strong>{selectedOrder.shippingAddress?.address}</strong>
                      </p>
                      <p className="mb-1">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}
                      </p>
                      <p className="mb-0">{selectedOrder.shippingAddress?.country}</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <h6 className="mb-3">Order Summary</h6>
                  <div className="bg-light p-3 rounded">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>₹{selectedOrder.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Shipping</span>
                      <span className={selectedOrder.totalAmount >= 999 ? "text-success" : ""}>
                        {selectedOrder.totalAmount >= 999 ? 'FREE' : '₹100'}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tax (18% GST)</span>
                      <span>₹{(selectedOrder.totalAmount * 0.18).toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between">
                      <strong>Total</strong>
                      <strong className="h5 mb-0">
                        ₹{(selectedOrder.totalAmount + (selectedOrder.totalAmount >= 999 ? 0 : 100) + (selectedOrder.totalAmount * 0.18)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="outline-secondary" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              {selectedOrder.orderStatus === 'delivered' && (
                <Button variant="primary">
                  Download Invoice
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default Orders;