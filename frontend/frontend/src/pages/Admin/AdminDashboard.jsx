import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaShoppingBag, FaRupeeSign, FaBox, FaChartLine,
  FaEye, FaEdit, FaDownload, FaFilePdf
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, getUsers, downloadInvoice } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalUsers: 0, totalProducts: 0 });
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
      
      const ordersData = await getAllOrders();
      const orders = ordersData.data || ordersData;
      
      const usersData = await getUsers();
      const users = usersData.data || usersData;

      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      setStats({
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        totalUsers: users.length,
        totalProducts: 24 
      });

      setRecentOrders(orders.slice(0, 5).reverse());
      setRecentUsers(users.slice(0, 5).reverse());
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = { 'pending': 'badge-warning', 'processing': 'badge-info', 'shipped': 'badge-primary', 'delivered': 'badge-success', 'cancelled': 'badge-danger' };
    return <span className={`premium-badge ${variants[status] || 'badge-secondary'} px-3 py-1 fs-6`}>{status}</span>;
  };

  const getPaymentBadge = (status) => {
    if (status === 'completed') return <span className="premium-badge badge-success px-3 py-1 fs-6">Paid</span>;
    if (status === 'failed') return <span className="premium-badge badge-danger px-3 py-1 fs-6">Failed</span>;
    return <span className="premium-badge badge-warning px-3 py-1 fs-6">Pending</span>;
  };

  const handleAdminDownloadInvoice = async (orderId, e) => {
    e.stopPropagation();
    try {
      setDownloadingId(orderId);
      const response = await downloadInvoice(orderId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const order = recentOrders.find(o => o._id === orderId);
      const invoiceNumber = order?.invoice?.invoiceNumber || `Invoice-${orderId}`;
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      if (error.response?.status === 400) toast.info('Invoice will be available after payment is completed');
      else toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <PageLoader />;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
        <div>
          <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 m-0">
            <FaChartLine className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-muted mt-1 mb-0">Overview of your store's performance</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/seller-analytics" className="btn-premium px-4 py-2 text-decoration-none">
            <FaChartLine className="me-2" /> Seller Performance
          </Link>
          <Link to="/admin/add-product" className="btn-premium-outline px-4 py-2 text-decoration-none">
            <FaEdit className="me-2" /> Add Product
          </Link>
          <Link to="/admin/products" className="btn-premium-outline px-4 py-2 text-decoration-none">
            <FaBox className="me-2" /> Manage Products
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="row g-4 mb-5">
        {[
          { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: FaRupeeSign, color: 'success' },
          { title: 'Total Orders', value: stats.totalOrders, icon: FaShoppingBag, color: 'primary' },
          { title: 'Total Users', value: stats.totalUsers, icon: FaUsers, color: 'info' },
          { title: 'Total Products', value: stats.totalProducts, icon: FaBox, color: 'warning' },
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants} className="col-xl-3 col-md-6">
            <div className="glass-card p-4 border-0 hover-lift h-100 position-relative overflow-hidden">
              <div className="d-flex justify-content-between align-items-center position-relative z-1">
                <div>
                  <p className="text-muted fw-bold mb-2 text-uppercase small">{stat.title}</p>
                  <h3 className="fw-bold text-dark m-0">{stat.value}</h3>
                </div>
                <div className={`bg-${stat.color} bg-opacity-10 rounded-circle p-3`}>
                  <stat.icon className={`text-${stat.color} fs-3`} />
                </div>
              </div>
              {/* Decorative gradient blob */}
              <div 
                className={`position-absolute bg-${stat.color} opacity-25 rounded-circle blur-3xl`}
                style={{ width: '100px', height: '100px', bottom: '-20px', right: '-20px', filter: 'blur(40px)' }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="row g-4 mb-5">
        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="col-xl-8">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Recent Orders</h5>
              <Link to="/admin/orders" className="text-primary text-decoration-none fw-bold hover-link">View All →</Link>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover table-premium align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="py-3 px-3 text-muted">Order ID</th>
                    <th className="py-3 text-muted">Customer</th>
                    <th className="py-3 text-muted">Date</th>
                    <th className="py-3 text-muted">Amount</th>
                    <th className="py-3 text-muted">Status</th>
                    <th className="py-3 text-end px-3 text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, i) => (
                    <motion.tr key={order._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <td className="py-3 px-3">
                        <strong className="text-primary">#{order._id.substring(0, 8)}</strong>
                      </td>
                      <td className="py-3 fw-bold text-dark">{order.user?.name || 'N/A'}</td>
                      <td className="py-3 text-muted">{formatDate(order.createdAt)}</td>
                      <td className="py-3 fw-bold">₹{order.totalAmount?.toLocaleString()}</td>
                      <td className="py-3">
                        <div className="d-flex flex-column gap-1">
                          {getStatusBadge(order.orderStatus)}
                          {getPaymentBadge(order.paymentStatus)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <Link to={`/admin/orders/${order._id}`} className="btn btn-light rounded-circle text-primary shadow-sm" style={{width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center'}} title="View Details">
                            <FaEye size={14} />
                          </Link>
                          <button 
                            className="btn btn-light rounded-circle text-success shadow-sm" 
                            style={{width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                            onClick={(e) => handleAdminDownloadInvoice(order._id, e)}
                            disabled={downloadingId === order._id}
                            title="Download Invoice"
                          >
                            {downloadingId === order._id ? <span className="spinner-border spinner-border-sm"></span> : <FaDownload size={14} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Recent Users */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="col-xl-4">
          <div className="glass-panel p-4 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0">Recent Users</h5>
              <Link to="/admin/users" className="text-primary text-decoration-none fw-bold hover-link">View All →</Link>
            </div>
            
            <div className="d-flex flex-column gap-3">
              {recentUsers.map((user, i) => (
                <motion.div 
                  key={user._id} 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-3 rounded-4 shadow-sm border d-flex justify-content-between align-items-center hover-lift"
                >
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark m-0">{user.name}</h6>
                      <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '120px' }}>{user.email}</small>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`premium-badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'} px-2 py-1 small`}>{user.role}</span>
                    <Link to={`/admin/users/${user._id}`} className="btn btn-light rounded-circle shadow-sm text-primary p-2">
                      <FaEye size={12} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
        <h5 className="fw-bold mb-4">Quick Actions</h5>
        <div className="d-flex flex-wrap gap-3">
          <Link to="/admin/add-product" className="btn btn-light border px-4 py-3 fw-bold hover-lift d-flex align-items-center gap-2 text-dark">
            <div className="bg-primary bg-opacity-10 p-2 rounded-circle text-primary"><FaEdit /></div> Add New Product
          </Link>
          <Link to="/admin/products" className="btn btn-light border px-4 py-3 fw-bold hover-lift d-flex align-items-center gap-2 text-dark">
            <div className="bg-success bg-opacity-10 p-2 rounded-circle text-success"><FaBox /></div> Manage Products
          </Link>
          <Link to="/admin/orders" className="btn btn-light border px-4 py-3 fw-bold hover-lift d-flex align-items-center gap-2 text-dark">
            <div className="bg-info bg-opacity-10 p-2 rounded-circle text-info"><FaShoppingBag /></div> Manage Orders
          </Link>
          <Link to="/admin/users" className="btn btn-light border px-4 py-3 fw-bold hover-lift d-flex align-items-center gap-2 text-dark">
            <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning"><FaUsers /></div> Manage Users
          </Link>
          <Link to="/admin/reports" className="btn btn-light border px-4 py-3 fw-bold hover-lift d-flex align-items-center gap-2 text-dark">
            <div className="bg-dark bg-opacity-10 p-2 rounded-circle text-dark"><FaChartLine /></div> View Reports
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;