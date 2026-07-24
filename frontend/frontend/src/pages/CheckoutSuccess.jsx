import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaShoppingBag, FaHome, FaFilePdf, FaRupeeSign, FaTruck, FaEnvelope, FaCreditCard } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOrderById, downloadInvoice } from '../services/api';
import { PageLoader } from '../components/Loader';

const CheckoutSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);

  const hasFetched = useRef(false);
  const hasAutoDownloadTriggered = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    if (orderId) {
      fetchOrderDetails();
    } else if (location.state?.order) {
      setLoading(false);
    } else {
      setLoading(false);
      toast.error('No order found');
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await getOrderById(orderId);
      const orderData = response.data ?? response;
      setOrder(orderData);
    } catch (error) {
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (isAuto = false) => {
    try {
      setDownloading(true);
      const idToUse = orderId || order?._id;
      if (!idToUse) {
        toast.error('No order found to download invoice');
        return;
      }

      const response = await downloadInvoice(idToUse);
      if (!response || !response.data) throw new Error('No PDF data received from server');
      const blob = response.data;
      const invoiceNumber = order?.invoice?.invoiceNumber || `INV-${orderId?.slice(-6) || 'ORDER'}`;
      const fileName = `ShopEasy-Invoice-${invoiceNumber}.pdf`;

      const downloadBlob = (blobData, filename) => {
        const url = window.URL.createObjectURL(blobData);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      };

      downloadBlob(blob, fileName);

      if (!isAuto) {
        toast.success('✅ Invoice downloaded successfully!');
      } else {
        setHasAutoDownloaded(true);
      }
    } catch (error) {
      if (!isAuto) {
        const errorMsg = error.message || 'Failed to download invoice';
        if (errorMsg.includes('payment is completed') || errorMsg.includes('will be available')) {
          toast.info('📄 Invoice will be available after payment is completed');
        } else if (errorMsg.includes('Access denied')) {
          toast.error('🔒 You are not authorized to download this invoice');
        } else if (errorMsg.includes('Order not found')) {
          toast.error('❌ Order not found');
          navigate('/orders');
        } else if (errorMsg.includes('login')) {
          toast.error('🔑 Please login to download invoice');
          navigate('/login');
        } else {
          toast.error(`❌ ${errorMsg}`);
        }
      }
    } finally {
      setDownloading(false);
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'completed') return <span className="premium-badge badge-success px-3 py-2">✅ Paid</span>;
    if (status === 'failed') return <span className="premium-badge badge-danger px-3 py-2">❌ Failed</span>;
    return <span className="premium-badge badge-warning px-3 py-2">⏳ Pending</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);
  };

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card py-5 max-w-lg mx-auto">
          <FaCheckCircle size={80} className="text-muted opacity-25 mb-4" />
          <h3 className="fw-bold text-dark mb-3">Order Not Found</h3>
          <p className="text-muted mb-4">The order you are looking for does not exist or has been removed.</p>
          <div className="d-flex justify-content-center gap-3">
            <button className="btn-premium px-4" onClick={() => navigate('/orders')}>View My Orders</button>
            <button className="btn btn-light border px-4" onClick={() => navigate('/')}>Go to Home</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card border-0 overflow-hidden"
          >
            {/* Header Success Section */}
            <div className="bg-primary bg-opacity-10 text-center py-5 border-bottom border-primary border-opacity-25">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="d-inline-block bg-white rounded-circle p-3 shadow-sm mb-4"
              >
                <FaCheckCircle size={60} className="text-success" />
              </motion.div>
              <h2 className="fw-bold text-dark mb-2">🎉 Order Confirmed!</h2>
              <p className="text-muted mb-0 lead">
                Thank you for your purchase, <strong className="text-primary">{order.user?.name || order.shippingAddress?.name || 'Customer'}</strong>!
              </p>
            </div>

            <div className="p-4 p-md-5">
              <div className="alert alert-success d-flex align-items-center gap-3 rounded-4 border-0 shadow-sm mb-5">
                <FaEnvelope size={24} className="text-success flex-shrink-0" />
                <div>
                  <h6 className="fw-bold mb-1">Your order has been placed successfully!</h6>
                  <p className="mb-0 small">
                    {order.paymentMethod === 'COD'
                      ? '💵 Cash on Delivery selected. Please keep cash ready for delivery.'
                      : '💳 Payment processed successfully.'}
                    <br />Order confirmation has been sent to your email.
                  </p>
                </div>
              </div>

              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="text-muted fw-bold mb-4 text-uppercase">Order Details</h6>
                    <div className="mb-3 d-flex justify-content-between">
                      <span className="text-muted">Order ID</span>
                      <strong className="text-dark">#{order._id?.slice(-8)?.toUpperCase() || 'N/A'}</strong>
                    </div>
                    <div className="mb-3 d-flex justify-content-between">
                      <span className="text-muted">Date</span>
                      <strong className="text-dark text-end">{formatDate(order.createdAt)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Total Amount</span>
                      <strong className="text-primary fs-5">{formatCurrency(order.totalAmount)}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="text-muted fw-bold mb-4 text-uppercase">Payment Info</h6>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <span className="text-muted">Method</span>
                      <strong className="text-dark d-flex align-items-center gap-2">
                        <FaCreditCard className="text-muted" />
                        {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                      </strong>
                    </div>
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <span className="text-muted">Status</span>
                      {getPaymentBadge(order.paymentStatus)}
                    </div>
                    {order.invoice?.invoiceNumber && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Invoice No</span>
                        <strong className="text-dark">{order.invoice.invoiceNumber}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-panel p-4 mb-5">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2"><FaShoppingBag className="text-primary" /> Order Summary</h5>
                <div className="table-responsive">
                  <table className="table table-hover table-premium mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="py-3 px-4">Product</th>
                        <th className="text-center py-3">Qty</th>
                        <th className="text-end py-3 px-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <tr key={index}>
                            <td className="py-3 px-4">
                              <div className="d-flex align-items-center gap-3">
                                {item.image && <img src={item.image} alt={item.name} className="rounded" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />}
                                <span className="fw-bold text-dark">{item.name || 'Product'}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 fw-bold">{item.quantity || 1}</td>
                            <td className="text-end py-3 px-4 fw-bold text-primary">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="3" className="text-center text-muted py-4">No items found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 pt-4 border-top">
                  <div className="row justify-content-end">
                    <div className="col-md-6 col-lg-5">
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Subtotal</span>
                        <strong className="text-dark">{formatCurrency(order.totalAmount - (order.taxAmount || 0) - (order.shippingAmount || 0))}</strong>
                      </div>
                      {order.taxAmount > 0 && (
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-muted">Tax (18% GST)</span>
                          <strong className="text-dark">{formatCurrency(order.taxAmount)}</strong>
                        </div>
                      )}
                      <div className="d-flex justify-content-between mb-3">
                        <span className="text-muted">Shipping</span>
                        <strong className={order.shippingAmount === 0 ? "text-success" : "text-dark"}>
                          {order.shippingAmount === 0 ? 'FREE' : formatCurrency(order.shippingAmount)}
                        </strong>
                      </div>
                      <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                        <strong className="text-dark fs-5">Total</strong>
                        <strong className="gradient-text fs-4 fw-bold">{formatCurrency(order.totalAmount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row g-4 mb-5">
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2"><FaTruck className="text-muted" /> Delivery Address</h6>
                    <p className="fw-bold text-dark mb-1">{order.shippingAddress?.name}</p>
                    <p className="text-muted mb-1">{order.shippingAddress?.address}</p>
                    <p className="text-muted mb-2">{order.shippingAddress?.city} - {order.shippingAddress?.postalCode}</p>
                    <p className="text-muted mb-0">📞 Phone: {order.shippingAddress?.phone}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 bg-primary bg-opacity-10 rounded-4 border border-primary border-opacity-25 h-100 d-flex flex-column justify-content-center">
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2 text-primary"><FaFilePdf /> Invoice</h6>
                    {order.paymentMethod === 'COD' && hasAutoDownloaded && (
                      <p className="small text-muted mb-3">Invoice auto-downloaded to your device.</p>
                    )}
                    <button
                      className="btn-premium w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                      onClick={() => handleDownloadInvoice(false)}
                      disabled={downloading}
                    >
                      {downloading ? <span className="spinner-border spinner-border-sm"></span> : <FaDownload />}
                      {hasAutoDownloaded ? 'Download Again' : 'Download Invoice'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <button className="btn-premium-outline px-4 py-2" onClick={() => navigate('/orders')}>
                  <FaShoppingBag className="me-2" /> View My Orders
                </button>
                <button className="btn btn-light border fw-bold text-muted px-4 py-2" onClick={() => navigate('/')}>
                  <FaHome className="me-2" /> Continue Shopping
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;