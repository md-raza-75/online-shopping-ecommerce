import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaShoppingBag, FaHome, FaFilePdf } from 'react-icons/fa';
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
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Download function
  const handleDownloadInvoice = async () => {
    if (!order) return;
    
    try {
      setDownloading(true);
      
      // Download invoice
      const response = await downloadInvoice(orderId);
      
      // Create blob
      const blob = response.data;
      
      // Generate filename
      const invoiceNumber = order.invoice?.invoiceNumber || `Invoice-${order._id}`;
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
      
      toast.success('Invoice downloaded successfully!');
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Show specific error messages
      if (error.message.includes('payment is completed')) {
        toast.info('Invoice will be available after payment is completed');
      } else if (error.message.includes('Access denied')) {
        toast.error('You are not authorized to download this invoice');
      } else if (error.message.includes('Order not found')) {
        toast.error('Order not found');
      } else if (error.message.includes('login')) {
        toast.error('Please login to download invoice');
        navigate('/login');
      } else {
        toast.error(error.message || 'Failed to download invoice');
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
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
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
                    <p><strong>Order ID:</strong> {order.orderId || order._id}</p>
                    <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>
                    <p><strong>Total Amount:</strong> ₹{order.totalAmount?.toLocaleString()}</p>
                    <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Payment Status:</strong> 
                      <span className="ms-2">{getPaymentBadge(order.paymentStatus)}</span>
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
                    Download your invoice receipt.
                  </p>
                  
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={handleDownloadInvoice}
                    disabled={downloading}
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
                        Download Invoice PDF
                      </>
                    )}
                  </Button>
                  
                  <div className="text-start mt-3">
                    <p className="mb-1 small text-muted">Invoice includes:</p>
                    <ul className="small text-muted mb-0">
                      <li>Product details with prices</li>
                      <li>Tax calculation (18% GST)</li>
                      <li>Payment method and status</li>
                      <li>Complete shipping address</li>
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
        </Col>
      </Row>
    </Container>
  );
};

export default CheckoutSuccess;