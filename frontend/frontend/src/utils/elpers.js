// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Truncate text
export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strength = 0;
  if (password.length >= minLength) strength++;
  if (hasUpperCase) strength++;
  if (hasLowerCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecialChar) strength++;

  return {
    isValid: strength >= 3,
    strength: strength,
    messages: {
      length: password.length >= minLength ? '✓ Min 8 chars' : '✗ Min 8 chars',
      uppercase: hasUpperCase ? '✓ Uppercase' : '✗ Uppercase',
      lowercase: hasLowerCase ? '✓ Lowercase' : '✗ Lowercase',
      numbers: hasNumbers ? '✓ Numbers' : '✗ Numbers',
      special: hasSpecialChar ? '✓ Special chars' : '✗ Special chars'
    }
  };
};

// Get order status color
export const getOrderStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'processing': 'info',
    'shipped': 'primary',
    'delivered': 'success',
    'cancelled': 'danger'
  };
  return statusColors[status.toLowerCase()] || 'secondary';
};

// Get payment status color
export const getPaymentStatusColor = (status) => {
  const statusColors = {
    'pending': 'warning',
    'completed': 'success',
    'failed': 'danger',
    'refunded': 'info'
  };
  return statusColors[status.toLowerCase()] || 'secondary';
};

// Generate random ID
export const generateId = (prefix = '') => {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Local storage helper
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};