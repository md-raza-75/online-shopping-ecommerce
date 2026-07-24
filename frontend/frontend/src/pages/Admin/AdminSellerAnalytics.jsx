import React, { useState, useEffect } from 'react';
import { Container, Table, Card, Row, Col, Badge, Form, InputGroup, Button } from 'react-bootstrap';
import { FaChartLine, FaStore, FaShoppingBag, FaRupeeSign, FaSearch, FaArrowLeft, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSellerAnalytics } from '../../services/api';
import Loader from '../../components/Loader';

const AdminSellerAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await getSellerAnalytics();
      setAnalytics(res.data || []);
    } catch (error) {
      toast.error('Failed to load seller performance data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = analytics.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.storeName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalMarketplaceRevenue = analytics.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalMarketplaceOrders = analytics.reduce((sum, s) => sum + (s.totalOrders || 0), 0);
  const totalMarketplaceItems = analytics.reduce((sum, s) => sum + (s.totalItemsSold || 0), 0);

  if (loading) return <Loader />;

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <Link to="/admin" className="text-decoration-none text-muted small d-flex align-items-center gap-1 mb-1">
            <FaArrowLeft size={12} /> Back to Dashboard
          </Link>
          <h2 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <FaChartLine className="text-primary" /> Seller Performance Analytics
          </h2>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 bg-primary text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-white-50 mb-1 small text-uppercase fw-semibold">Total Sellers</p>
                <h3 className="fw-bold mb-0">{analytics.length}</h3>
              </div>
              <FaStore size={36} className="text-white-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 bg-success text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-white-50 mb-1 small text-uppercase fw-semibold">Total Revenue</p>
                <h3 className="fw-bold mb-0">₹{totalMarketplaceRevenue.toLocaleString()}</h3>
              </div>
              <FaRupeeSign size={36} className="text-white-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 bg-info text-white p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-white-50 mb-1 small text-uppercase fw-semibold">Seller Orders</p>
                <h3 className="fw-bold mb-0">{totalMarketplaceOrders}</h3>
              </div>
              <FaShoppingBag size={36} className="text-white-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm rounded-4 bg-warning text-dark p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-dark-50 mb-1 small text-uppercase fw-semibold">Items Sold</p>
                <h3 className="fw-bold mb-0">{totalMarketplaceItems}</h3>
              </div>
              <FaChartLine size={36} className="text-dark-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Seller Performance Table */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white py-3 px-4 d-flex align-items-center justify-content-between">
          <h5 className="fw-bold mb-0">Per-Seller Sales Report</h5>
          <InputGroup style={{ maxWidth: '300px' }}>
            <InputGroup.Text className="bg-light border-0"><FaSearch className="text-muted" /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search seller or store..."
              className="bg-light border-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="align-middle mb-0">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Seller & Store</th>
                <th>Status</th>
                <th className="text-center">Active Products</th>
                <th className="text-center">Total Orders</th>
                <th className="text-center">Items Sold</th>
                <th className="text-end pe-4">Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No sellers found.
                  </td>
                </tr>
              ) : (
                filtered.map((seller) => (
                  <tr key={seller._id}>
                    <td className="ps-4 py-3">
                      <div className="fw-bold text-dark">{seller.storeName || 'No Store Name'}</div>
                      <div className="text-muted small">{seller.name} • {seller.email}</div>
                    </td>
                    <td>
                      {seller.sellerStatus === 'approved' ? (
                        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                          <FaCheckCircle size={10} /> Approved
                        </Badge>
                      ) : seller.sellerStatus === 'pending' ? (
                        <Badge bg="warning" text="dark" className="d-inline-flex align-items-center gap-1">
                          <FaHourglassHalf size={10} /> Pending
                        </Badge>
                      ) : (
                        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
                          <FaTimesCircle size={10} /> Rejected
                        </Badge>
                      )}
                    </td>
                    <td className="text-center fw-semibold">{seller.productCount}</td>
                    <td className="text-center fw-semibold">{seller.totalOrders}</td>
                    <td className="text-center fw-semibold">{seller.totalItemsSold}</td>
                    <td className="text-end pe-4 fw-bold text-success fs-6">
                      ₹{(seller.totalRevenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminSellerAnalytics;
