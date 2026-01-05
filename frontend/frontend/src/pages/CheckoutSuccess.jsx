import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaShoppingBag, FaHome, FaFilePdf, FaBox, FaTruck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getOrderById, downloadInvoice } from '../services/api';

const CheckoutSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    
    try {
      setDownloading(true);
      
      const response = await downloadInvoice(orderId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Generate filename
      const invoiceNumber = order.invoice?.invoiceNumber || `Invoice-${order._id}`;
      const fileName = `${invoiceNumber}.pdf`;
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success('Invoice downloaded successfully!');
      
    } catch (error) {
      console.error('Download error:', error);
      
      if (error.response?.status === 400) {
        toast.info('Invoice will be available after payment is completed');
      } else if (error.response?.status === 403) {
        toast.error('You are not authorized to download this invoice');
      } else {
        toast.error('Failed to download invoice. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { variant: 'warning', icon: <FaBox />, text: 'Pending' },
      'processing': { variant: 'info', icon: <FaBox />, text: 'Processing' },
      'shipped': { variant: 'primary', icon: <FaTruck />, text: 'Shipped' },
      'delivered': { variant: 'success', icon: <FaCheckCircle />, text: 'Delivered' },
      'cancelled': { variant: 'danger', text: 'Cancelled' }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Order Not Found</h4>
          <p>The order you are looking for does not exist.</p>
          <Button variant="primary" onClick={() => navigate('/')}>
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
          {/* Success Card */}
          <Card className="border-success shadow">
            <Card.Body className="text-center">
              <div className="mb-4">
                <FaCheckCircle size={80} className="text-success" />
              </div>
              
              <h2 className="text-success mb-3">Order Confirmed!</h2>
              <p className="lead">
                Thank you for your purchase, <strong>{order.user?.name}</strong>!
              </p>
              
              <Alert variant="success" className="mt-4 text-start">
                <Alert.Heading>Order Details</Alert.Heading>
                <hr />
                <Row>
                  <Col md={6}>
                    <p><strong>Order ID:</strong> {order._id}</p>
                    <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                    <p><strong>Total Amount:</strong> ₹{order.totalAmount?.toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Payment Status:</strong> 
                      <span className="ms-2">{getPaymentBadge(order.paymentStatus)}</span>
                    </p>
                    <p><strong>Order Status:</strong> 
                      <span className="ms-2">{getStatusBadge(order.orderStatus)}</span>
                    </p>
                    {order.invoice?.invoiceNumber && (
                      <p><strong>Invoice No:</strong> {order.invoice.invoiceNumber}</p>
                    )}
                  </Col>
                </Row>
                <p className="mt-2"><strong>Delivery Address:</strong> {order.shippingAddress.address}, {order.shippingAddress.city} - {order.shippingAddress.postalCode}</p>
              </Alert>
              
              {/* Download Invoice Section */}
              <Card className="mt-4">
                <Card.Body>
                  <h5 className="mb-3">
                    <FaFilePdf className="me-2 text-danger" />
                    Download Invoice
                  </h5>
                  <p className="text-muted mb-4">
                    Download your invoice receipt containing all order details, 
                    payment information, and shipping address.
                  </p>
                  
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleDownloadInvoice}
                    disabled={downloading || order.paymentStatus !== 'completed'}
                    className="w-100 mb-3"
                  >
                    {downloading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <FaDownload className="me-2" />
                        {order.paymentStatus === 'completed' ? 'Download Invoice PDF' : 'Invoice Available After Payment'}
                      </>
                    )}
                  </Button>
                  
                  {order.paymentStatus !== 'completed' && (
                    <Alert variant="info" className="text-center">
                      <small>
                        Your invoice will be available for download once payment is completed.
                        {order.paymentMethod === 'COD' && ' For COD orders, invoice is generated immediately.'}
                      </small>
                    </Alert>
                  )}
                  
                  <div className="text-start mt-3">
                    <p className="mb-1 small text-muted">Invoice includes:</p>
                    <ul className="small text-muted mb-0">
                      <li>Product details with prices</li>
                      <li>Tax calculation (18% GST)</li>
                      <li>Payment method and status</li>
                      <li>Complete shipping address</li>
                      <li>Order summary and totals</li>
                    </ul>
                  </div>
                </Card.Body>
              </Card>
              
              {/* Order Summary */}
              <div className="mt-5">
                <h5 className="mb-3">Order Summary:</h5>
                <Card className="border">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <table className="table table-borderless mb-0">
                        <thead className="bg-light">
                          <tr>
                            <th>Product</th>
                            <th className="text-center">Qty</th>
                            <th className="text-end">Price</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, index) => (
                            <tr key={index}>
                              <td>{item.name}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-end">₹{item.price.toFixed(2)}</td>
                              <td className="text-end">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-top">
                          <tr>
                            <td colSpan="3" className="text-end fw-bold">Subtotal:</td>
                            <td className="text-end fw-bold">₹{order.totalAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end">Tax (18%):</td>
                            <td className="text-end">₹{(order.totalAmount * 0.18).toFixed(2)}</td>
                          </tr>
                          <tr className="h5">
                            <td colSpan="3" className="text-end text-primary">Grand Total:</td>
                            <td className="text-end text-primary">₹{(order.totalAmount * 1.18).toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="d-grid gap-2 d-md-flex justify-content-center mt-4">
                <Button 
                  variant="outline-primary" 
                  onClick={() => navigate('/orders')}
                  className="me-2"
                >
                  <FaShoppingBag className="me-2" />
                  View All Orders
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
          
          {/* Additional Info */}
          <Alert variant="info" className="mt-4">
            <Alert.Heading>What's Next?</Alert.Heading>
            <ul className="mb-0">
              <li>You will receive order confirmation via email</li>
              <li>Track your order from "My Orders" section</li>
              <li>Keep your invoice for any future reference</li>
              <li>For any queries, contact: support@shopeasy.com</li>
            </ul>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutSuccess;