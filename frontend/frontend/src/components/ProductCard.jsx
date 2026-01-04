import React, { useState } from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaEye, FaHeart, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { saveCartToLocalStorage, getCartFromLocalStorage } from '../services/api';

const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);

  const addToCartHandler = () => {
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
      toast.success(`${product.name} added to cart!`);
      
      // Dispatch cart update event
      window.dispatchEvent(new Event('cartUpdated'));
      
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="product-card h-100 shadow-sm border-0">
      <div className="position-relative">
        <Card.Img 
          variant="top" 
          src={product.image || '/images/default-product.jpg'} 
          className="product-img"
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
          }}
        />
        <Badge 
          bg={product.stock > 10 ? "success" : product.stock > 0 ? "warning" : "danger"}
          className="position-absolute top-0 end-0 m-2"
        >
          {product.stock > 0 ? `Stock: ${product.stock}` : 'Out of Stock'}
        </Badge>
        <Button 
          variant="light" 
          size="sm" 
          className="position-absolute top-0 start-0 m-2 rounded-circle"
          style={{ width: '36px', height: '36px' }}
        >
          <FaHeart />
        </Button>
      </div>
      
      <Card.Body className="d-flex flex-column p-3">
        <Badge bg="secondary" className="align-self-start mb-2">
          {product.category || 'Uncategorized'}
        </Badge>
        
        <Card.Title className="mb-2 fs-6 fw-bold">
          <Link to={`/product/${product._id}`} className="text-decoration-none text-dark">
            {product.name}
          </Link>
        </Card.Title>
        
        <div className="d-flex align-items-center mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <FaStar 
              key={star} 
              className={star <= 4 ? "text-warning" : "text-muted"} 
              size={14}
            />
          ))}
          <small className="text-muted ms-2">(4.0)</small>
        </div>
        
        <Card.Text className="text-muted small mb-3 flex-grow-1">
          {product.description?.substring(0, 80) || 'No description available'}...
        </Card.Text>
        
        <div className="mt-auto">
          <Card.Text className="h5 fw-bold text-primary mb-3">
            ₹{product.price?.toLocaleString() || '0'}
          </Card.Text>
          
          <div className="d-grid gap-2">
            <Button 
              variant="outline-primary" 
              as={Link} 
              to={`/product/${product._id}`}
              className="d-flex align-items-center justify-content-center"
            >
              <FaEye className="me-2" /> View Details
            </Button>
            
            <Button 
              variant="primary" 
              onClick={addToCartHandler}
              disabled={product.stock === 0 || isAdding}
              className="d-flex align-items-center justify-content-center"
            >
              {isAdding ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Adding...
                </>
              ) : (
                <>
                  <FaShoppingCart className="me-2" /> 
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ProductCard;