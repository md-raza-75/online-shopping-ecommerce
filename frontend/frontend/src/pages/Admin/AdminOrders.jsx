import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Dropdown } from 'react-bootstrap';
import {
  FaEye, FaSearch, FaArrowLeft, FaShoppingBag,
  FaFilter, FaDownload, FaSync, FaTimes, FaBox, FaRupeeSign
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, updateOrderStatus, downloadInvoice } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }
      const data = await getAllOrders();
      const ordersData = Array.isArray(data) ? data : (data.data || []);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }
    setFilteredOrders(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterOrders();
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const statusData = { orderStatus: newStatus };
      await updateOrderStatus(orderId, statusData);
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadInvoice = async (orderId, e) => {
    e.stopPropagation();
    try {
      setDownloadingId(orderId);
      const response = await downloadInvoice(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const order = orders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoiceNumber || `Invoice-${orderId}`;
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { 'pending': 'badge-warning', 'processing': 'badge-info', 'shipped': 'badge-primary', 'delivered': 'badge-success', 'cancelled': 'badge-danger' };
    return <span className={`premium-badge ${variants[status] || 'badge-secondary'} px-3 py-1 fs-6 d-inline-block text-center`} style={{ minWidth: '90px' }}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    if (status === 'completed') return <span className="premium-badge badge-success px-3 py-1 fs-6 d-inline-block text-center" style={{ minWidth: '90px' }}>Paid</span>;
    if (status === 'failed') return <span className="premium-badge badge-danger px-3 py-1 fs-6 d-inline-block text-center" style={{ minWidth: '90px' }}>Failed</span>;
    return <span className="premium-badge badge-warning px-3 py-1 fs-6 d-inline-block text-center" style={{ minWidth: '90px' }}>Pending</span>;
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  const calculateOrderTotal = (order) => {
    if (order.totalAmount) return order.totalAmount;
    if (order.items && Array.isArray(order.items)) return order.items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
    return 0;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/admin" className="btn btn-light rounded-circle shadow-sm p-2 text-primary" title="Back to Dashboard">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 m-0">
              <FaShoppingBag className="text-primary" /> Manage Orders
            </h1>
            <p className="text-muted mt-1 mb-0">Total {filteredOrders.length} orders found</p>
          </div>
        </div>
        <button onClick={fetchOrders} className="btn-premium-outline px-4 py-2">
          <FaSync className="me-2" /> Refresh
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 mb-5">
        <div className="row g-3">
          <div className="col-md-6">
            <form onSubmit={handleSearch} className="position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} />
              <input 
                type="text" 
                className="input-premium w-100 ps-5" 
                placeholder="Search by Order ID, Customer Name or Email..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>
          <div className="col-md-3">
            <div className="position-relative">
              <FaFilter className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} />
              <select 
                className="input-premium w-100 ps-5 appearance-none" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ appearance: 'none', cursor: 'pointer' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover table-premium align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-4 px-4 text-muted">Order ID</th>
                <th className="py-4 text-muted">Customer</th>
                <th className="py-4 text-muted">Date</th>
                <th className="py-4 text-muted">Amount</th>
                <th className="py-4 text-center text-muted">Status</th>
                <th className="py-4 text-center text-muted">Payment</th>
                <th className="py-4 px-4 text-end text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredOrders.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan="7" className="text-center py-5">
                      <FaShoppingBag size={50} className="text-muted opacity-25 mb-3" />
                      <h5 className="text-dark fw-bold">No orders found</h5>
                      <p className="text-muted">Try adjusting your search or filters.</p>
                    </td>
                  </motion.tr>
                ) : (
                  filteredOrders.map((order, index) => (
                    <motion.tr key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                      <td className="py-4 px-4">
                        <strong className="text-primary">#{order._id.substring(0, 8)}</strong>
                      </td>
                      <td className="py-4">
                        <div className="fw-bold text-dark">{order.user?.name || 'N/A'}</div>
                        <small className="text-muted">{order.user?.email || ''}</small>
                      </td>
                      <td className="py-4 text-muted">{formatDate(order.createdAt)}</td>
                      <td className="py-4 fw-bold text-dark">{formatCurrency(calculateOrderTotal(order))}</td>
                      <td className="py-4 text-center">{getStatusBadge(order.orderStatus)}</td>
                      <td className="py-4 text-center">{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="py-4 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2 align-items-center">
                          <button 
                            className="btn btn-light rounded-circle shadow-sm text-primary p-2 d-flex align-items-center justify-content-center" 
                            style={{ width: '35px', height: '35px' }} 
                            onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          
                          <Dropdown>
                            <Dropdown.Toggle variant="light" className="btn-light rounded-circle shadow-sm text-dark p-2 d-flex align-items-center justify-content-center border-0" style={{ width: '35px', height: '35px' }} id={`dropdown-${order._id}`}>
                              <span className="visually-hidden">Status</span>...
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-lg border-0 rounded-4 p-2">
                              <Dropdown.Item className="rounded-3 mb-1" onClick={() => handleStatusUpdate(order._id, 'processing')}>Mark as Processing</Dropdown.Item>
                              <Dropdown.Item className="rounded-3 mb-1" onClick={() => handleStatusUpdate(order._id, 'shipped')}>Mark as Shipped</Dropdown.Item>
                              <Dropdown.Item className="rounded-3 mb-1" onClick={() => handleStatusUpdate(order._id, 'delivered')}>Mark as Delivered</Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item className="rounded-3 text-danger fw-bold" onClick={() => handleStatusUpdate(order._id, 'cancelled')}>Cancel Order</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                          
                          <button 
                            className="btn btn-light rounded-circle shadow-sm text-success p-2 d-flex align-items-center justify-content-center" 
                            style={{ width: '35px', height: '35px' }} 
                            onClick={(e) => handleDownloadInvoice(order._id, e)}
                            disabled={downloadingId === order._id}
                            title="Download Invoice"
                          >
                            {downloadingId === order._id ? <span className="spinner-border spinner-border-sm"></span> : <FaDownload />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        {selectedOrder && (
          <div className="glass-card border-0 overflow-hidden" style={{ borderRadius: '20px' }}>
            <div className="d-flex justify-content-between align-items-center p-4 border-bottom bg-light">
              <h4 className="fw-bold m-0 d-flex align-items-center gap-2 text-dark">
                <FaShoppingBag className="text-primary" /> Order Details
              </h4>
              <button className="btn btn-light rounded-circle p-2 shadow-sm text-muted" onClick={() => setShowDetailsModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold text-muted mb-4 text-uppercase">Order Information</h6>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Order ID:</span>
                      <strong className="text-dark">#{selectedOrder._id?.substring(0, 8)}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Date:</span>
                      <strong className="text-dark">{formatDate(selectedOrder.createdAt)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Status:</span>
                      {getStatusBadge(selectedOrder.orderStatus)}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-4 bg-light rounded-4 border h-100">
                    <h6 className="fw-bold text-muted mb-4 text-uppercase">Customer Information</h6>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Name:</span>
                      <strong className="text-dark">{selectedOrder.user?.name || 'N/A'}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span className="text-muted">Email:</span>
                      <strong className="text-dark text-truncate" style={{ maxWidth: '150px' }}>{selectedOrder.user?.email || 'N/A'}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Payment:</span>
                      {getPaymentBadge(selectedOrder.paymentStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div className="p-4 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-4 mb-4">
                  <h6 className="fw-bold text-primary mb-3">Shipping Address</h6>
                  <p className="fw-bold text-dark mb-1">{selectedOrder.shippingAddress.name}</p>
                  <p className="text-dark mb-1">{selectedOrder.shippingAddress.address}</p>
                  <p className="text-dark mb-1">{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode || selectedOrder.shippingAddress.postalCode}</p>
                  <p className="text-dark mb-0 d-flex align-items-center gap-2">📞 {selectedOrder.shippingAddress.phone}</p>
                </div>
              )}

              <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2"><FaBox className="text-muted" /> Order Items</h6>
              <div className="table-responsive rounded-4 border overflow-hidden mb-4">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 text-end">Price</th>
                      <th className="py-3 text-center">Qty</th>
                      <th className="py-3 px-4 text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="py-3 px-4 fw-bold text-dark">{item.name}</td>
                        <td className="py-3 text-end text-muted">{formatCurrency(item.price)}</td>
                        <td className="py-3 text-center fw-bold">{item.quantity}</td>
                        <td className="py-3 px-4 text-end fw-bold text-primary">{formatCurrency(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-light border-top">
                    <tr>
                      <td colSpan="3" className="text-end py-3 px-4"><strong>Total Amount:</strong></td>
                      <td className="py-3 px-4 text-end"><strong className="fs-5 gradient-text">{formatCurrency(calculateOrderTotal(selectedOrder))}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 border-top bg-light d-flex justify-content-end gap-3">
              <button className="btn btn-light border fw-bold text-muted px-4 py-2" onClick={() => setShowDetailsModal(false)}>Close</button>
              <Link to={`/admin/orders/${selectedOrder?._id}`} className="btn-premium px-4 py-2 text-decoration-none">View Full Details</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;