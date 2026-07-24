import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaCalendarAlt, FaEdit, FaSave,
  FaShoppingBag, FaMapMarkerAlt, FaPhone, FaLock, FaPlus, FaTrash, FaCheck, FaHeart
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Form, Button, Modal, Badge, Card, Row, Col } from 'react-bootstrap';
import { getProfile, updateProfile, addAddress, deleteAddress, setDefaultAddress } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';
import { Link } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Edit Profile Form State
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false
  });
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo) {
        window.location.href = '/login';
        return;
      }
      const res = await getProfile();
      const userData = res.data || res;
      setUser(userData);
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { name, phone };
      if (newPassword) {
        payload.password = newPassword;
        payload.currentPassword = currentPassword;
      }
      const res = await updateProfile(payload);
      toast.success(res.message || 'Profile updated successfully!');

      // Sync localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, name: res.data.name, phone: res.data.phone }));
      
      setUser({ ...user, ...res.data });
      setEditMode(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddingAddress(true);
    try {
      const res = await addAddress(addressForm);
      toast.success('Address added successfully');
      setUser({ ...user, addresses: res.data });
      setShowAddressModal(false);
      setAddressForm({ name: '', phone: '', address: '', city: '', state: '', postalCode: '', country: 'India', isDefault: false });
    } catch (error) {
      toast.error(error.message || 'Failed to add address');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      const res = await deleteAddress(index);
      toast.success('Address removed');
      setUser({ ...user, addresses: res.data });
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (index) => {
    try {
      const res = await setDefaultAddress(index);
      toast.success('Default address updated');
      setUser({ ...user, addresses: res.data });
    } catch (error) {
      toast.error('Failed to update default address');
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-5 text-center">
        <h1 className="fw-bold display-5 gradient-text mb-2">My Profile & Account</h1>
        <p className="text-muted lead">Manage your personal details, addresses, and wishlist</p>
      </motion.div>

      <div className="row g-4">
        {/* Left Column: User Overview Card */}
        <div className="col-lg-4">
          <div className="glass-card text-center p-4 shadow-sm rounded-4 mb-4">
            <div 
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
              style={{ width: '90px', height: '90px', fontSize: '2.5rem', fontWeight: 'bold' }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <h4 className="fw-bold text-dark mb-1">{user.name}</h4>
            <p className="text-muted small mb-2"><FaEnvelope className="me-1" /> {user.email}</p>
            <Badge bg={user.role === 'admin' ? 'danger' : user.role === 'seller' ? 'warning' : 'primary'} className="px-3 py-2 text-uppercase mb-3">
              {user.role}
            </Badge>

            <hr />

            <div className="d-flex flex-column gap-2 text-start">
              <Button 
                variant={activeTab === 'profile' ? 'primary' : 'light'} 
                className="w-100 text-start d-flex align-items-center gap-2 rounded-3 py-2"
                onClick={() => setActiveTab('profile')}
              >
                <FaUser /> Personal Information
              </Button>
              <Button 
                variant={activeTab === 'addresses' ? 'primary' : 'light'} 
                className="w-100 text-start d-flex align-items-center gap-2 rounded-3 py-2"
                onClick={() => setActiveTab('addresses')}
              >
                <FaMapMarkerAlt /> Saved Addresses ({user.addresses?.length || 0})
              </Button>
              <Button 
                as={Link} to="/wishlist" 
                variant="light" 
                className="w-100 text-start d-flex align-items-center gap-2 rounded-3 py-2 text-decoration-none text-dark"
              >
                <FaHeart className="text-danger" /> My Wishlist
              </Button>
              <Button 
                as={Link} to="/orders" 
                variant="light" 
                className="w-100 text-start d-flex align-items-center gap-2 rounded-3 py-2 text-decoration-none text-dark"
              >
                <FaShoppingBag className="text-primary" /> Order History
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="col-lg-8">
          {activeTab === 'profile' && (
            <Card className="border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Personal Information</h4>
                <Button 
                  variant={editMode ? 'secondary' : 'outline-primary'} 
                  className="rounded-pill px-4"
                  onClick={() => setEditMode(!editMode)}
                >
                  <FaEdit className="me-2" /> {editMode ? 'Cancel' : 'Edit Details'}
                </Button>
              </div>

              {!editMode ? (
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block">Full Name</label>
                    <p className="fw-bold text-dark fs-5">{user.name}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block">Email Address</label>
                    <p className="fw-bold text-dark fs-5">{user.email}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block">Phone Number</label>
                    <p className="fw-bold text-dark fs-5">{user.phone || 'Not provided'}</p>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold d-block">Account Created</label>
                    <p className="fw-bold text-dark fs-5">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <Form onSubmit={handleUpdateProfile}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Full Name</Form.Label>
                        <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Phone Number</Form.Label>
                        <Form.Control type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="mt-4">
                      <h6 className="fw-bold text-muted border-bottom pb-2">Change Password (optional)</h6>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">Current Password</Form.Label>
                        <Form.Control type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Required to set new password" />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold">New Password</Form.Label>
                        <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
                      </Form.Group>
                    </Col>

                    <Col md={12} className="text-end mt-4">
                      <Button type="submit" variant="primary" size="lg" className="rounded-pill px-5" disabled={updating}>
                        {updating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              )}
            </Card>
          )}

          {activeTab === 'addresses' && (
            <Card className="border-0 shadow-sm rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h4 className="fw-bold mb-1">Saved Addresses</h4>
                  <p className="text-muted small mb-0">Manage addresses for fast checkout</p>
                </div>
                <Button variant="primary" className="rounded-pill px-4" onClick={() => setShowAddressModal(true)}>
                  <FaPlus className="me-2" /> Add New Address
                </Button>
              </div>

              {(!user.addresses || user.addresses.length === 0) ? (
                <div className="text-center py-5 text-muted">
                  <FaMapMarkerAlt size={48} className="opacity-25 mb-3" />
                  <h5>No saved addresses</h5>
                  <p>Add your shipping addresses here to speed up future checkouts!</p>
                </div>
              ) : (
                <Row xs={1} md={2} className="g-3">
                  {user.addresses.map((addr, index) => (
                    <Col key={index}>
                      <Card className={`border rounded-4 h-100 p-3 ${addr.isDefault ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'}`}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold text-dark mb-0">{addr.name}</h6>
                          {addr.isDefault ? (
                            <Badge bg="primary"><FaCheck className="me-1" /> Default</Badge>
                          ) : (
                            <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => handleSetDefaultAddress(index)}>
                              Set Default
                            </Button>
                          )}
                        </div>
                        <p className="text-muted small mb-1">{addr.address}</p>
                        <p className="text-muted small mb-1">{addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-muted small mb-2"><FaPhone size={12} className="me-1" /> {addr.phone}</p>
                        <div className="text-end">
                          <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => handleDeleteAddress(index)}>
                            <FaTrash size={12} className="me-1" /> Remove
                          </Button>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add New Shipping Address</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddAddress}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Full Name *</Form.Label>
              <Form.Control type="text" value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Phone Number *</Form.Label>
              <Form.Control type="text" value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Street Address *</Form.Label>
              <Form.Control type="text" value={addressForm.address} onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })} required />
            </Form.Group>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Label className="fw-semibold">City *</Form.Label>
                <Form.Control type="text" value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} required />
              </Col>
              <Col md={6}>
                <Form.Label className="fw-semibold">State *</Form.Label>
                <Form.Control type="text" value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} required />
              </Col>
            </Row>
            <Row className="g-2 mb-3">
              <Col md={6}>
                <Form.Label className="fw-semibold">PIN / Postal Code *</Form.Label>
                <Form.Control type="text" value={addressForm.postalCode} onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })} required />
              </Col>
              <Col md={6}>
                <Form.Label className="fw-semibold">Country</Form.Label>
                <Form.Control type="text" value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} />
              </Col>
            </Row>
            <Form.Check 
              type="checkbox" 
              label="Set as default shipping address" 
              checked={addressForm.isDefault} 
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} 
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowAddressModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={addingAddress}>
              {addingAddress ? 'Saving...' : 'Save Address'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;