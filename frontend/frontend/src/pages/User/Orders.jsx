import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Form, Button as BSButton, Badge } from 'react-bootstrap';
import { 
  FaShoppingBag, FaEye, FaRupeeSign, FaCalendarAlt, 
  FaTruck, FaCheckCircle, FaTimesCircle, FaClock, 
  FaBox, FaDownload, FaFilePdf, FaTimes, FaBan, FaUndo
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { getMyOrders, downloadInvoice, cancelOrder, requestReturn } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Cancel & Return states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

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
      setError('Failed to load orders. Please try again.');
      setLoading(false);
      toast.error('Unable to load orders');
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      setCancelling(true);
      await cancelOrder(selectedOrder._id, cancelReason);
      toast.success('Order cancelled successfully');
      setShowCancelModal(false);
      setShowDetails(false);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!selectedOrder) return;
    if (!returnReason.trim()) {
      toast.warning('Please enter a reason for return');
      return;
    }
    try {
      setReturning(true);
      await requestReturn(selectedOrder._id, returnReason);
      toast.success('Return request submitted successfully!');
      setShowReturnModal(false);
      setShowDetails(false);
      setReturnReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to submit return request');
    } finally {
      setReturning(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'badge-warning', icon: <FaClock />, text: 'Pending' },
      'confirmed': { variant: 'badge-info', icon: <FaCheckCircle />, text: 'Confirmed' },
      'processing': { variant: 'badge-info', icon: <FaBox />, text: 'Processing' },
      'shipped': { variant: 'badge-primary', icon: <FaTruck />, text: 'Shipped' },
      'delivered': { variant: 'badge-success', icon: <FaCheckCircle />, text: 'Delivered' },
      'cancelled': { variant: 'badge-danger', icon: <FaTimesCircle />, text: 'Cancelled' }
    };
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    return (
      <span className={`premium-badge ${config.variant} px-3 py-2 d-inline-flex align-items-center gap-2`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const getPaymentBadge = (status, method, orderStatus) => {
    if (orderStatus === 'delivered' && method === 'COD') {
      return <span className="premium-badge badge-success px-3 py-2">✅ Paid (on Delivery)</span>;
    }
    if (status === 'completed') {
      return <span className="premium-badge badge-success px-3 py-2">✅ Paid</span>;
    } else if (status === 'failed') {
      return <span className="premium-badge badge-danger px-3 py-2">❌ Failed</span>;
    } else if (method === 'COD') {
      return <span className="premium-badge badge-info px-3 py-2">💵 Cash on Delivery</span>;
    } else {
      return <span className="premium-badge badge-warning px-3 py-2">⏳ Pending</span>;
    }
  };

  const canDownloadInvoice = (order) => {
    if (!order) return false;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.role === 'admin') return true;
    return order.orderStatus === 'delivered';
  };

  const handleDownloadInvoice = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(orderId);
      const response = await downloadInvoice(orderId);
      const blob = response.data;
      const order = orders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoice?.invoiceNumber || `INV-${orderId.slice(-6)}`;
      const fileName = `ShopEasy-Invoice-${invoiceNumber}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      toast.success('✅ Invoice downloaded successfully!');
    } catch (error) {
      toast.error(`❌ ${error.message || 'Failed to download invoice'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  const renderTrackingTimeline = (status) => {
    if (status === 'cancelled') {
      return (
        <div className="alert alert-danger rounded-4 py-3 text-center my-3 fw-bold d-flex align-items-center justify-content-center gap-2">
          <FaTimesCircle size={20} /> Order Cancelled
        </div>
      );
    }

    const steps = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(status);

    return (
      <div className="my-4 px-2">
        <h6 className="fw-bold text-uppercase text-muted mb-3">Order Status Tracking</h6>
        <div className="position-relative d-flex justify-content-between align-items-center">
          <div 
            className="position-absolute top-50 start-0 translate-middle-y bg-primary" 
            style={{ 
              height: '4px', 
              width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%`,
              transition: 'width 0.4s ease',
              zIndex: 1
            }} 
          />
          <div 
            className="position-absolute top-50 start-0 translate-middle-y bg-light" 
            style={{ height: '4px', width: '100%', zIndex: 0 }} 
          />

          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <div key={step} className="text-center position-relative" style={{ zIndex: 2 }}>
                <div 
                  className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-1 ${
                    isCompleted ? 'bg-primary text-white' : 'bg-light text-muted border'
                  }`}
                  style={{ width: '36px', height: '36px', fontWeight: 'bold' }}
                >
                  {isCompleted ? <FaCheckCircle size={16} /> : idx + 1}
                </div>
                <small className={`fw-semibold text-capitalize ${isCurrent ? 'text-primary fw-bold' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                  {step}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container py-5">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="d-flex flex-wrap justify-content-between align-items-center mb-5"
      >
        <div>
          <h1 className="h2 fw-bold gradient-text d-flex align-items-center gap-3">
            <FaShoppingBag /> My Orders
          </h1>
          <p className="text-muted mb-0">View and track all your orders</p>
        </div>
        <div className="premium-badge badge-primary px-4 py-2 fs-5 mt-3 mt-md-0">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
        </div>
      </motion.div>

      {error ? (
        <div className="alert alert-danger d-inline-block rounded-4 p-4 shadow-sm text-center w-100">
          <h4 className="fw-bold">Error Loading Orders</h4>
          <p>{error}</p>
          <button className="btn-premium mt-2" onClick={fetchOrders}>Try Again</button>
        </div>
      ) : orders.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card text-center py-5 shadow-sm"
        >
          <div className="mb-4">
            <FaShoppingBag size={80} className="text-muted opacity-50" />
          </div>
          <h3 className="fw-bold text-dark mb-3">No Orders Yet</h3>
          <p className="text-muted mb-4 lead mx-auto" style={{ maxWidth: '500px' }}>
            Looks like you haven't placed any orders yet. Explore our marketplace today!
          </p>
          <Link to="/products" className="btn-premium px-5 py-3 d-inline-block text-decoration-none">Start Shopping</Link>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel overflow-hidden"
        >
          <div className="table-responsive">
            <table className="table table-hover table-premium mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-4 text-muted fw-bold">Order ID</th>
                  <th className="py-4 text-muted fw-bold">Date</th>
                  <th className="py-4 text-muted fw-bold">Items</th>
                  <th className="py-4 text-muted fw-bold">Total</th>
                  <th className="py-4 text-muted fw-bold">Status</th>
                  <th className="py-4 text-muted fw-bold">Payment</th>
                  <th className="pe-4 py-4 text-end text-muted fw-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {orders.map((order, index) => (
                    <motion.tr 
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="ps-4 py-4">
                        <small className="text-muted d-block fw-bold text-uppercase">Order</small>
                        <strong className="text-primary">#{order._id?.slice(-8)?.toUpperCase()}</strong>
                      </td>
                      <td className="py-4">
                        <div className="d-flex align-items-center fw-bold text-dark">
                          <FaCalendarAlt className="me-2 text-muted" /> {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="d-flex align-items-center fw-bold text-dark">
                          <FaBox className="me-2 text-muted" /> {order.items?.length || 0} items
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="d-flex align-items-center fw-bold text-dark">
                          <FaRupeeSign className="me-1 text-muted" /> {formatCurrency(order.totalAmount)}
                        </div>
                      </td>
                      <td className="py-4">{getStatusBadge(order.orderStatus)}</td>
                      <td className="py-4">
                        <div className="d-flex flex-column gap-2 align-items-start">
                          {getPaymentBadge(order.paymentStatus, order.paymentMethod, order.orderStatus)}
                          <small className="text-muted fw-bold">
                            {order.paymentMethod === 'COD' ? 'Pay on delivery' : 'Online'}
                          </small>
                        </div>
                      </td>
                      <td className="pe-4 py-4 text-end">
                        <div className="d-flex justify-content-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-primary"
                            style={{ width: '40px', height: '40px' }}
                            onClick={() => { setSelectedOrder(order); setShowDetails(true); }}
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                          
                          {canDownloadInvoice(order) ? (
                            <button
                              className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-success"
                              style={{ width: '40px', height: '40px' }}
                              onClick={(e) => handleDownloadInvoice(order._id, e)}
                              disabled={downloadingId === order._id}
                              title="Download Invoice"
                            >
                              {downloadingId === order._id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <FaDownload size={16} />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Order Details Modal */}
      <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg" centered>
        {selectedOrder && (
          <div className="glass-card border-0 overflow-hidden" style={{ borderRadius: '20px' }}>
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom bg-light">
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2">
                <FaShoppingBag className="text-primary" /> Order #{selectedOrder._id?.slice(-8)?.toUpperCase()}
              </h4>
              <button className="btn btn-light rounded-circle p-2" onClick={() => setShowDetails(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {renderTrackingTimeline(selectedOrder.orderStatus)}

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold text-muted mb-3 text-uppercase">Order Info</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Order ID:</span>
                      <strong className="text-dark">#{selectedOrder._id?.slice(-8)?.toUpperCase()}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Date:</span>
                      <strong className="text-dark">{formatDate(selectedOrder.createdAt)}</strong>
                    </div>
                    {selectedOrder.invoice?.invoiceNumber && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Invoice:</span>
                        <strong className="text-dark">{selectedOrder.invoice.invoiceNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold text-muted mb-3 text-uppercase">Status</h6>
                    <div className="mb-3 d-flex align-items-center justify-content-between">
                      <span className="text-muted">Order:</span>
                      {getStatusBadge(selectedOrder.orderStatus)}
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Payment:</span>
                      {getPaymentBadge(selectedOrder.paymentStatus, selectedOrder.paymentMethod, selectedOrder.orderStatus)}
                    </div>
                  </div>
                </div>
              </div>

              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2"><FaBox className="text-muted" /> Order Items</h5>
              <div className="table-responsive mb-4 rounded-4 border overflow-hidden">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 text-center">Qty</th>
                      <th className="py-3 text-end">Price</th>
                      <th className="py-3 px-4 text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4">
                          <div className="d-flex align-items-center gap-3">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="rounded" style={{ width: '48px', height: '48px', objectFit: 'cover' }} />
                            )}
                            <div>
                              <span className="fw-bold d-block">{item.name}</span>
                              {item.seller && (
                                <small className="text-muted">Seller: {item.seller.storeName || item.seller.name || 'Marketplace Seller'}</small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center align-middle fw-bold">{item.quantity}</td>
                        <td className="py-3 text-end align-middle text-muted">{formatCurrency(item.price)}</td>
                        <td className="py-3 px-4 text-end align-middle fw-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap gap-2 justify-content-end mb-4">
                {selectedOrder.orderStatus === 'pending' && (
                  <BSButton 
                    variant="outline-danger" 
                    className="rounded-pill px-4"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <FaBan className="me-2" /> Cancel Order
                  </BSButton>
                )}

                {selectedOrder.orderStatus === 'delivered' && !selectedOrder.returnRequest?.requested && (
                  <BSButton 
                    variant="outline-warning" 
                    className="rounded-pill px-4 text-dark"
                    onClick={() => setShowReturnModal(true)}
                  >
                    <FaUndo className="me-2" /> Request Return
                  </BSButton>
                )}

                {selectedOrder.returnRequest?.requested && (
                  <Badge bg="info" className="p-3 rounded-3 fs-6">
                    Return Request: {selectedOrder.returnRequest.status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 border-top bg-light d-flex justify-content-end gap-3">
              <button className="btn btn-light border px-4 fw-bold text-muted" onClick={() => setShowDetails(false)}>
                Close
              </button>
              {canDownloadInvoice(selectedOrder) && (
                <button 
                  className="btn-premium px-4 py-2"
                  onClick={(e) => handleDownloadInvoice(selectedOrder._id, e)}
                  disabled={downloadingId === selectedOrder._id}
                >
                  {downloadingId === selectedOrder._id ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span> Downloading...</>
                  ) : (
                    <><FaFilePdf className="me-2" /> Download Invoice</>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger">Cancel Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this order?</p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Reason for cancellation (optional):</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="Tell us why you are cancelling..." 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <BSButton variant="light" onClick={() => setShowCancelModal(false)}>Back</BSButton>
          <BSButton variant="danger" onClick={handleCancelOrder} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </BSButton>
        </Modal.Footer>
      </Modal>

      {/* Request Return Modal */}
      <Modal show={showReturnModal} onHide={() => setShowReturnModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-warning text-dark">Request Item Return</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Return requests can be submitted within 7 days of delivery.</p>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Reason for Return *</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              placeholder="Damaged item, wrong size, defective product..." 
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <BSButton variant="light" onClick={() => setShowReturnModal(false)}>Cancel</BSButton>
          <BSButton variant="warning" onClick={handleRequestReturn} disabled={returning}>
            {returning ? 'Submitting...' : 'Submit Return Request'}
          </BSButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Orders;