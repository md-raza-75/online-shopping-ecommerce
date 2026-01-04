import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSignInAlt, FaGoogle, FaFacebook } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { login } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(formData.email, formData.password);
      
      // Save user info to localStorage
      localStorage.setItem('userInfo', JSON.stringify(data.data));
      
      toast.success('Login successful!');
      navigate(redirect);
      
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Invalid email or password');
      toast.error('Login failed!');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const demoAccounts = {
      admin: { email: 'rohan@example.com', password: '123456' },
      user: { email: 'customer@example.com', password: '123456' }
    };
    
    setFormData(demoAccounts[role]);
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: '60px', height: '60px' }}>
                  <FaSignInAlt size={24} className="text-white" />
                </div>
                <h2 className="fw-bold">Welcome Back</h2>
                <p className="text-muted">Sign in to your account to continue shopping</p>
              </div>
              
              {error && (
                <Alert variant="danger" className="text-center">
                  {error}
                </Alert>
              )}
              
              {/* Demo Login Buttons */}
              <div className="mb-4">
                <p className="text-muted text-center mb-2">Quick Demo Login:</p>
                <div className="d-flex gap-2 justify-content-center">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => demoLogin('admin')}
                  >
                    Admin Login
                  </Button>
                  <Button 
                    variant="outline-success" 
                    size="sm"
                    onClick={() => demoLogin('user')}
                  >
                    Customer Login
                  </Button>
                </div>
              </div>
              
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                  <div className="text-end mt-2">
                    <Link to="/forgot-password" className="text-decoration-none small">
                      Forgot password?
                    </Link>
                  </div>
                </Form.Group>

                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-100 py-2 mb-3 fw-bold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <div className="text-center mb-4">
                  <span className="text-muted">or continue with</span>
                </div>
                
                <div className="d-grid gap-2 mb-4">
                  <Button variant="outline-danger" className="d-flex align-items-center justify-content-center">
                    <FaGoogle className="me-2" /> Sign in with Google
                  </Button>
                  <Button variant="outline-primary" className="d-flex align-items-center justify-content-center">
                    <FaFacebook className="me-2" /> Sign in with Facebook
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  Don't have an account?{' '}
                  <Link to={redirect ? `/register?redirect=${redirect}` : '/register'} 
                        className="text-decoration-none fw-bold">
                    Create Account
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

export default Login;