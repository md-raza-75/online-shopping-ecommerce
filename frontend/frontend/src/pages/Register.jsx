import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUserPlus, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { register } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    // Check if user is already logged in
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (userInfo && userInfo.token) {
      navigate(redirect);
    }
  }, [navigate, redirect]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (formData.password.length >= 8) strength += 1;
    if (/[A-Z]/.test(formData.password)) strength += 1;
    if (/[0-9]/.test(formData.password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 1;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 2) {
      setError('Password is too weak. Use at least 8 characters with mix of letters and numbers.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const data = await register(formData.name, formData.email, formData.password);
      
      // Save user info to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data.data));
      
      toast.success('Registration successful! Welcome to ShopEasy!');
      navigate(redirect);
      
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Registration failed. Please try again.');
      toast.error('Registration failed!');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'transparent';
    if (passwordStrength === 1) return 'danger';
    if (passwordStrength === 2) return 'warning';
    if (passwordStrength === 3) return 'info';
    return 'success';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return 'No password';
    if (passwordStrength === 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: '60px', height: '60px' }}>
                  <FaUserPlus size={24} className="text-white" />
                </div>
                <h2 className="fw-bold">Create Account</h2>
                <p className="text-muted">Join thousands of happy shoppers</p>
              </div>
              
              {error && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlId="name">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                  <Form.Text className="text-muted">
                    We'll never share your email with anyone else.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                  <div className="mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <small>Password Strength:</small>
                      <small className={`text-${getStrengthColor()} fw-bold`}>
                        {getStrengthText()}
                      </small>
                    </div>
                    <div className="progress" style={{ height: '4px' }}>
                      <div 
                        className={`progress-bar bg-${getStrengthColor()}`}
                        style={{ width: `${passwordStrength * 25}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">
                      Use at least 8 characters with mix of letters, numbers & symbols
                    </small>
                  </div>
                </Form.Group>

                <Form.Group className="mb-4" controlId="confirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="terms">
                  <Form.Check
                    type="checkbox"
                    label={
                      <>
                        I agree to the{' '}
                        <Link to="/terms" className="text-decoration-none">
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-decoration-none">
                          Privacy Policy
                        </Link>
                      </>
                    }
                    required
                  />
                </Form.Group>

                <Button 
                  variant="success" 
                  type="submit" 
                  className="w-100 py-2 mb-3 fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="me-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  Already have an account?{' '}
                  <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} 
                        className="text-decoration-none fw-bold">
                    Sign In
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;