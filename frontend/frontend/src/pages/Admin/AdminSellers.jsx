import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaStore, FaSearch, FaCheckCircle, FaTimesCircle, FaClock, 
  FaSync, FaArrowLeft, FaEnvelope, FaPhone, FaFilter 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAdminSellers, updateSellerStatus } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const AdminSellers = () => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, [statusFilter]);

  const fetchSellers = async () => {
    try {
      setLoading(true);
      const res = await getAdminSellers({ status: statusFilter, search: searchQuery });
      setSellers(res.data || []);
    } catch (err) {
      toast.error('Failed to load sellers list');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (sellerId, newStatus) => {
    try {
      setUpdatingId(sellerId);
      await updateSellerStatus(sellerId, newStatus);
      toast.success(`Seller status updated to ${newStatus}`);
      setSellers(prev => prev.map(s => s._id === sellerId ? { ...s, sellerStatus: newStatus } : s));
    } catch (err) {
      toast.error(err.message || 'Failed to update seller status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSellers = sellers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.storeName?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    if (status === 'approved') return <span className="badge bg-success px-3 py-2 rounded-pill"><FaCheckCircle className="me-1" /> Approved</span>;
    if (status === 'rejected') return <span className="badge bg-danger px-3 py-2 rounded-pill"><FaTimesCircle className="me-1" /> Rejected</span>;
    return <span className="badge bg-warning text-dark px-3 py-2 rounded-pill"><FaClock className="me-1" /> Pending Approval</span>;
  };

  if (loading && sellers.length === 0) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/admin" className="btn btn-light rounded-circle shadow-sm p-2 text-primary">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <FaStore className="text-primary" /> Seller Approvals & Management
            </h1>
            <p className="text-muted m-0">Review seller registration requests and manage vendor statuses</p>
          </div>
        </div>
        <button onClick={fetchSellers} className="btn-premium-outline px-4 py-2">
          <FaSync className="me-2" /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-6">
            <div className="position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} />
              <input
                type="text"
                className="input-premium w-100 ps-5"
                placeholder="Search sellers by name, email or store name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-6 d-flex gap-2 justify-md-content-end">
            <button
              className={`btn px-3 py-2 rounded-3 fw-bold ${statusFilter === 'all' ? 'btn-primary' : 'btn-light border'}`}
              onClick={() => setStatusFilter('all')}
            >
              All Sellers
            </button>
            <button
              className={`btn px-3 py-2 rounded-3 fw-bold ${statusFilter === 'pending' ? 'btn-warning text-dark' : 'btn-light border'}`}
              onClick={() => setStatusFilter('pending')}
            >
              ⏳ Pending Approval
            </button>
            <button
              className={`btn px-3 py-2 rounded-3 fw-bold ${statusFilter === 'approved' ? 'btn-success' : 'btn-light border'}`}
              onClick={() => setStatusFilter('approved')}
            >
              ✅ Approved
            </button>
            <button
              className={`btn px-3 py-2 rounded-3 fw-bold ${statusFilter === 'rejected' ? 'btn-danger' : 'btn-light border'}`}
              onClick={() => setStatusFilter('rejected')}
            >
              ❌ Rejected
            </button>
          </div>
        </div>
      </div>

      {/* Sellers List Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover table-premium align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4">Seller & Store</th>
                <th className="py-3">Contact</th>
                <th className="py-3">Registered On</th>
                <th className="py-3 text-center">Status</th>
                <th className="py-3 px-4 text-end">Approval Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <FaStore size={48} className="opacity-25 mb-3" />
                      <h5>No sellers found matching criteria</h5>
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <motion.tr
                      key={seller._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: 44,
                              height: 44,
                              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              fontSize: 18
                            }}
                          >
                            {seller.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-dark d-block fs-6">{seller.storeName || `${seller.name}'s Store`}</strong>
                            <small className="text-muted">Owner: {seller.name}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="small text-dark"><FaEnvelope className="me-1 text-muted" /> {seller.email}</div>
                        {seller.phone && <div className="small text-muted"><FaPhone className="me-1 text-muted" /> {seller.phone}</div>}
                      </td>
                      <td className="py-3 text-muted small">
                        {new Date(seller.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 text-center">
                        {getStatusBadge(seller.sellerStatus)}
                      </td>
                      <td className="py-3 px-4 text-end">
                        {updatingId === seller._id ? (
                          <span className="spinner-border spinner-border-sm text-primary" />
                        ) : (
                          <div className="d-flex justify-content-end gap-2">
                            {seller.sellerStatus !== 'approved' && (
                              <button
                                className="btn btn-sm btn-success px-3 rounded-pill fw-bold"
                                onClick={() => handleStatusChange(seller._id, 'approved')}
                              >
                                <FaCheckCircle className="me-1" /> Approve Seller
                              </button>
                            )}
                            {seller.sellerStatus !== 'rejected' && (
                              <button
                                className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-bold"
                                onClick={() => handleStatusChange(seller._id, 'rejected')}
                              >
                                <FaTimesCircle className="me-1" /> Reject
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSellers;
