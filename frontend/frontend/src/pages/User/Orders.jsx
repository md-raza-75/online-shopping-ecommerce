import React, { useState, useEffect } from 'react';
import { 
  Container, Table, Button, Badge, Card, Alert, 
  Row, Col, Modal, Spinner, Dropdown 
} from 'react-bootstrap';
import { 
  FaShoppingBag, FaEye, FaRupeeSign, FaCalendarAlt, 
  FaTruck, FaCheckCircle, FaTimesCircle, FaClock, 
  FaBox, FaDownload, FaFilePdf, FaEllipsisV, FaPrint 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getMyOrders, downloadInvoice } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo) {
        navigate('/login');
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
      'confirmed': { variant: 'info', icon: <FaCheckCircle />, text: 'Confirmed' },
      'processing': { variant: 'info', icon: <FaBox />, text: 'Processing' },
      'shipped': { variant: 'primary', icon: <FaTruck />, text: 'Shipped' },
      'delivered': { variant: 'success', icon: <FaCheckCircle />, text: 'Delivered' },
      'cancelled': { variant: 'danger', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1 py-2 px-3">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const getPaymentBadge = (status, method, orderStatus) => {
    // ✅ IMPORTANT FIX: If order is delivered and payment method is COD, show "Paid"
    if (orderStatus === 'delivered' && method === 'COD') {
      return <Badge bg="success" className="py-2 px-3">✅ Paid (on Delivery)</Badge>;
    }
    
    if (status === 'completed') {
      return <Badge bg="success" className="py-2 px-3">✅ Paid</Badge>;
    } else if (status === 'failed') {
      return <Badge bg="danger" className="py-2 px-3">❌ Failed</Badge>;
    } else if (method === 'COD') {
      return <Badge bg="info" className="py-2 px-3">💵 Cash on Delivery</Badge>;
    } else {
      return <Badge bg="warning" className="py-2 px-3">⏳ Pending</Badge>;
    }
  };

  // ✅ IMPORTANT FIX: Determine if invoice can be downloaded
  const canDownloadInvoice = (order) => {
    // Admin ne paid mark kiya ho
    if (order.paymentStatus === 'completed') {
      return true;
    }
    // COD order delivered ho (payment auto-completed)
    if (order.paymentMethod === 'COD' && order.orderStatus === 'delivered') {
      return true;
    }
    // Admin ho (admin sab download kar sakta hai)
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.role === 'admin') {
      return true;
    }
    return false;
  };

  const handleDownloadInvoice = async (orderId, e) => {
    if (e) e.stopPropagation();
    
    try {
      setDownloadingId(orderId);
      
      const response = await downloadInvoice(orderId);
      
      // Create blob from response
      const blob = response.data;
      
      // Get order for filename
      const order = orders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoice?.invoiceNumber || `INV-${orderId.slice(-6)}`;
      const fileName = `ShopEasy-Invoice-${invoiceNumber}.pdf`;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('✅ Invoice downloaded successfully!');
      
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.message?.includes('payment is completed') || error.message?.includes('will be available')) {
        toast.info('📄 Invoice will be available after payment is completed');
      } else if (error.message?.includes('Access denied')) {
        toast.error('🔒 You are not authorized to download this invoice');
      } else if (error.message?.includes('Order not found')) {
        toast.error('❌ Order not found');
      } else if (error.message?.includes('login')) {
        toast.error('🔑 Please login to download invoice');
        navigate('/login');
      } else {
        toast.error(`❌ ${error.message || 'Failed to download invoice'}`);
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <PageLoader />;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold">
            <FaShoppingBag className="me-2" />
            My Orders
          </h1>
          <p className="text-muted mb-0">View and manage all your orders</p>
        </div>
        <Badge bg="primary" pill className="fs-6 px-3 py-2">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </Badge>
      </div>

      {error ? (
        <Alert variant="danger">
          <Alert.Heading>Error Loading Orders</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchOrders}>
            Try Again
          </Button>
        </Alert>
      ) : orders.length === 0 ? (
        <Card className="text-center py-5 shadow-sm border-0">
          <Card.Body>
            <div className="mb-4">
              <FaShoppingBag size={80} className="text-muted opacity-50" />
            </div>
            <h4 className="mb-3">No Orders Yet</h4>
            <p className="text-muted mb-4">
              You haven't placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              Start Shopping
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm border-0 overflow-hidden">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-4 py-3">Order ID</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Items</th>
                    <th className="py-3">Total</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Payment</th>
                    <th className="pe-4 py-3 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr 
                      key={order._id} 
                      style={{ cursor: 'pointer' }} 
                      onClick={() => viewOrderDetails(order)}
                      className="border-bottom"
                    >
                      <td className="ps-4 py-3">
                        <div>
                          <small className="text-muted d-block">Order</small>
                          <strong className="text-primary">#{order._id?.slice(-8)?.toUpperCase() || 'N/A'}</strong>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <FaCalendarAlt className="me-2 text-muted" size={14} />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center">
                          <FaBox className="me-2 text-muted" size={14} />
                          <span className="fw-medium">{order.items?.length || 0} items</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center fw-bold">
                          <FaRupeeSign className="me-1" size={12} />
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </td>
                      <td className="py-3">{getStatusBadge(order.orderStatus)}</td>
                      <td className="py-3">
                        <div className="d-flex flex-column gap-1">
                          {getPaymentBadge(order.paymentStatus, order.paymentMethod, order.orderStatus)}
                          <small className="text-muted">
                            {order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Online'}
                          </small>
                        </div>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <div className="d-flex justify-content-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => viewOrderDetails(order)}
                            className="d-flex align-items-center gap-2"
                            title="View Details"
                          >
                            <FaEye size={12} />
                            <span className="d-none d-md-inline">View</span>
                          </Button>
                          
                          {/* ✅ FIXED: Show download button for delivered COD orders OR paid orders */}
                          {canDownloadInvoice(order) && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={(e) => handleDownloadInvoice(order._id, e)}
                              disabled={downloadingId === order._id}
                              className="d-flex align-items-center gap-2"
                              title="Download Invoice"
                            >
                              {downloadingId === order._id ? (
                                <>
                                  <Spinner size="sm" animation="border" />
                                  <span className="d-none d-md-inline">Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <FaDownload size={12} />
                                  <span className="d-none d-md-inline">Invoice</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
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
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered scrollable>
        {selectedOrder && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold">
                <FaShoppingBag className="me-2" />
                Order Details
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              {/* Order Info */}
              <Row className="mb-4">
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order ID</small>
                    <strong className="text-primary">#{selectedOrder._id?.slice(-8)?.toUpperCase()}</strong>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order Date</small>
                    <strong>{formatDate(selectedOrder.createdAt)}</strong>
                  </div>
                  {selectedOrder.invoice?.invoiceNumber && (
                    <div className="mb-3">
                      <small className="text-muted d-block">Invoice Number</small>
                      <strong>{selectedOrder.invoice.invoiceNumber}</strong>
                    </div>
                  )}
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <small className="text-muted d-block">Order Status</small>
                    <div className="mt-1">{getStatusBadge(selectedOrder.orderStatus)}</div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted d-block">Payment Status</small>
                    <div className="mt-1">{getPaymentBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod, selectedOrder.orderStatus)}</div>
                  </div>
                  {selectedOrder.deliveredAt && (
                    <div className="mb-3">
                      <small className="text-muted d-block">Delivered On</small>
                      <strong>{formatDate(selectedOrder.deliveredAt)}</strong>
                    </div>
                  )}
                </Col>
              </Row>

              <hr className="my-4" />

              {/* Order Items */}
              <h6 className="mb-3 fw-bold">📦 Order Items</h6>
              <div className="table-responsive mb-4">
                <Table size="sm" className="table-hover">
                  <thead className="bg-light">
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
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                className="rounded me-2"
                              />
                            )}
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="text-center align-middle">{item.quantity}</td>
                        <td className="text-end align-middle">{formatCurrency(item.price)}</td>
                        <td className="text-end align-middle fw-bold">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Order Summary */}
              <Row>
                <Col md={6}>
                  <h6 className="mb-3 fw-bold">🏠 Shipping Address</h6>
                  <Card className="bg-light border-0">
                    <Card.Body className="p-3">
                      <p className="mb-1 fw-medium">{selectedOrder.shippingAddress?.name}</p>
                      <p className="mb-1">{selectedOrder.shippingAddress?.address}</p>
                      <p className="mb-1">
                        {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}
                      </p>
                      <p className="mb-0">{selectedOrder.shippingAddress?.country}</p>
                      <hr className="my-2" />
                      <p className="mb-0">
                        📞 Phone: {selectedOrder.shippingAddress?.phone}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <h6 className="mb-3 fw-bold">💰 Order Summary</h6>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-3">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      
                      {selectedOrder.taxAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span>Tax (18% GST)</span>
                          <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between mb-2">
                        <span>Shipping</span>
                        <span className={selectedOrder.shippingAmount === 0 ? "text-success fw-bold" : ""}>
                          {selectedOrder.shippingAmount === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingAmount)}
                        </span>
                      </div>
                      
                      {selectedOrder.discountAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2 text-success">
                          <span>Discount</span>
                          <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="fs-5">Total Amount</strong>
                        <strong className="fs-4 text-primary">
                          {formatCurrency(
                            (selectedOrder.totalAmount || 0) + 
                            (selectedOrder.taxAmount || 0) + 
                            (selectedOrder.shippingAmount || 0) - 
                            (selectedOrder.discountAmount || 0)
                          )}
                        </strong>
                      </div>
                      
                      <div className="mt-3 small text-muted">
                        <p className="mb-1">
                          <strong>Payment Method:</strong> {selectedOrder.paymentMethod}
                        </p>
                        <p className="mb-0">
                          <strong>Payment Status:</strong> {selectedOrder.paymentStatus}
                          {selectedOrder.orderStatus === 'delivered' && selectedOrder.paymentMethod === 'COD' && ' (Auto-paid on delivery)'}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Admin Notes */}
              {selectedOrder.adminNotes && (
                <div className="mt-4">
                  <h6 className="mb-2 fw-bold">📝 Admin Notes</h6>
                  <Alert variant="info" className="mb-0">
                    {selectedOrder.adminNotes}
                  </Alert>
                </div>
              )}

              {/* Tracking Info */}
              {(selectedOrder.trackingNumber || selectedOrder.courierName) && (
                <div className="mt-4">
                  <h6 className="mb-2 fw-bold">🚚 Tracking Information</h6>
                  <Card className="border-0 bg-light">
                    <Card.Body className="p-3">
                      {selectedOrder.courierName && (
                        <p className="mb-1">
                          <strong>Courier:</strong> {selectedOrder.courierName}
                        </p>
                      )}
                      {selectedOrder.trackingNumber && (
                        <p className="mb-0">
                          <strong>Tracking Number:</strong> {selectedOrder.trackingNumber}
                        </p>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="outline-secondary" onClick={() => setShowDetails(false)}>
                Close
              </Button>
              
              {/* ✅ FIXED: Show download button if invoice can be downloaded */}
              {canDownloadInvoice(selectedOrder) && (
                <Button 
                  variant="primary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadInvoice(selectedOrder._id, e);
                  }}
                  disabled={downloadingId === selectedOrder._id}
                  className="d-flex align-items-center gap-2"
                >
                  {downloadingId === selectedOrder._id ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FaFilePdf />
                      Download Invoice
                    </>
                  )}
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