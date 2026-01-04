import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    // Load cart from localStorage on initial load
    const savedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    setCartItems(savedCart);
    updateCartStats(savedCart);
    
    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      setCartItems(updatedCart);
      updateCartStats(updatedCart);
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const updateCartStats = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setCartCount(count);
    setCartTotal(total);
  };

  const addToCart = (product, quantity = 1) => {
    const existingItemIndex = cartItems.findIndex(item => item.product === product._id);
    let updatedCart;
    
    if (existingItemIndex >= 0) {
      updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity += quantity;
      
      // Check stock limit
      if (updatedCart[existingItemIndex].quantity > product.stock) {
        throw new Error(`Only ${product.stock} items available in stock`);
      }
    } else {
      updatedCart = [...cartItems, {
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity: quantity
      }];
    }
    
    saveCart(updatedCart);
    return updatedCart;
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item.product !== productId);
    saveCart(updatedCart);
    return updatedCart;
  };

  const updateQuantity = (productId, quantity) => {
    const updatedCart = cartItems.map(item => {
      if (item.product === productId) {
        const validQuantity = Math.max(1, Math.min(item.stock, quantity));
        return { ...item, quantity: validQuantity };
      }
      return item;
    });
    
    saveCart(updatedCart);
    return updatedCart;
  };

  const clearCart = () => {
    saveCart([]);
    return [];
  };

  const saveCart = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
    setCartItems(items);
    updateCartStats(items);
    
    // Dispatch event for other components
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getCartItemCount = () => {
    return cartCount;
  };

  const getCartTotal = () => {
    return cartTotal;
  };

  const calculateShipping = () => {
    return cartTotal >= 999 ? 0 : 100;
  };

  const calculateTax = () => {
    return cartTotal * 0.18;
  };

  const calculateGrandTotal = () => {
    const subtotal = cartTotal;
    const shipping = calculateShipping();
    const tax = calculateTax();
    return subtotal + shipping + tax;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartItemCount,
        getCartTotal,
        calculateShipping,
        calculateTax,
        calculateGrandTotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};