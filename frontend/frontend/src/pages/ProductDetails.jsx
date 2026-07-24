import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, FaRupeeSign, FaArrowLeft, FaShareAlt, 
  FaHeart, FaStar, FaTruck, FaShieldAlt, FaUndo, FaTag
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import Loader, { PageLoader } from '../components/Loader';
import { getProductById, createProductReview, deleteProductReview, saveCartToLocalStorage, getCartFromLocalStorage, toggleWishlist as apiToggleWishlist } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProduct = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await getProductById(id);
      setProduct(data.data || data);
      if (showLoader) setLoading(false);
      
      // Mock related products
      setRelatedProducts([
        { _id: '1', name: 'Related Product 1', price: 999, image: 'https://via.placeholder.com/150' },
        { _id: '2', name: 'Related Product 2', price: 1499, image: 'https://via.placeholder.com/150' },
      ]);
      
    } catch (err) {
      setError('Product not found or server error');
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct(true);
  }, [id]);

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    setSubmittingReview(true);
    try {
      await createProductReview(product._id, { rating, comment });
      toast.success('Review submitted successfully!');
      setComment('');
      setRating(5);
      fetchProduct(false); 
    } catch (err) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReviewHandler = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await deleteProductReview(product._id, reviewId);
        toast.success('Review deleted successfully');
        fetchProduct(false);
      } catch (err) {
        toast.error(err.message || 'Failed to delete review');
      }
    }
  };

  const addToCartHandler = () => {
    try {
      const cartItems = getCartFromLocalStorage();
      const existingItem = cartItems.find(item => item.product === product._id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error(`Only ${product.stock} items available in stock`);
          return;
        }
        existingItem.quantity = newQuantity;
      } else {
        cartItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          quantity: quantity
        });
      }
      
      saveCartToLocalStorage(cartItems);
      toast.success(`${quantity} × ${product.name} added to cart!`);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const buyNowHandler = () => {
    addToCartHandler();
    navigate('/checkout');
  };

  const toggleWishlistHandler = async () => {
    try {
      const res = await apiToggleWishlist(product._id);
      setIsInWishlist(res.inWishlist);
      toast.success(res.message);
    } catch (err) {
      toast.error('Please login to save to wishlist');
    }
  };

  if (loading) return <PageLoader />;

  if (error || !product) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block rounded-4 shadow-sm p-4">
          <h4 className="fw-bold">Oops!</h4>
          <p>{error || 'Product not found'}</p>
          <button className="btn-premium mt-2" onClick={() => navigate('/')}>
            <FaArrowLeft className="me-2" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/" className="text-decoration-none text-muted">Home</a></li>
          <li className="breadcrumb-item"><a href="/products" className="text-decoration-none text-muted">Products</a></li>
          <li className="breadcrumb-item"><a href={`/products?category=${product.category}`} className="text-decoration-none text-muted">{product.category}</a></li>
          <li className="breadcrumb-item active fw-bold text-dark" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="row g-5 mb-5">
        {/* Product Images */}
        <div className="col-lg-6">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="product-image-frame shadow-sm"
          >
            <img 
              src={product.image || 'https://via.placeholder.com/500x500?text=No+Image'} 
              alt={product.name}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/500x500?text=No+Image'; }}
            />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="d-flex justify-content-center gap-3 mt-4"
          >
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="glass-panel p-1 cursor-pointer" style={{ width: '80px', height: '80px' }}>
                <img 
                  src={product.image || 'https://via.placeholder.com/80x80?text=Thumb'} 
                  alt={`Thumb ${num}`}
                  className="w-100 h-100 object-fit-cover rounded"
                />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Product Info */}
        <div className="col-lg-6">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-5 h-100 d-flex flex-column"
          >
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <span className="premium-badge badge-info mb-3 d-inline-block">{product.category || 'Uncategorized'}</span>
                <h1 className="h2 fw-bold mb-3 text-dark">{product.name}</h1>
                <div className="d-flex align-items-center">
                  <div className="text-warning me-2 d-flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar key={star} size={18} color={star <= (product.rating || 0) ? '#f59e0b' : '#e5e7eb'} />
                    ))}
                  </div>
                  <span className="text-muted fw-bold">
                    {(product.rating || 0).toFixed(1)} <span className="fw-normal mx-1">•</span> {product.numReviews || 0} reviews
                  </span>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button 
                  onClick={toggleWishlistHandler}
                  className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: '45px', height: '45px', color: isInWishlist ? '#ef4444' : '#9ca3af' }}
                >
                  <FaHeart size={20} />
                </button>
                <button 
                  className="btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center text-primary"
                  style={{ width: '45px', height: '45px' }}
                >
                  <FaShareAlt size={18} />
                </button>
              </div>
            </div>

            <hr className="text-muted opacity-25 my-4" />

            <div className="mb-4 d-flex align-items-center flex-wrap gap-3">
              <h2 className="gradient-text fw-bold mb-0 display-5">
                <FaRupeeSign size={30} className="mb-1" />{product.price?.toLocaleString() || '0'}
              </h2>
              {product.originalPrice && (
                <>
                  <span className="text-muted text-decoration-line-through fs-5">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="premium-badge badge-danger px-3 py-2 fs-6">
                    Save {Math.round((1 - product.price/product.originalPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            <div className="mb-5">
              <div className="d-flex align-items-center mb-4">
                <span className={`premium-badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'} me-3 px-3 py-2`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
                <small className="text-muted fw-bold">SKU: {product._id?.substring(0, 8).toUpperCase()}</small>
              </div>
              
              <div className="d-flex flex-wrap gap-4 p-3 bg-light rounded-3 border">
                <div className="d-flex align-items-center text-dark fw-bold small">
                  <FaTruck className="me-2 text-primary fs-5" /> Free Delivery
                </div>
                <div className="d-flex align-items-center text-dark fw-bold small">
                  <FaShieldAlt className="me-2 text-success fs-5" /> 1 Year Warranty
                </div>
                <div className="d-flex align-items-center text-dark fw-bold small">
                  <FaUndo className="me-2 text-danger fs-5" /> 30 Days Return
                </div>
              </div>
            </div>

            <div className="mt-auto">
              {product.stock > 0 ? (
                <>
                  <div className="mb-4">
                    <label className="fw-bold mb-2 text-muted">Quantity</label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="d-flex align-items-center bg-white border rounded-pill overflow-hidden" style={{ width: '140px' }}>
                        <button className="btn border-0 text-muted px-3" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>-</button>
                        <input type="number" className="form-control border-0 text-center shadow-none fw-bold bg-transparent px-0" value={quantity} readOnly />
                        <button className="btn border-0 text-muted px-3" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>+</button>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-3">
                    <button className="btn-premium-outline flex-grow-1 py-3 fs-6" onClick={addToCartHandler}>
                      <FaShoppingCart className="me-2" /> Add to Cart
                    </button>
                    <button className="btn-premium flex-grow-1 py-3 fs-6" onClick={buyNowHandler}>
                      Buy Now
                    </button>
                  </div>
                </>
              ) : (
                <div className="alert alert-warning d-flex align-items-center fw-bold py-3 rounded-3">
                  <FaTag className="me-3 fs-4" /> This product is currently out of stock.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel mb-5 overflow-hidden"
      >
        <div className="d-flex border-bottom bg-light">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              className={`btn border-0 py-3 px-4 fw-bold text-capitalize rounded-0 ${activeTab === tab ? 'text-primary bg-white border-bottom border-primary border-3' : 'text-muted'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} {tab === 'reviews' && `(${product.numReviews || 0})`}
            </button>
          ))}
        </div>
        
        <div className="p-5 bg-white">
          <AnimatePresence mode="wait">
            {activeTab === 'description' && (
              <motion.div key="desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h4 className="fw-bold mb-4">Product Description</h4>
                <p className="text-muted lh-lg fs-5">{product.description}</p>
              </motion.div>
            )}
            
            {activeTab === 'specifications' && (
              <motion.div key="specs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h4 className="fw-bold mb-4">Specifications</h4>
                <div className="table-responsive">
                  <table className="table table-premium">
                    <tbody>
                      <tr><th style={{ width: '30%' }}>Brand</th><td>ShopEasy</td></tr>
                      <tr><th>Model</th><td>{product.name}</td></tr>
                      <tr><th>Category</th><td>{product.category}</td></tr>
                      <tr><th>Stock Status</th><td>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</td></tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="row g-5">
                  <div className="col-lg-7">
                    <h4 className="fw-bold mb-4">Customer Reviews</h4>
                    {!product.reviews || product.reviews.length === 0 ? (
                      <p className="text-muted bg-light p-4 rounded-3 border">No reviews yet. Be the first to review!</p>
                    ) : (
                      <div className="d-flex flex-column gap-4">
                        {product.reviews.map((review) => (
                          <div key={review._id} className="p-4 bg-light rounded-4 border">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div className="d-flex align-items-center gap-3">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                                  {review.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold">{review.name}</div>
                                  <small className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</small>
                                </div>
                              </div>
                              <div className="d-flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar key={star} size={14} color={star <= review.rating ? '#f59e0b' : '#e5e7eb'} />
                                ))}
                              </div>
                            </div>
                            <p className="text-secondary mb-0">{review.comment}</p>
                            {user && (user._id === review.user || user.role === 'admin') && (
                              <button className="btn btn-link text-danger p-0 mt-3 text-decoration-none fw-bold fs-6" onClick={() => deleteReviewHandler(review._id)}>
                                Delete Review
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="col-lg-5">
                    <h4 className="fw-bold mb-4">Write a Review</h4>
                    {user ? (
                      product.reviews?.some((r) => r.user?.toString() === user?._id?.toString()) ? (
                        <div className="alert alert-success rounded-3 fw-bold">You have already reviewed this product.</div>
                      ) : (
                        <form onSubmit={submitReviewHandler} className="bg-light p-4 rounded-4 border shadow-sm">
                          <div className="mb-3">
                            <label className="fw-bold text-muted mb-2">Rating</label>
                            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="input-premium bg-white w-100">
                              <option value="5">5 - Excellent</option>
                              <option value="4">4 - Very Good</option>
                              <option value="3">3 - Good</option>
                              <option value="2">2 - Fair</option>
                              <option value="1">1 - Poor</option>
                            </select>
                          </div>
                          <div className="mb-4">
                            <label className="fw-bold text-muted mb-2">Review</label>
                            <textarea rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." className="input-premium bg-white w-100" required />
                          </div>
                          <button type="submit" className="btn-premium w-100" disabled={submittingReview}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                        </form>
                      )
                    ) : (
                      <div className="alert alert-warning rounded-3">
                        Please <Link to="/login" className="fw-bold text-dark">login</Link> to write a review.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-5">
          <h3 className="fw-bold mb-4">You May Also Like</h3>
          <div className="row g-4">
            {relatedProducts.map((item) => (
              <div key={item._id} className="col-12 col-sm-6 col-lg-3">
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductDetails;