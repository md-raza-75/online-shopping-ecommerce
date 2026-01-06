import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaShoppingBag, FaHome, FaFilePdf, FaRupeeSign, FaTruck, FaEnvelope } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOrderById, downloadInvoice } from '../services/api';

const CheckoutSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasAutoDownloaded, setHasAutoDownloaded] = useState(false);
  
  // ✅ FIX: Use refs to track mounts and prevent re-renders
  const hasFetched = useRef(false);
  const hasAutoDownloadTriggered = useRef(false);

  useEffect(() => {
    // ✅ FIX: Prevent multiple fetches
    if (hasFetched.current) return;
    
    const initializeOrder = async () => {
      if (orderId) {
        await fetchOrderDetails();
      } else if (order) {
        setLoading(false);
      } else {
        setLoading(false);
        toast.error('No order found');
        navigate('/');
      }
    };

    initializeOrder();
    
    // ✅ FIX: Auto-download ONLY for COD and ONLY once
    const autoDownloadForCOD = () => {
      if (
        !hasAutoDownloadTriggered.current && 
        order?.paymentMethod === 'COD' && 
        !hasAutoDownloaded
      ) {
        hasAutoDownloadTriggered.current = true;
        
        // Small delay for better UX
        setTimeout(() => {
          handleDownloadInvoice(true);
        }, 2000);
      }
    };

    // If order is already available from location state
    if (order && order.paymentMethod === 'COD') {
      autoDownloadForCOD();
    }

    return () => {
      hasFetched.current = true;
    };
  }, [orderId, order, hasAutoDownloaded]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      console.log('📦 Fetching order details for:', orderId);
      
      const response = await getOrderById(orderId);
      setOrder(response.data);
      
      console.log('✅ Order fetched:', response.data.paymentMethod);
      
      // ✅ Auto-download for COD orders
      if (response.data.paymentMethod === 'COD' && !hasAutoDownloadTriggered.current) {
        hasAutoDownloadTriggered.current = true;
        
        setTimeout(() => {
          handleDownloadInvoice(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('❌ Fetch order error:', error);
      toast.error('Failed to fetch order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Manual download function
  const handleDownloadInvoice = async (isAuto = false) => {
    try {
      setDownloading(true);
      
      // Determine which order ID to use
      const idToUse = orderId || order?._id;
      
      if (!idToUse) {
        toast.error('No order found to download invoice');
        return;
      }

      console.log('📥 Downloading invoice for order:', idToUse);
      
      // Download invoice
      const response = await downloadInvoice(idToUse);
      
      if (!response || !response.data) {
        throw new Error('No PDF data received from server');
      }

      // Create blob from response
      const blob = response.data;
      
      // Generate filename
      const invoiceNumber = order?.invoice?.invoiceNumber || `INV-${orderId?.slice(-6) || 'ORDER'}`;
      const fileName = `ShopEasy-Invoice-${invoiceNumber}.pdf`;
      
      // ✅ FIXED: Better download method
      const downloadBlob = (blobData, filename) => {
        // Method 1: Create object URL
        const url = window.URL.createObjectURL(blobData);
        
        // Method 2: Create a temporary link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Add to document
        document.body.appendChild(link);
        
        // Trigger download
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      };
      
      // Download the blob
      downloadBlob(blob, fileName);
      
      if (!isAuto) {
        toast.success('✅ Invoice downloaded successfully!');
      } else {
        console.log('✅ Invoice auto-downloaded for COD order');
        setHasAutoDownloaded(true);
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      
      // Don't show toast for auto-download failures
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
    if (status === 'completed') {
      return <Badge bg="success">Paid</Badge>;
    } else if (status === 'failed') {
      return <Badge bg="danger">Failed</Badge>;
    } else {
      return <Badge bg="warning">Pending</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  // No order found
  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Order Not Found</h4>
          <p>The order you are looking for does not exist or has been removed.</p>
          <Button variant="primary" onClick={() => navigate('/orders')}>
            View My Orders
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/')} className="ms-2">
            Go to Home
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="border-success shadow">
            <Card.Body className="text-center">
              {/* Success Header */}
              <div className="mb-4">
                <FaCheckCircle size={80} className="text-success mb-3" />
                <h2 className="text-success mb-2">🎉 Order Confirmed!</h2>
                <p className="lead text-muted">
                  Thank you for your purchase, <strong>{order.user?.name || order.shippingAddress?.name || 'Customer'}</strong>!
                </p>
              </div>
              
              {/* Success Message */}
              <Alert variant="success" className="text-start">
                <h5 className="mb-3">✅ Your order has been placed successfully!</h5>
                <p className="mb-2">
                  {order.paymentMethod === 'COD' 
                    ? '💵 Cash on Delivery selected. Please keep cash ready for delivery.'
                    : '💳 Payment processed successfully.'
                  }
                </p>
                <p className="mb-0">
                  <FaEnvelope className="me-2" />
                  Order confirmation has been sent to your email.
                </p>
              </Alert>
              
              {/* Order Details */}
              <Card className="mt-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">📋 Order Details</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">Order ID:</strong>
                        <p className="mb-0">
                          <Badge bg="secondary" className="ms-2">
                            {order._id?.slice(-8)?.toUpperCase() || 'N/A'}
                          </Badge>
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">Order Date:</strong>
                        <p className="mb-0">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">Total Amount:</strong>
                        <p className="mb-0 h5 text-primary">
                          {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <strong className="text-muted">Payment Method:</strong>
                        <p className="mb-0">
                          <Badge bg={order.paymentMethod === 'COD' ? 'warning' : 'success'}>
                            {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                          </Badge>
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong className="text-muted">Payment Status:</strong>
                        <p className="mb-0">
                          <span className="ms-2">{getPaymentBadge(order.paymentStatus)}</span>
                        </p>
                      </div>
                      {order.invoice?.invoiceNumber && (
                        <div className="mb-3">
                          <strong className="text-muted">Invoice No:</strong>
                          <p className="mb-0">{order.invoice.invoiceNumber}</p>
                        </div>
                      )}
                    </Col>
                  </Row>
                  
                  <div className="mt-3">
                    <strong className="text-muted">📦 Delivery Address:</strong>
                    <p className="mb-0">
                      {order.shippingAddress?.address}, {order.shippingAddress?.city} - {order.shippingAddress?.postalCode}
                    </p>
                    <small className="text-muted">📞 Phone: {order.shippingAddress?.phone}</small>
                  </div>
                </Card.Body>
              </Card>
              
              {/* ✅ FIXED: Download Invoice Section */}
              <Card className="mt-4">
                <Card.Body>
                  <h5 className="mb-3">
                    <FaFilePdf className="me-2 text-danger" />
                    📄 Download Invoice
                  </h5>
                  
                  {order.paymentMethod === 'COD' && hasAutoDownloaded && (
                    <Alert variant="info" className="mb-3">
                      <FaDownload className="me-2" />
                      <strong>Invoice Auto-Downloaded!</strong>
                      <p className="mb-0 mt-1 small">
                        Your invoice has been automatically downloaded to your "Downloads" folder.
                        {downloading && ' Downloading...'}
                      </p>
                    </Alert>
                  )}
                  
                  <div className="d-grid gap-2">
                    <Button 
                      variant={order.paymentMethod === 'COD' ? 'outline-primary' : 'primary'}
                      size="lg"
                      onClick={() => handleDownloadInvoice(false)}
                      disabled={downloading}
                      className="w-100"
                    >
                      {downloading ? (
                        <>
                          <Spinner size="sm" animation="border" className="me-2" />
                          Downloading Invoice...
                        </>
                      ) : (
                        <>
                          <FaDownload className="me-2" />
                          {hasAutoDownloaded ? 'Download Invoice Again' : 'Download Invoice PDF'}
                        </>
                      )}
                    </Button>
                    
                    <small className="text-muted text-center">
                      Click above to download your order invoice
                    </small>
                  </div>
                  
                  <div className="text-start mt-3">
                    <p className="mb-2 small text-muted"><strong>📋 Invoice includes:</strong></p>
                    <ul className="small text-muted mb-0">
                      <li>✅ Product details with prices</li>
                      <li>✅ Tax calculation (18% GST)</li>
                      <li>✅ Shipping charges</li>
                      <li>✅ Payment method and status</li>
                      <li>✅ Complete shipping address</li>
                      <li>✅ Order number and date</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Order Summary */}
              <div className="mt-5">
                <h5 className="mb-3">🛒 Order Summary</h5>
                <Card className="border">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Product</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end">Price</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.name || 'Product'}</td>
                                <td className="text-center">{item.quantity || 1}</td>
                                <td className="text-end">{formatCurrency(item.price || 0)}</td>
                                <td className="text-end">{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="text-center text-muted py-3">
                                No items found in this order
                              </td>
                            </tr>
                          )}
                          {/* Totals */}
                          <tr className="bg-light">
                            <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                            <td className="text-end">
                              <strong>{formatCurrency(order.totalAmount - (order.taxAmount || 0) - (order.shippingAmount || 0))}</strong>
                            </td>
                          </tr>
                          {order.taxAmount > 0 && (
                            <tr className="bg-light">
                              <td colSpan="3" className="text-end"><strong>Tax (18% GST):</strong></td>
                              <td className="text-end">
                                <strong>{formatCurrency(order.taxAmount)}</strong>
                              </td>
                            </tr>
                          )}
                          <tr className="bg-light">
                            <td colSpan="3" className="text-end"><strong>Shipping:</strong></td>
                            <td className="text-end">
                              <strong className={order.shippingAmount === 0 ? "text-success" : ""}>
                                {order.shippingAmount === 0 ? 'FREE' : formatCurrency(order.shippingAmount)}
                              </strong>
                            </td>
                          </tr>
                          <tr className="table-primary">
                            <td colSpan="3" className="text-end"><strong>Total Amount:</strong></td>
                            <td className="text-end">
                              <strong>{formatCurrency(order.totalAmount)}</strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Next Steps */}
              <Alert variant="info" className="mt-4 text-start">
                <h6><FaTruck className="me-2" />🚚 What Happens Next?</h6>
                <ul className="mb-0">
                  <li>📧 You will receive order confirmation via email/SMS</li>
                  <li>📞 Our team will contact you for delivery details</li>
                  <li>📱 Track your order in "My Orders" section</li>
                  <li>⏰ Estimated delivery: 3-5 business days</li>
                  <li>❓ For queries: support@shopeasy.com or call 1800-123-456</li>
                </ul>
              </Alert>
              
              {/* Action Buttons */}
              <div className="d-grid gap-2 d-md-flex justify-content-center mt-4">
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/orders')}
                  className="me-2"
                >
                  <FaShoppingBag className="me-2" />
                  View My Orders
                </Button>
                
                <Button 
                  variant="primary" 
                  onClick={() => navigate('/')}
                >
                  <FaHome className="me-2" />
                  Continue Shopping
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutSuccess;