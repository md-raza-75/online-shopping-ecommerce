import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000,
});

// Request interceptor to add token
API.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Network Error. Please try again.';
    
    // Auto logout on 401
    if (error.response?.status === 401) {
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    }
    
    return Promise.reject(errorMessage);
  }
);

// Auth APIs
export const login = (email, password) => 
  API.post('/auth/login', { email, password });

export const register = (name, email, password) => 
  API.post('/auth/register', { name, email, password });

export const getProfile = () => 
  API.get('/auth/profile');

export const getUsers = () => 
  API.get('/auth/users');

// Product APIs
export const getProducts = () => 
  API.get('/products');

export const getProductById = (id) => 
  API.get(`/products/${id}`);

export const createProduct = (productData) => 
  API.post('/products', productData);

export const updateProduct = (id, productData) => 
  API.put(`/products/${id}`, productData);

export const deleteProduct = (id) => 
  API.delete(`/products/${id}`);

// Order APIs
export const createOrder = (orderData) => 
  API.post('/orders', orderData);

export const getMyOrders = () => 
  API.get('/orders/myorders');

export const getOrderById = (id) => 
  API.get(`/orders/${id}`);

export const getAllOrders = () => 
  API.get('/orders');

export const updateOrderStatus = (id, status) => 
  API.put(`/orders/${id}/status`, { orderStatus: status });

export const updateOrderToPaid = (id, paymentId) => 
  API.put(`/orders/${id}/pay`, { paymentId });

// Cart helper functions
export const saveCartToLocalStorage = (cartItems) => {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
};

export const getCartFromLocalStorage = () => {
  const cartItems = localStorage.getItem('cartItems');
  return cartItems ? JSON.parse(cartItems) : [];
};

export const clearCartFromLocalStorage = () => {
  localStorage.removeItem('cartItems');
};

export default API;