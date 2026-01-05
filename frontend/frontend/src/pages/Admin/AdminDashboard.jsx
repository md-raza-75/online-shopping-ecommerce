import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { 
  FaUsers, 
  FaShoppingBag, 
  FaRupeeSign, 
  FaBox, 
  FaChartLine,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaFilePdf
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, getUsers, downloadInvoice } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo || userInfo.role !== 'admin') {
        window.location.href = '/login';
        return;
      }

      // Fetch orders
      const ordersData = await getAllOrders();
      const orders = ordersData.data || ordersData;
      
      // Fetch users
      const usersData = await getUsers();
      const users = usersData.data || usersData;

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      setStats({
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalUsers: users.length,
        totalProducts: 24 // Mock data
      });

      // Recent orders (last 5)
      setRecentOrders(orders.slice(0, 5).reverse());
      
      // Recent users (last 5)
      setRecentUsers(users.slice(0, 5).reverse());
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
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

  const handleAdminDownloadInvoice = async (orderId, e) => {
    e.stopPropagation();
    
    try {
      setDownloadingId(orderId);
      
      const response = await downloadInvoice(orderId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Get order for filename
      const order = recentOrders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoice?.invoiceNumber || `Invoice-${orderId}`;
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
      console.error('Admin download error:', error);
      
      if (error.response?.status === 400) {
        toast.info('Invoice will be available after payment is completed');
      } else {
        toast.error('Failed to download invoice');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) return <PageLoader />;

  return (
    <Container fluid className="px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 fw-bold">
          <FaChartLine className="me-2" />
          Admin Dashboard
        </h1>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" as={Link} to="/admin/add-product">
            Add Product
          </Button>
          <Button variant="outline-primary" size="sm" as={Link} to="/admin/products">
            Manage Products
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col xl={3} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-2">Total Orders</h6>
                  <h3 className="mb-0">{stats.totalOrders}</h3>
                </Col>
                <Col xs={4} className="text-end">
                  <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <FaShoppingBag className="text-primary" size={24} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h3 className="mb-0">₹{stats.totalRevenue.toLocaleString()}</h3>
                </Col>
                <Col xs={4} className="text-end">
                  <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <FaRupeeSign className="text-success" size={24} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-2">Total Users</h6>
                  <h3 className="mb-0">{stats.totalUsers}</h3>
                </Col>
                <Col xs={4} className="text-end">
                  <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <FaUsers className="text-info" size={24} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={3} lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col xs={8}>
                  <h6 className="text-muted mb-2">Total Products</h6>
                  <h3 className="mb-0">{stats.totalProducts}</h3>
                </Col>
                <Col xs={4} className="text-end">
                  <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-block">
                    <FaBox className="text-warning" size={24} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders & Users */}
      <Row className="g-4">
        <Col xl={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Recent Orders</h5>
                <Button variant="link" as={Link} to="/admin/orders" className="text-decoration-none p-0">
                  View All
                </Button>
              </div>
              
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <small>#{order._id.substring(0, 8)}</small>
                        </td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>₹{order.totalAmount?.toLocaleString()}</td>
                        <td>{getStatusBadge(order.orderStatus)}</td>
                        <td>{getPaymentBadge(order.paymentStatus)}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              as={Link}
                              to={`/admin/orders/${order._id}`}
                              className="d-flex align-items-center gap-1 me-1"
                              title="View Details"
                            >
                              <FaEye size={12} />
                            </Button>
                            
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={(e) => handleAdminDownloadInvoice(order._id, e)}
                              disabled={downloadingId === order._id}
                              className="d-flex align-items-center gap-1"
                              title="Download Invoice"
                            >
                              {downloadingId === order._id ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                <FaDownload size={12} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">Recent Users</h5>
                <Button variant="link" as={Link} to="/admin/users" className="text-decoration-none p-0">
                  View All
                </Button>
              </div>
              
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>
                          <small>{user.email}</small>
                        </td>
                        <td>
                          <Badge bg={user.role === 'admin' ? 'danger' : 'primary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            as={Link}
                            to={`/admin/users/${user._id}`}
                            className="d-flex align-items-center gap-1"
                          >
                            <FaEye size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="mb-3">Quick Actions</h5>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="primary" as={Link} to="/admin/add-product">
                  <FaEdit className="me-2" />
                  Add New Product
                </Button>
                <Button variant="success" as={Link} to="/admin/products">
                  <FaBox className="me-2" />
                  Manage Products
                </Button>
                <Button variant="info" as={Link} to="/admin/orders">
                  <FaShoppingBag className="me-2" />
                  Manage Orders
                </Button>
                <Button variant="warning" as={Link} to="/admin/users">
                  <FaUsers className="me-2" />
                  Manage Users
                </Button>
                <Button variant="dark" as={Link} to="/admin/reports">
                  <FaChartLine className="me-2" />
                  View Reports
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;