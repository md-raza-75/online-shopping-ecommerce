import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaStore, FaBox, FaShoppingBag, FaRupeeSign, 
  FaPlus, FaCheckCircle, FaExclamationTriangle, FaClock, FaSync, FaChartLine
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSellerStats } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  useEffect(() => {
    if (!userInfo || (userInfo.role !== 'seller' && userInfo.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getSellerStats();
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load seller metrics');
    } finally {
      setLoading(false);
    }
  };

  const isApproved = userInfo?.role === 'admin' || userInfo?.sellerStatus === 'approved';
  const isPending = userInfo?.sellerStatus === 'pending' && userInfo?.role !== 'admin';
  const isRejected = userInfo?.sellerStatus === 'rejected' && userInfo?.role !== 'admin';

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-primary text-white rounded-3 shadow-sm">
              <FaStore size={28} />
            </div>
            <div>
              <h1 className="h2 fw-bold text-dark m-0">
                {userInfo?.storeName || `${userInfo?.name}'s Vendor Portal`}
              </h1>
              <p className="text-muted m-0">Manage your products, store inventory, and customer orders</p>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={fetchStats} className="btn btn-light border px-3 py-2 rounded-3">
            <FaSync />
          </button>
          {isApproved && (
            <Link to="/seller/products" className="btn-premium px-4 py-2 text-decoration-none">
              <FaPlus className="me-2" /> Add New Product
            </Link>
          )}
        </div>
      </div>

      {/* Approval Status Alerts */}
      {isPending && (
        <div className="alert alert-warning border-warning rounded-4 p-4 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-3">
            <FaClock size={32} className="text-warning flex-shrink-0" />
            <div>
              <h5 className="fw-bold mb-1">⏳ Account Approval Pending</h5>
              <p className="mb-0 text-dark">
                Your seller application is currently being reviewed by the Super Admin. You will gain full access to product listing and order management as soon as your account is approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="alert alert-danger border-danger rounded-4 p-4 shadow-sm mb-4">
          <div className="d-flex align-items-center gap-3">
            <FaExclamationTriangle size={32} className="text-danger flex-shrink-0" />
            <div>
              <h5 className="fw-bold mb-1">❌ Seller Application Rejected</h5>
              <p className="mb-0 text-dark">
                Your seller application was not approved by the Super Admin. Please contact support if you need further clarification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-3 col-sm-6">
          <div className="glass-card p-4 rounded-4 border-0 h-100 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted fw-bold small text-uppercase">My Active Products</span>
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                <FaBox size={20} />
              </div>
            </div>
            <h2 className="fw-bold text-dark m-0">{stats?.productsCount || 0}</h2>
            <small className="text-muted">Listed items in store</small>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="glass-card p-4 rounded-4 border-0 h-100 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted fw-bold small text-uppercase">Vendor Orders</span>
              <div className="p-2 bg-info bg-opacity-10 text-info rounded-3">
                <FaShoppingBag size={20} />
              </div>
            </div>
            <h2 className="fw-bold text-dark m-0">{stats?.ordersCount || 0}</h2>
            <small className="text-muted">Orders with your products</small>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="glass-card p-4 rounded-4 border-0 h-100 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted fw-bold small text-uppercase">Items Sold</span>
              <div className="p-2 bg-success bg-opacity-10 text-success rounded-3">
                <FaChartLine size={20} />
              </div>
            </div>
            <h2 className="fw-bold text-dark m-0">{stats?.totalItemsSold || 0}</h2>
            <small className="text-muted">Total units purchased</small>
          </div>
        </div>

        <div className="col-md-3 col-sm-6">
          <div className="glass-card p-4 rounded-4 border-0 h-100 shadow-sm">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="text-muted fw-bold small text-uppercase">My Sales Revenue</span>
              <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-3">
                <FaRupeeSign size={20} />
              </div>
            </div>
            <h2 className="fw-bold text-success m-0">{formatCurrency(stats?.totalRevenue)}</h2>
            <small className="text-muted">Total earnings from sales</small>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      {isApproved && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <h4 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                  <FaBox className="text-primary" /> Product Management
                </h4>
                <p className="text-muted mb-4">
                  Add new items, update stock quantities, price details, and manage your inventory catalog.
                </p>
              </div>
              <Link to="/seller/products" className="btn-premium px-4 py-2 text-decoration-none w-fit">
                Manage My Products →
              </Link>
            </div>
          </div>

          <div className="col-md-6">
            <div className="glass-panel p-4 h-100 d-flex flex-column justify-content-between">
              <div>
                <h4 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                  <FaShoppingBag className="text-primary" /> Vendor Orders
                </h4>
                <p className="text-muted mb-4">
                  View customer orders containing your products, track fulfillment statuses, and check buyer details.
                </p>
              </div>
              <Link to="/seller/orders" className="btn-premium-outline px-4 py-2 text-decoration-none w-fit">
                View My Orders →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
