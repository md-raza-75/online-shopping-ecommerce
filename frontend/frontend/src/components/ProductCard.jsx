import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaEye, FaHeart, FaStar, FaBolt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { saveCartToLocalStorage, getCartFromLocalStorage } from '../services/api';

const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCartHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    try {
      const cartItems = getCartFromLocalStorage();
      const existingItem = cartItems.find(item => item.product === product._id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast.error('Maximum stock reached!');
          return;
        }
        existingItem.quantity += 1;
      } else {
        cartItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: 1
        });
      }
      
      saveCartToLocalStorage(cartItems);
      toast.success(`✅ ${product.name} added to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setTimeout(() => setIsAdding(false), 600);
    }
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ height: '100%' }}
    >
      <div className="product-card" style={{ height: '100%' }}>
        {/* Image Area */}
        <div className="product-card-image">
          {/* Wishlist Button */}
          <button 
            onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
            style={{ 
              position: 'absolute', top: '12px', left: '12px',
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'white', border: 'none',
              color: isWishlisted ? '#ef4444' : '#cbd5e1',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease', zIndex: 2, fontSize: '0.85rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = isWishlisted ? '#ef4444' : '#cbd5e1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <FaHeart />
          </button>

          {/* Stock Badge */}
          <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
            {isOutOfStock ? (
              <span className="premium-badge badge-danger" style={{ fontSize: '0.68rem' }}>Out of Stock</span>
            ) : isLowStock ? (
              <span className="premium-badge badge-warning" style={{ fontSize: '0.68rem' }}>Only {product.stock} left</span>
            ) : null}
          </div>

          <Link to={`/product/${product._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <img 
              src={product.image || '/images/default-product.jpg'} 
              alt={product.name}
              style={{ 
                maxHeight: '175px', maxWidth: '100%', objectFit: 'contain',
                transition: 'transform 0.5s ease',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'; }}
              className="product-card-img-hover"
            />
          </Link>
        </div>

        {/* Card Body */}
        <div className="product-card-body">
          {/* Category */}
          <div className="category-tag mb-2" style={{ fontSize: '0.68rem' }}>
            {product.category || 'Uncategorized'}
          </div>

          {/* Title */}
          <h3 className="product-card-title mb-2">
            <Link to={`/product/${product._id}`} className="text-decoration-none" style={{ color: '#0f172a' }}>
              {product.name}
            </Link>
          </h3>

          {/* Stars */}
          <div className="d-flex align-items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar key={star} color={star <= 4 ? '#f59e0b' : '#e2e8f0'} size={12} />
            ))}
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginLeft: '4px' }}>(4.0)</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1rem', flexGrow: 1 }}>
            {product.description?.substring(0, 75) || 'No description available'}...
          </p>

          {/* Price */}
          <div className="product-card-price mt-auto mb-3">
            ₹{product.price?.toLocaleString('en-IN') || '0'}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link 
              to={`/product/${product._id}`} 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: '0.55rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0',
                color: '#4f46e5', fontWeight: 700, fontSize: '0.85rem', background: 'transparent',
                transition: 'all 0.2s ease', textDecoration: 'none'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = 'rgba(79,70,229,0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; }}
            >
              <FaEye size={13} /> View Details
            </Link>

            <button
              onClick={addToCartHandler}
              disabled={isOutOfStock || isAdding}
              className="product-card-add-btn"
              style={{
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
              }}
            >
              {isAdding ? (
                <><span className="spinner-border spinner-border-sm"></span> Adding...</>
              ) : isOutOfStock ? (
                <>Out of Stock</>
              ) : (
                <><FaShoppingCart size={13} /> Add to Cart</>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .product-card:hover .product-card-img-hover {
          transform: scale(1.06);
        }
      `}</style>
    </motion.div>
  );
};

export default ProductCard;