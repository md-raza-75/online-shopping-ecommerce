import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tab, Tabs, Badge } from 'react-bootstrap';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendarAlt, 
  FaEdit, 
  FaSave,
  FaShoppingBag,
  FaMapMarkerAlt,
  FaPhone,
  FaLock 
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getProfile } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

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
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    
    try {
      // TODO: Update profile API call
      // await updateProfile(formData);
      
      // Update local user data
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      
      // Update localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      localStorage.setItem('userInfo', JSON.stringify({
        ...userInfo,
        name: formData.name,
        email: formData.email
      }));
      
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
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Please login to view your profile
        </Alert>
        <div className="text-center">
          <Button variant="primary" href="/login">
            Go to Login
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={4}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center"
                     style={{ width: '100px', height: '100px' }}>
                  <FaUser size={40} className="text-white" />
                </div>
              </div>
              <h4 className="mb-1">{user.name}</h4>
              <p className="text-muted mb-2">{user.email}</p>
              <Badge bg={user.role === 'admin' ? "danger" : "primary"}>
                {user.role === 'admin' ? 'Administrator' : 'Customer'}
              </Badge>
              
              <div className="mt-4">
                <p className="mb-2">
                  <FaCalendarAlt className="me-2 text-muted" />
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0">
            <Card.Body>
              <h6 className="mb-3">Account Stats</h6>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Orders</span>
                <strong>12</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Pending Orders</span>
                <strong>2</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Total Spent</span>
                <strong>₹12,456</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">My Account</h4>
                <Button 
                  variant={editMode ? "success" : "outline-primary"} 
                  size="sm"
                  onClick={() => editMode ? handleSubmit() : setEditMode(true)}
                >
                  {editMode ? (
                    <>
                      <FaSave className="me-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FaEdit className="me-2" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>

              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="profile" title="Profile">
                  <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className={editMode ? '' : 'bg-light'}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            className={editMode ? '' : 'bg-light'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            <FaPhone className="me-2 text-muted" />
                            Phone Number
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={!editMode}
                            placeholder="Enter phone number"
                            className={editMode ? '' : 'bg-light'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FaMapMarkerAlt className="me-2 text-muted" />
                        Address
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!editMode}
                        placeholder="Enter your address"
                        className={editMode ? '' : 'bg-light'}
                      />
                    </Form.Group>

                    {editMode && (
                      <div className="d-flex gap-2">
                        <Button 
                          type="submit" 
                          variant="primary" 
                          disabled={updating}
                        >
                          {updating ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                              address: user.address || ''
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </Form>
                </Tab>

                <Tab eventKey="security" title="Security">
                  <div className="p-3">
                    <h5 className="mb-3">Change Password</h5>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter current password"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter new password"
                        />
                      </Form.Group>
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Confirm new password"
                        />
                      </Form.Group>
                      <Button variant="primary">
                        <FaLock className="me-2" />
                        Update Password
                      </Button>
                    </Form>
                  </div>
                </Tab>

                <Tab eventKey="orders" title="Orders">
                  <div className="p-3 text-center">
                    <div className="mb-3">
                      <FaShoppingBag size={48} className="text-muted" />
                    </div>
                    <h5>Order History</h5>
                    <p className="text-muted mb-4">
                      View your order history in the Orders section
                    </p>
                    <Button variant="outline-primary" href="/orders">
                      Go to Orders
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;