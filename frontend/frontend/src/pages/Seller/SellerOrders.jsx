import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import { 
  FaShoppingBag, FaSearch, FaArrowLeft, FaEye, FaSync, FaTimes, FaBox, FaRupeeSign, FaUser, FaPhone, FaMapMarkerAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSellerOrders } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  useEffect(() => {
    if (!userInfo || (userInfo.role !== 'seller' && userInfo.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getSellerOrders();
      setOrders(res.data || []);
    } catch (err) {
      toast.error('Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const variants = { 'pending': 'badge-warning', 'processing': 'badge-info', 'shipped': 'badge-primary', 'delivered': 'badge-success', 'cancelled': 'badge-danger' };
    return <span className={`premium-badge ${variants[status] || 'badge-secondary'} px-3 py-1 text-center`}>{status}</span>;
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading && orders.length === 0) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/seller" className="btn btn-light rounded-circle shadow-sm p-2 text-primary">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <FaShoppingBag className="text-primary" /> Vendor Orders
            </h1>
            <p className="text-muted m-0">Orders containing products from your store catalog</p>
          </div>
        </div>
        <button onClick={fetchOrders} className="btn-premium-outline px-4 py-2">
          <FaSync className="me-2" /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 mb-4">
        <div className="position-relative">
          <FaSearch className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} />
          <input
            type="text"
            className="input-premium w-100 ps-5"
            placeholder="Search by Order ID, Buyer Name or Email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover table-premium align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3">Customer</th>
                <th className="py-3">Date</th>
                <th className="py-3">My Items Total</th>
                <th className="py-3 text-center">Status</th>
                <th className="py-3 px-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <FaShoppingBag size={48} className="opacity-25 mb-3" />
                      <h5>No orders found</h5>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td className="py-3 px-4">
                        <strong className="text-primary">#{order._id.substring(0, 8).toUpperCase()}</strong>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold text-dark">{order.user?.name || 'Customer'}</div>
                        <small className="text-muted">{order.user?.email}</small>
                      </td>
                      <td className="py-3 text-muted small">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 fw-bold text-success">
                        {formatCurrency(order.sellerSubtotal)}
                      </td>
                      <td className="py-3 text-center">
                        {getStatusBadge(order.orderStatus)}
                      </td>
                      <td className="py-3 px-4 text-end">
                        <button
                          className="btn btn-light rounded-circle text-primary p-2"
                          onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                          title="View Order Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        {selectedOrder && (
          <div className="glass-card border-0 p-4 rounded-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <h4 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
                <FaShoppingBag className="text-primary" /> Vendor Order #{selectedOrder._id?.substring(0, 8).toUpperCase()}
              </h4>
              <button className="btn btn-light rounded-circle p-2 text-muted" onClick={() => setShowDetailsModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-muted small text-uppercase mb-2"><FaUser className="me-1" /> Customer Details</h6>
                  <p className="fw-bold text-dark mb-1">{selectedOrder.user?.name || 'Customer'}</p>
                  <p className="small text-muted mb-1">{selectedOrder.user?.email}</p>
                  {selectedOrder.shippingAddress?.phone && (
                    <p className="small text-muted mb-0"><FaPhone className="me-1" /> {selectedOrder.shippingAddress.phone}</p>
                  )}
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-muted small text-uppercase mb-2"><FaMapMarkerAlt className="me-1" /> Delivery Address</h6>
                  <p className="fw-bold text-dark mb-1">{selectedOrder.shippingAddress?.name}</p>
                  <p className="small text-muted mb-1">{selectedOrder.shippingAddress?.address}</p>
                  <p className="small text-muted mb-0">{selectedOrder.shippingAddress?.city} - {selectedOrder.shippingAddress?.postalCode}</p>
                </div>
              </div>
            </div>

            <h6 className="fw-bold text-dark mb-3"><FaBox className="me-1" /> Your Products in this Order</h6>
            <div className="table-responsive rounded-3 border overflow-hidden mb-4">
              <table className="table table-hover mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 text-end">Price</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 px-3 text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3">
                        <div className="d-flex align-items-center gap-2">
                          {item.image && <img src={item.image} alt={item.name} className="rounded" style={{ width: 35, height: 35, objectFit: 'cover' }} />}
                          <strong className="text-dark small">{item.name}</strong>
                        </div>
                      </td>
                      <td className="py-2 text-end text-muted small">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-center fw-bold small">{item.quantity}</td>
                      <td className="py-2 px-3 text-end fw-bold text-primary small">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-light border-top">
                  <tr>
                    <td colSpan="3" className="text-end py-2 px-3"><strong>My Items Total:</strong></td>
                    <td className="py-2 px-3 text-end"><strong className="fs-6 text-success">{formatCurrency(selectedOrder.sellerSubtotal)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="d-flex justify-content-end">
              <button className="btn btn-light border px-4 py-2 rounded-3" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SellerOrders;
