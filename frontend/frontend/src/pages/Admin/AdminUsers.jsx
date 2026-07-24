import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUsers, FaSearch, FaFilter, FaBan, FaUnlock, FaTrash, FaEye,
  FaShoppingBag, FaRupeeSign, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaCalendarAlt, FaClock, FaArrowLeft, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaSortAmountDown
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getAdminUsers, getAdminUserById, blockUnblockUser, deleteAdminUser } from '../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d) => {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const avatarColor = (name = '') => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
  return colors[name.charCodeAt(0) % colors.length];
};

const StatusBadge = ({ isBlocked }) =>
  isBlocked ? (
    <span className="badge" style={{ background: '#fee2e2', color: '#dc2626', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
      <FaBan style={{ marginRight: 4 }} />Blocked
    </span>
  ) : (
    <span className="badge" style={{ background: '#d1fae5', color: '#059669', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
      <FaCheckCircle style={{ marginRight: 4 }} />Active
    </span>
  );

const OrderStatusBadge = ({ status }) => {
  const map = {
    pending:    { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    processing: { bg: '#dbeafe', color: '#2563eb', label: 'Processing' },
    shipped:    { bg: '#e0e7ff', color: '#7c3aed', label: 'Shipped' },
    delivered:  { bg: '#d1fae5', color: '#059669', label: 'Delivered' },
    cancelled:  { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '0.7rem', padding: '3px 9px', borderRadius: '20px', fontWeight: 600, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    background: `linear-gradient(135deg, ${avatarColor(name)}, ${avatarColor(name + '1')})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }}>
    {name?.charAt(0)?.toUpperCase() || '?'}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ background: `${color}18`, borderRadius: 12, padding: 14, color, fontSize: 22 }}>{icon}</div>
    <div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const AdminUsers = () => {
  // list state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const searchTimer = useRef(null);

  // detail panel
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // confirm modal
  const [confirmModal, setConfirmModal] = useState(null); // { type, user }
  const [actionLoading, setActionLoading] = useState(false);

  // ── fetch list ──────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (pg = 1, q = search, st = statusFilter) => {
    try {
      setLoading(true);
      const res = await getAdminUsers({ page: pg, limit: 12, search: q, status: st });
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
      setCurrentPage(pg);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { fetchUsers(1); }, [statusFilter]);

  // debounced search
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearch(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(1, q, statusFilter), 400);
  };

  // ── detail panel ────────────────────────────────────────────────────────────
  const openDetail = async (user) => {
    setDetailLoading(true);
    setSelectedUser({ ...user, _loading: true });
    try {
      const res = await getAdminUserById(user._id);
      setSelectedUser(res.data);
    } catch {
      toast.error('Failed to load user details');
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleBlockToggle = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await blockUnblockUser(confirmModal.user._id);
      toast.success(confirmModal.user.isBlocked ? 'User unblocked!' : 'User blocked!');
      setConfirmModal(null);
      if (selectedUser?._id === confirmModal.user._id) {
        setSelectedUser(prev => ({ ...prev, isBlocked: !prev.isBlocked }));
      }
      fetchUsers(currentPage);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmModal) return;
    setActionLoading(true);
    try {
      await deleteAdminUser(confirmModal.user._id);
      toast.success('User deleted successfully');
      setConfirmModal(null);
      if (selectedUser?._id === confirmModal.user._id) setSelectedUser(null);
      fetchUsers(currentPage);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  // ── stats from list ─────────────────────────────────────────────────────────
  const activeCount  = users.filter(u => !u.isBlocked).length;
  const blockedCount = users.filter(u => u.isBlocked).length;
  const totalSpent   = users.reduce((s, u) => s + (u.totalSpent || 0), 0);

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '28px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 14, padding: '12px 14px', color: '#fff', fontSize: 22 }}>
              <FaUsers />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, color: '#1e293b' }}>User Management</h1>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Manage accounts, view order history and activity</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon={<FaUsers />}    label="Total Users (this page)" value={total}        color="#6366f1" />
          <StatCard icon={<FaCheckCircle />} label="Active"               value={activeCount}  color="#10b981" />
          <StatCard icon={<FaBan />}      label="Blocked"                 value={blockedCount} color="#ef4444" />
          <StatCard icon={<FaRupeeSign />} label="Revenue (this page)"    value={fmt(totalSpent)} color="#f59e0b" sub="combined spend" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 420px' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Left: list ─────────────────────────────────────────────────── */}
          <div>
            {/* Search + filter bar */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone…"
                  value={search}
                  onChange={handleSearchChange}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['all','active','blocked'].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid', borderColor: statusFilter === s ? '#6366f1' : '#e2e8f0', background: statusFilter === s ? '#6366f1' : '#fff', color: statusFilter === s ? '#fff' : '#64748b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <div className="spinner-border" style={{ color: '#6366f1' }} />
                  <p style={{ marginTop: 12 }}>Loading users…</p>
                </div>
              ) : users.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
                  <FaUsers style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }} />
                  <p>No users found</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        {['User','Contact','Joined','Last Login','Orders','Spent','Status','Actions'].map(h => (
                          <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user, i) => (
                        <motion.tr
                          key={user._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => openDetail(user)}
                          style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: selectedUser?._id === user._id ? '#f0f0ff' : 'transparent', transition: 'background 0.15s' }}
                          onMouseEnter={e => { if (selectedUser?._id !== user._id) e.currentTarget.style.background = '#f8fafc'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = selectedUser?._id === user._id ? '#f0f0ff' : 'transparent'; }}
                        >
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={user.name} size={38} />
                              <div>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{user.name}</div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{user.role === 'admin' ? '👑 Admin' : 'Customer'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ color: '#475569', fontSize: '0.82rem' }}>{user.email}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{user.phone || '—'}</div>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtDate(user.createdAt)}</td>
                          <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{fmtDate(user.lastLogin)}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#6366f1', fontSize: '0.95rem' }}>{user.totalOrders || 0}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{fmt(user.totalSpent)}</td>
                          <td style={{ padding: '14px 16px' }}><StatusBadge isBlocked={user.isBlocked} /></td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => openDetail(user)}
                                title="View Details"
                                style={{ background: '#ede9fe', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#7c3aed', fontSize: 13, transition: 'transform 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              ><FaEye /></button>
                              <button
                                onClick={() => setConfirmModal({ type: 'block', user })}
                                title={user.isBlocked ? 'Unblock' : 'Block'}
                                style={{ background: user.isBlocked ? '#d1fae5' : '#fee2e2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: user.isBlocked ? '#059669' : '#dc2626', fontSize: 13, transition: 'transform 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >{user.isBlocked ? <FaUnlock /> : <FaBan />}</button>
                              <button
                                onClick={() => setConfirmModal({ type: 'delete', user })}
                                title="Delete"
                                style={{ background: '#fef2f2', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#dc2626', fontSize: 13, transition: 'transform 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              ><FaTrash /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
                    Page {currentPage} of {pages} &nbsp;·&nbsp; {total} users
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => fetchUsers(currentPage - 1)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: currentPage <= 1 ? 'default' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1 }}
                    ><FaChevronLeft /></button>
                    <button
                      disabled={currentPage >= pages}
                      onClick={() => fetchUsers(currentPage + 1)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', cursor: currentPage >= pages ? 'default' : 'pointer', opacity: currentPage >= pages ? 0.4 : 1 }}
                    ><FaChevronRight /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: detail panel ─────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', overflow: 'hidden', position: 'sticky', top: 20 }}
              >
                {/* Detail header */}
                <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '24px 20px', color: '#fff', position: 'relative' }}>
                  <button
                    onClick={() => setSelectedUser(null)}
                    style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#fff', cursor: 'pointer', fontSize: 13 }}
                  ><FaArrowLeft /></button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <Avatar name={selectedUser.name} size={56} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedUser.name}</div>
                      <div style={{ opacity: 0.85, fontSize: '0.82rem' }}>{selectedUser.role === 'admin' ? '👑 Admin' : 'Customer'}</div>
                      <div style={{ marginTop: 6 }}><StatusBadge isBlocked={selectedUser.isBlocked} /></div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.totalOrders || 0}</div>
                      <div style={{ opacity: 0.85, fontSize: '0.75rem' }}>Total Orders</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{fmt(selectedUser.totalSpent)}</div>
                      <div style={{ opacity: 0.85, fontSize: '0.75rem' }}>Total Spent</div>
                    </div>
                  </div>
                </div>

                {detailLoading ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                    <div className="spinner-border" style={{ color: '#6366f1' }} />
                  </div>
                ) : (
                  <div style={{ padding: 20, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>

                    {/* Contact info */}
                    <div style={{ marginBottom: 20 }}>
                      <h6 style={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Contact Info</h6>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <InfoRow icon={<FaEnvelope />} label="Email" value={selectedUser.email} />
                        <InfoRow icon={<FaPhone />}   label="Phone" value={selectedUser.phone || '—'} />
                        <InfoRow icon={<FaCalendarAlt />} label="Joined" value={fmtDate(selectedUser.createdAt)} />
                        <InfoRow icon={<FaClock />}   label="Last Login" value={fmtDateTime(selectedUser.lastLogin)} />
                      </div>
                    </div>

                    {/* Saved addresses */}
                    {selectedUser.addresses?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h6 style={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                          <FaMapMarkerAlt style={{ marginRight: 6 }} />Saved Addresses
                        </h6>
                        {selectedUser.addresses.map((addr, i) => (
                          <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: '0.82rem', color: '#475569' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{addr.name}</div>
                            <div>{addr.address}</div>
                            <div>{addr.city}{addr.state ? `, ${addr.state}` : ''} – {addr.postalCode}</div>
                            {addr.phone && <div>📞 {addr.phone}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Shipping addresses from orders (fallback) */}
                    {(!selectedUser.addresses?.length) && selectedUser.orders?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h6 style={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                          <FaMapMarkerAlt style={{ marginRight: 6 }} />Shipping Addresses Used
                        </h6>
                        {[...new Map(selectedUser.orders.filter(o => o.shippingAddress).map(o => [o.shippingAddress.address, o.shippingAddress])).values()].slice(0, 3).map((addr, i) => (
                          <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginBottom: 8, fontSize: '0.82rem', color: '#475569' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{addr.name}</div>
                            <div>{addr.address}</div>
                            <div>{addr.city} – {addr.postalCode}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order history */}
                    <div style={{ marginBottom: 20 }}>
                      <h6 style={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        <FaShoppingBag style={{ marginRight: 6 }} />Order History ({selectedUser.orders?.length || 0})
                      </h6>
                      {!selectedUser.orders?.length ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>No orders yet</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {selectedUser.orders.slice(0, 10).map((order) => (
                            <div key={order._id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>
                                  #{order._id?.slice(-8)?.toUpperCase()}
                                </span>
                                <OrderStatusBadge status={order.orderStatus} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{fmtDate(order.createdAt)}</span>
                                <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '0.85rem' }}>{fmt(order.totalAmount)}</span>
                              </div>
                              {order.items?.length > 0 && (
                                <div style={{ marginTop: 4, color: '#94a3b8', fontSize: '0.73rem' }}>
                                  {order.items.slice(0, 2).map(it => it.name || it.product?.name || 'Product').join(', ')}
                                  {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                                </div>
                              )}
                            </div>
                          ))}
                          {selectedUser.orders.length > 10 && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>+{selectedUser.orders.length - 10} more orders</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {selectedUser.role !== 'admin' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          onClick={() => setConfirmModal({ type: 'block', user: selectedUser })}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: selectedUser.isBlocked ? '#d1fae5' : '#fee2e2', color: selectedUser.isBlocked ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity 0.2s' }}
                        >
                          {selectedUser.isBlocked ? <><FaUnlock />Unblock</> : <><FaBan />Block</>}
                        </button>
                        <button
                          onClick={() => setConfirmModal({ type: 'delete', user: selectedUser })}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <FaTrash />Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Confirm Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>
                {confirmModal.type === 'delete' ? '🗑️' : confirmModal.user.isBlocked ? '🔓' : '🚫'}
              </div>
              <h5 style={{ fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
                {confirmModal.type === 'delete'
                  ? 'Delete User Account?'
                  : confirmModal.user.isBlocked ? 'Unblock User?' : 'Block User?'}
              </h5>
              <p style={{ color: '#64748b', marginBottom: 24, fontSize: '0.9rem' }}>
                {confirmModal.type === 'delete'
                  ? `This will permanently delete <strong>${confirmModal.user.name}</strong>'s account and all associated data. This action cannot be undone.`
                  : confirmModal.user.isBlocked
                    ? `Unblocking <strong>${confirmModal.user.name}</strong> will restore their access to the platform.`
                    : `Blocking <strong>${confirmModal.user.name}</strong> will prevent them from logging in.`}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#64748b' }}
                >Cancel</button>
                <button
                  onClick={confirmModal.type === 'delete' ? handleDelete : handleBlockToggle}
                  disabled={actionLoading}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: confirmModal.type === 'delete' ? '#dc2626' : (confirmModal.user.isBlocked ? '#059669' : '#dc2626'), color: '#fff', cursor: 'pointer', fontWeight: 700, opacity: actionLoading ? 0.7 : 1 }}
                >
                  {actionLoading ? <span className="spinner-border spinner-border-sm" /> : (
                    confirmModal.type === 'delete' ? 'Delete' : confirmModal.user.isBlocked ? 'Unblock' : 'Block'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── InfoRow helper ─────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ color: '#6366f1', fontSize: 13, width: 16 }}>{icon}</div>
    <span style={{ color: '#94a3b8', fontSize: '0.78rem', width: 70, flexShrink: 0 }}>{label}</span>
    <span style={{ color: '#1e293b', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all' }}>{value}</span>
  </div>
);

export default AdminUsers;
