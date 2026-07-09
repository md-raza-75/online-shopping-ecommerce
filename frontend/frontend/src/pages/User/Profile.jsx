import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave,
  FaShoppingBag, FaMapMarkerAlt, FaPhone, FaLock, FaShieldAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getProfile } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        if (!userInfo) {
          window.location.href = '/login';
          return;
        }
        const data = await getProfile();
        const userData = data.data || data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || ''
        });
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load profile');
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setUpdating(true);
    try {
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, name: formData.name, email: formData.email }));
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageLoader />;

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block rounded-4 p-4 shadow-sm">
          <h4>Please login to view your profile</h4>
          <Link to="/login" className="btn-premium mt-3 d-inline-block text-decoration-none">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 text-center"
      >
        <h1 className="fw-bold display-5 gradient-text mb-2">My Profile</h1>
        <p className="text-muted lead">Manage your account settings and preferences</p>
      </motion.div>

      <div className="row g-4">
        {/* Left Column: User Card & Stats */}
        <div className="col-lg-4">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="d-flex flex-column gap-4"
          >
            {/* User Card */}
            <div className="glass-card text-center p-4">
              <div className="position-relative d-inline-block mb-4">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center shadow"
                  style={{ width: '120px', height: '120px', background: 'linear-gradient(135deg, var(--primary-blue), var(--primary-purple))' }}
                >
                  <FaUser size={50} className="text-white" />
                </div>
                {user.role === 'admin' && (
                  <div className="position-absolute bottom-0 end-0 bg-danger text-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" title="Admin">
                    <FaShieldAlt size={16} />
                  </div>
                )}
              </div>
              <h3 className="fw-bold text-dark mb-1">{user.name}</h3>
              <p className="text-muted mb-3 d-flex align-items-center justify-content-center gap-2">
                <FaEnvelope /> {user.email}
              </p>
              <span className={`premium-badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'} px-3 py-2 fs-6`}>
                {user.role === 'admin' ? 'Administrator' : 'Customer'}
              </span>
              
              <hr className="my-4 text-muted opacity-25" />
              
              <div className="text-muted d-flex align-items-center justify-content-center gap-2">
                <FaCalendarAlt /> Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            {/* Stats Card */}
            <div className="glass-panel p-4">
              <h5 className="fw-bold mb-4">Account Overview</h5>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded-3 shadow-sm border">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 text-primary p-2 rounded"><FaShoppingBag /></div>
                    <span className="fw-bold text-muted">Total Orders</span>
                  </div>
                  <strong className="fs-5 text-dark">12</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded-3 shadow-sm border">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning bg-opacity-10 text-warning p-2 rounded"><FaUser /></div>
                    <span className="fw-bold text-muted">Pending Orders</span>
                  </div>
                  <strong className="fs-5 text-dark">2</strong>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 bg-white rounded-3 shadow-sm border">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-success bg-opacity-10 text-success p-2 rounded"><FaShieldAlt /></div>
                    <span className="fw-bold text-muted">Total Spent</span>
                  </div>
                  <strong className="fs-5 text-success">₹12,456</strong>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="col-lg-8">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card h-100 overflow-hidden"
          >
            {/* Tabs Header */}
            <div className="d-flex border-bottom bg-light">
              {[
                { id: 'profile', label: 'Profile Info', icon: FaUser },
                { id: 'security', label: 'Security', icon: FaLock },
                { id: 'orders', label: 'My Orders', icon: FaShoppingBag }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`btn border-0 py-3 px-4 fw-bold text-capitalize flex-grow-1 rounded-0 d-flex align-items-center justify-content-center gap-2 ${activeTab === tab.id ? 'text-primary bg-white border-bottom border-primary border-3' : 'text-muted hover-bg-light'}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon /> <span className="d-none d-sm-inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 p-md-5 bg-white h-100">
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="fw-bold m-0">Personal Information</h4>
                      <button 
                        className={editMode ? "btn-premium" : "btn-premium-outline"} 
                        onClick={() => editMode ? handleSubmit() : setEditMode(true)}
                        disabled={updating}
                      >
                        {editMode ? (updating ? 'Saving...' : <><FaSave className="me-2" /> Save</>) : <><FaEdit className="me-2" /> Edit</>}
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="row g-4">
                      <div className="col-md-6">
                        <label className="fw-bold text-muted mb-2">Full Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={!editMode} className={`input-premium ${!editMode && 'bg-light'}`} />
                      </div>
                      <div className="col-md-6">
                        <label className="fw-bold text-muted mb-2">Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!editMode} className={`input-premium ${!editMode && 'bg-light'}`} />
                      </div>
                      <div className="col-md-6">
                        <label className="fw-bold text-muted mb-2"><FaPhone className="me-2" /> Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!editMode} placeholder="Not provided" className={`input-premium ${!editMode && 'bg-light'}`} />
                      </div>
                      <div className="col-12">
                        <label className="fw-bold text-muted mb-2"><FaMapMarkerAlt className="me-2" /> Shipping Address</label>
                        <textarea rows={3} name="address" value={formData.address} onChange={handleInputChange} disabled={!editMode} placeholder="Not provided" className={`input-premium ${!editMode && 'bg-light'}`} />
                      </div>
                      
                      {editMode && (
                        <div className="col-12 d-flex gap-3 mt-4">
                          <button type="submit" className="btn-premium flex-grow-1 py-3" disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
                          <button type="button" className="btn btn-light border flex-grow-1 fw-bold" onClick={() => {
                            setEditMode(false);
                            setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
                          }}>Cancel</button>
                        </div>
                      )}
                    </form>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <h4 className="fw-bold mb-4">Security Settings</h4>
                    <form className="bg-light p-4 rounded-4 border">
                      <div className="mb-3">
                        <label className="fw-bold text-muted mb-2">Current Password</label>
                        <input type="password" placeholder="Enter current password" className="input-premium bg-white" />
                      </div>
                      <div className="mb-3">
                        <label className="fw-bold text-muted mb-2">New Password</label>
                        <input type="password" placeholder="Enter new password" className="input-premium bg-white" />
                      </div>
                      <div className="mb-4">
                        <label className="fw-bold text-muted mb-2">Confirm New Password</label>
                        <input type="password" placeholder="Confirm new password" className="input-premium bg-white" />
                      </div>
                      <button type="button" className="btn-premium py-2 px-4">
                        <FaLock className="me-2" /> Update Password
                      </button>
                    </form>
                  </motion.div>
                )}

                {activeTab === 'orders' && (
                  <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-5">
                    <div className="mb-4">
                      <FaShoppingBag size={64} className="text-muted opacity-50" />
                    </div>
                    <h4 className="fw-bold text-dark mb-2">Your Orders</h4>
                    <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '300px' }}>Track, return, or buy things again. View your complete order history.</p>
                    <Link to="/orders" className="btn-premium d-inline-block px-5 py-3">View Order History</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;