import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import { 
  FaShoppingBag, FaEye, FaRupeeSign, FaCalendarAlt, 
  FaTruck, FaCheckCircle, FaTimesCircle, FaClock, 
  FaBox, FaDownload, FaFilePdf, FaTimes
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
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
      setError('Failed to load orders. Please try again.');
      setLoading(false);
      toast.error('Unable to load orders');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
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
          <p className="text-muted mb-0">View and manage all your recent orders</p>
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
            Looks like you haven't placed any orders yet. Explore our premium collection and treat yourself today!
          </p>
          <Link to="/" className="btn-premium px-5 py-3 d-inline-block text-decoration-none">Start Shopping</Link>
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
                          ) : (
                            <span 
                              className="d-inline-flex align-items-center gap-1 text-muted px-2 py-1 small rounded-3 bg-light border opacity-75"
                              title="Invoice PDF available once order is delivered"
                            >
                              <FaFilePdf size={12} className="text-secondary" />
                              <small style={{ fontSize: '0.75rem' }}>Available on Delivery</small>
                            </span>
                          )}
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
                <FaShoppingBag className="text-primary" /> Order Details
              </h4>
              <button className="btn btn-light rounded-circle p-2" onClick={() => setShowDetails(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                    {selectedOrder.deliveredAt && (
                      <div className="d-flex justify-content-between mt-3 pt-3 border-top">
                        <span className="text-muted">Delivered On:</span>
                        <strong className="text-dark">{formatDate(selectedOrder.deliveredAt)}</strong>
                      </div>
                    )}
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
                            <span className="fw-bold">{item.name}</span>
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

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold mb-3 text-uppercase text-muted">Shipping Address</h6>
                    <p className="fw-bold text-dark mb-1">{selectedOrder.shippingAddress?.name}</p>
                    <p className="text-muted mb-1">{selectedOrder.shippingAddress?.address}</p>
                    <p className="text-muted mb-2">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
                    <p className="text-muted mb-3">{selectedOrder.shippingAddress?.country}</p>
                    <div className="pt-3 border-top">
                      <p className="mb-0 fw-bold d-flex align-items-center gap-2 text-dark">
                        📞 {selectedOrder.shippingAddress?.phone}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="p-4 rounded-4 border h-100" style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}>
                    <h6 className="fw-bold mb-3 text-uppercase text-muted">Order Summary</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Subtotal</span>
                      <span className="fw-bold text-dark">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    {selectedOrder.taxAmount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Tax (18% GST)</span>
                        <span className="fw-bold text-dark">{formatCurrency(selectedOrder.taxAmount)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Shipping</span>
                      <span className={selectedOrder.shippingAmount === 0 ? "text-success fw-bold" : "fw-bold text-dark"}>
                        {selectedOrder.shippingAmount === 0 ? 'FREE' : formatCurrency(selectedOrder.shippingAmount)}
                      </span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="d-flex justify-content-between mb-3 text-success">
                        <span>Discount</span>
                        <span className="fw-bold">-{formatCurrency(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    
                    <hr className="my-3 opacity-25" />
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <strong className="fs-5 text-dark">Total Amount</strong>
                      <strong className="fs-4 gradient-text fw-bold">
                        {formatCurrency(
                          (selectedOrder.totalAmount || 0) + 
                          (selectedOrder.taxAmount || 0) + 
                          (selectedOrder.shippingAmount || 0) - 
                          (selectedOrder.discountAmount || 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.adminNotes && (
                <div className="mt-4 p-4 rounded-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                  <h6 className="fw-bold text-primary mb-2 text-uppercase d-flex align-items-center gap-2">
                    📝 Admin Notes
                  </h6>
                  <p className="mb-0 text-dark">{selectedOrder.adminNotes}</p>
                </div>
              )}

              {(selectedOrder.trackingNumber || selectedOrder.courierName) && (
                <div className="mt-4 p-4 rounded-4 bg-light border">
                  <h6 className="fw-bold mb-3 text-uppercase text-muted d-flex align-items-center gap-2">
                    🚚 Tracking Information
                  </h6>
                  <div className="d-flex flex-wrap gap-4">
                    {selectedOrder.courierName && (
                      <div>
                        <span className="text-muted d-block small mb-1">Courier</span>
                        <strong className="text-dark">{selectedOrder.courierName}</strong>
                      </div>
                    )}
                    {selectedOrder.trackingNumber && (
                      <div>
                        <span className="text-muted d-block small mb-1">Tracking Number</span>
                        <strong className="text-dark">{selectedOrder.trackingNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-top bg-light d-flex justify-content-end gap-3">
              <button className="btn btn-light border px-4 fw-bold text-muted" onClick={() => setShowDetails(false)}>
                Close
              </button>
              {canDownloadInvoice(selectedOrder) ? (
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
              ) : (
                <button 
                  className="btn btn-light border px-4 py-2 text-muted fw-semibold" 
                  disabled
                  title="Invoice PDF will be unlocked once order is delivered by admin"
                >
                  <FaFilePdf className="me-2 text-secondary" /> Available Once Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;