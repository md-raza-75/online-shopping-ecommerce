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
    let errorMessage = 'Network Error. Please try again.';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || 
                    error.response.data?.error || 
                    `Server Error: ${error.response.status}`;
      
      // Auto logout on 401
      if (error.response.status === 401) {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('cartItems');
        localStorage.removeItem('appliedCoupon');
        localStorage.removeItem('checkoutCoupon');
        window.dispatchEvent(new Event('userLogout'));
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 404 errors
      if (error.response.status === 404) {
        errorMessage = 'Resource not found';
      }
      
      // Handle 500 errors
      if (error.response.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }
    } else if (error.request) {
      // Request made but no response
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request
      errorMessage = error.message;
    }
    
    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

// ========== COUPON APIs ==========
export const validateCoupon = (couponCode, orderAmount) => {
  return API.post('/orders/validate-coupon', { code: couponCode, orderAmount });
};

export const getCoupons = () => {
  return API.get('/coupons');
};

export const createCoupon = (couponData) => {
  return API.post('/coupons', couponData);
};

export const updateCoupon = (couponId, couponData) => {
  return API.put(`/coupons/${couponId}`, couponData);
};

export const deleteCoupon = (couponId) => {
  return API.delete(`/coupons/${couponId}`);
};

// ========== AUTH APIs ==========
export const login = (email, password) => 
  API.post('/auth/login', { email, password });

export const register = (name, email, password) => 
  API.post('/auth/register', { name, email, password });

export const getProfile = () => 
  API.get('/auth/profile');

export const getUsers = () => 
  API.get('/auth/users');

export const updateProfile = (userData) => 
  API.put('/auth/profile', userData);

// ========== PRODUCT APIs ==========
export const getProducts = (params = {}) => 
  API.get('/products', { params });

export const getProductById = (id) => 
  API.get(`/products/${id}`);

export const createProduct = (productData) => 
  API.post('/products', productData);

export const updateProduct = (id, productData) => 
  API.put(`/products/${id}`, productData);

export const deleteProduct = (id) => 
  API.delete(`/products/${id}`);

export const getAdminProducts = (page = 1, keyword = '') => 
  API.get(`/products/admin/all`, { 
    params: { page, keyword } 
  });

// ========== ORDER APIs ==========
export const createOrder = (orderData) => 
  API.post('/orders', orderData);

export const getMyOrders = () => 
  API.get('/orders/myorders');

export const getOrderById = (id) => 
  API.get(`/orders/${id}`);

export const getAllOrders = () => 
  API.get('/orders');

export const updateOrderStatus = (id, statusData) => 
  API.put(`/orders/${id}/status`, statusData);

export const updateOrderToPaid = (id, paymentId) => 
  API.put(`/orders/${id}/pay`, { paymentId });

export const verifyPayment = (orderId, paymentData) => 
  API.post(`/orders/${orderId}/verify-payment`, paymentData);

// ========== INVOICE APIs ==========
export const downloadInvoice = async (orderId) => {
  try {
    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${user.token}`,
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: `Server error: ${response.status}` };
      }
      
      throw new Error(errorData.message || `Failed to download invoice: ${response.status}`);
    }

    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Empty PDF received from server');
    }
    
    if (!blob.type.includes('pdf')) {
      const text = await blob.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Server returned error instead of PDF');
      } catch {
        throw new Error('Server returned invalid PDF file');
      }
    }
    
    return { data: blob };
    
  } catch (error) {
    console.error('Invoice download error:', error);
    throw error;
  }
};

export const downloadInvoiceAxios = async (orderId) => {
  try {
    const response = await API.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    return response;
  } catch (error) {
    console.error('Axios invoice download error:', error);
    throw error;
  }
};

export const getInvoiceStatus = (orderId) => 
  API.get(`/orders/${orderId}/invoice-status`);

// ========== CART Helper Functions ==========
export const saveCartToLocalStorage = (cartItems) => {
  try {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
    return true;
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
    return false;
  }
};

export const getCartFromLocalStorage = () => {
  try {
    const cartItems = localStorage.getItem('cartItems');
    return cartItems ? JSON.parse(cartItems) : [];
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return [];
  }
};

export const clearCartFromLocalStorage = () => {
  try {
    localStorage.removeItem('cartItems');
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('checkoutCoupon');
    window.dispatchEvent(new Event('cartUpdated'));
    return true;
  } catch (error) {
    console.error('Error clearing cart from localStorage:', error);
    return false;
  }
};

export const addToCart = (product, quantity = 1) => {
  try {
    const cartItems = getCartFromLocalStorage();
    
    const existingItemIndex = cartItems.findIndex(item => item.product === product._id);
    
    if (existingItemIndex > -1) {
      cartItems[existingItemIndex].quantity += quantity;
      
      if (cartItems[existingItemIndex].quantity > cartItems[existingItemIndex].stock) {
        cartItems[existingItemIndex].quantity = cartItems[existingItemIndex].stock;
        throw new Error(`Only ${cartItems[existingItemIndex].stock} items available in stock`);
      }
    } else {
      cartItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: Math.min(quantity, product.stock)
      });
    }
    
    saveCartToLocalStorage(cartItems);
    return cartItems;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

export const removeFromCart = (productId) => {
  try {
    const cartItems = getCartFromLocalStorage();
    const updatedCart = cartItems.filter(item => item.product !== productId);
    saveCartToLocalStorage(updatedCart);
    
    if (updatedCart.length === 0) {
      localStorage.removeItem('appliedCoupon');
    }
    
    return updatedCart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

export const updateCartQuantity = (productId, quantity) => {
  try {
    const cartItems = getCartFromLocalStorage();
    const updatedCart = cartItems.map(item => {
      if (item.product === productId) {
        const newQuantity = Math.max(1, Math.min(quantity, item.stock));
        if (newQuantity > item.stock) {
          throw new Error(`Only ${item.stock} items available in stock`);
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    saveCartToLocalStorage(updatedCart);
    
    // Clear coupon when quantity changes
    localStorage.removeItem('appliedCoupon');
    
    return updatedCart;
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    throw error;
  }
};

export const getCartItemCount = () => {
  try {
    const cartItems = getCartFromLocalStorage();
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
};

export const getCartTotal = () => {
  try {
    const cartItems = getCartFromLocalStorage();
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
};

// ========== COUPON Helper Functions ==========
export const saveCouponToLocalStorage = (coupon) => {
  try {
    localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    return true;
  } catch (error) {
    console.error('Error saving coupon to localStorage:', error);
    return false;
  }
};

export const getCouponFromLocalStorage = () => {
  try {
    const coupon = localStorage.getItem('appliedCoupon');
    return coupon ? JSON.parse(coupon) : null;
  } catch (error) {
    console.error('Error loading coupon from localStorage:', error);
    return null;
  }
};

export const removeCouponFromLocalStorage = () => {
  try {
    localStorage.removeItem('appliedCoupon');
    localStorage.removeItem('checkoutCoupon');
    return true;
  } catch (error) {
    console.error('Error removing coupon from localStorage:', error);
    return false;
  }
};

export const calculateCouponDiscount = (coupon, subtotal) => {
  if (!coupon) return 0;
  
  let discount = 0;
  
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }
  
  return Math.min(discount, subtotal);
};

// ========== Utility Functions ==========
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 6;
};

// ========== User Management ==========
export const triggerUserLogin = () => {
  window.dispatchEvent(new Event('userLogin'));
};

export const triggerUserLogout = () => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('cartItems');
  localStorage.removeItem('appliedCoupon');
  localStorage.removeItem('checkoutCoupon');
  window.dispatchEvent(new Event('userLogout'));
};

// ========== PDF Download Helper ==========
export const downloadPDF = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};

// ========== Order Helper ==========
export const calculateOrderTotal = (items, coupon = null) => {
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal >= 999 ? 0 : 100;
  const tax = subtotal * 0.18;
  
  let discount = 0;
  if (coupon) {
    discount = calculateCouponDiscount(coupon, subtotal);
  }
  
  return {
    subtotal,
    shipping,
    tax,
    discount,
    total: Math.max(0, subtotal + shipping + tax - discount)
  };
};

// ========== Debug Functions ==========
export const debugAPI = () => {
  const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
  const cart = getCartFromLocalStorage();
  const coupon = getCouponFromLocalStorage();
  
  console.log('=== API DEBUG INFO ===');
  console.log('User:', user);
  console.log('Cart Items:', cart);
  console.log('Cart Count:', getCartItemCount());
  console.log('Cart Total:', getCartTotal());
  console.log('Applied Coupon:', coupon);
  console.log('API URL:', API_URL);
  console.log('=====================');
};

// ========== Export Default ==========
export default {
  // Auth
  login,
  register,
  getProfile,
  getUsers,
  updateProfile,
  
  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  
  // Orders
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateOrderToPaid,
  verifyPayment,
  
  // Coupons
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  
  // Invoice
  downloadInvoice,
  downloadInvoiceAxios,
  getInvoiceStatus,
  
  // Cart
  saveCartToLocalStorage,
  getCartFromLocalStorage,
  clearCartFromLocalStorage,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartItemCount,
  getCartTotal,
  
  // Utilities
  formatCurrency,
  validateEmail,
  validatePassword,
  triggerUserLogin,
  triggerUserLogout,
  downloadPDF,
  calculateOrderTotal,
  debugAPI
};