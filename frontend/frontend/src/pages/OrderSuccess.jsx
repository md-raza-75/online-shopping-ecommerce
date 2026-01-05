import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { FaCheckCircle, FaShoppingCart, FaHome, FaPrint, FaDownload, FaRegSmile } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo) {
          navigate('/login');
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`
          }
        };

        const { data } = await axios.get(`/api/orders/${orderId}`, config);
        setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        },
        responseType: 'blob'
      };

      const response = await axios.get(`/api/orders/${orderId}/invoice`, config);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading order details...</p>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Order Not Found</h4>
          <p>The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/orders">
            <Button variant="primary">View My Orders</Button>
          </Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body className="p-5">
              {/* Success Icon */}
              <div className="mb-4">
                <div className="d-inline-block p-4 rounded-circle bg-success bg-opacity-10">
                  <FaCheckCircle size={60} className="text-success" />
                </div>
              </div>

              {/* Success Message */}
              <h1 className="mb-3 fw-bold text-success">Order Confirmed!</h1>
              <p className="lead mb-4">
                Thank you for your purchase, {order.user?.name || 'Customer'}! <FaRegSmile />
              </p>

              {/* Order Details */}
              <div className="border rounded p-4 mb-4 bg-light">
                <Row>
                  <Col md={6} className="mb-3">
                    <h6>Order ID</h6>
                    <p className="fw-bold">{order._id}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6>Order Date</h6>
                    <p className="fw-bold">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6>Total Amount</h6>
                    <p className="h4 fw-bold text-primary">₹{order.totalAmount.toLocaleString()}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6>Payment Status</h6>
                    <Badge bg={order.paymentStatus === 'completed' ? 'success' : 'warning'} className="fs-6">
                      {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                    </Badge>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6>Payment Method</h6>
                    <p className="fw-bold">{order.paymentMethod}</p>
                  </Col>
                  <Col md={6} className="mb-3">
                    <h6>Order Status</h6>
                    <Badge bg="info" className="fs-6">
                      {order.orderStatus || 'Processing'}
                    </Badge>
                  </Col>
                </Row>
              </div>

              {/* Shipping Address */}
              <div className="mb-4">
                <h5 className="mb-3">Shipping Address</h5>
                <Card className="border">
                  <Card.Body className="text-start">
                    <p className="mb-1">
                      <strong>Address:</strong> {order.shippingAddress.address}
                    </p>
                    <p className="mb-1">
                      <strong>City:</strong> {order.shippingAddress.city}
                    </p>
                    <p className="mb-1">
                      <strong>Postal Code:</strong> {order.shippingAddress.postalCode}
                    </p>
                    <p className="mb-0">
                      <strong>Country:</strong> {order.shippingAddress.country || 'India'}
                    </p>
                  </Card.Body>
                </Card>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <h5 className="mb-3">Order Items</h5>
                {order.items && order.items.map((item, index) => (
                  <Card key={index} className="mb-2 border">
                    <Card.Body className="py-2">
                      <Row className="align-items-center">
                        <Col xs={2}>
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="img-fluid rounded"
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          )}
                        </Col>
                        <Col xs={5}>
                          <h6 className="mb-0">{item.name}</h6>
                          <small className="text-muted">Quantity: {item.quantity}</small>
                        </Col>
                        <Col xs={5} className="text-end">
                          <p className="mb-0 fw-bold">₹{item.price.toLocaleString()}</p>
                          <small className="text-muted">Total: ₹{(item.price * item.quantity).toLocaleString()}</small>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </div>

              {/* Next Steps */}
              <Alert variant="info" className="text-start">
                <h5>What's Next?</h5>
                <ul className="mb-0">
                  <li>You'll receive an order confirmation email shortly</li>
                  <li>Order will be processed within 24 hours</li>
                  <li>Shipping updates will be sent to your email</li>
                  <li>Estimated delivery: 5-7 business days</li>
                </ul>
              </Alert>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                <Link to="/">
                  <Button variant="outline-primary" className="px-4">
                    <FaHome className="me-2" />
                    Continue Shopping
                  </Button>
                </Link>
                
                <Link to="/orders">
                  <Button variant="outline-secondary" className="px-4">
                    <FaShoppingCart className="me-2" />
                    View All Orders
                  </Button>
                </Link>
                
                <Button 
                  variant="success" 
                  className="px-4"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice || order.paymentStatus !== 'completed'}
                >
                  {downloadingInvoice ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <FaDownload className="me-2" />
                      Download Invoice
                    </>
                  )}
                </Button>
              </div>

              {/* Help Section */}
              <div className="mt-5 pt-4 border-top">
                <h6 className="mb-3">Need Help?</h6>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h6>📞 Call Us</h6>
                      <p className="mb-0 small">1800-123-4567</p>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h6>📧 Email</h6>
                      <p className="mb-0 small">support@shopeasy.com</p>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3 border rounded">
                      <h6>🕒 Support Hours</h6>
                      <p className="mb-0 small">Mon-Sat: 9AM-9PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default OrderSuccess;