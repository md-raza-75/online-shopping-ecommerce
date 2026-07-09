import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaFilter, FaExclamationTriangle, 
  FaShoppingBag, FaTimes
} from 'react-icons/fa';
import { getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, categoryFilter, sortBy]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      const productsData = data.data || data;
      setProducts(productsData);
      setFilteredProducts(productsData);
      
      const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'name': filtered.sort((a, b) => a.name?.localeCompare(b.name)); break;
      case 'newest': filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
      default: break;
    }
    setFilteredProducts(filtered);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    filterAndSortProducts();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <Loader />
        <h4 className="mt-4 text-muted">Loading Products...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger d-inline-block rounded-4 shadow-sm p-4">
          <FaExclamationTriangle size={48} className="mb-3 text-danger" />
          <h4 className="fw-bold">Oops!</h4>
          <p>{error}</p>
          <button className="btn-premium mt-2" onClick={fetchProducts}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5"
      >
        <h1 className="display-4 fw-bold mb-3 gradient-text">
          <FaShoppingBag className="me-2 text-primary" />
          Shop Premium
        </h1>
        <p className="lead text-muted">Discover amazing products at great prices</p>
      </motion.div>

      {/* Filters Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 mb-5"
      >
        <div className="row g-3">
          <div className="col-md-5">
            <form onSubmit={handleSearch} className="position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y text-muted ms-3" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium ps-5"
              />
            </form>
          </div>
          
          <div className="col-md-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-premium"
            >
              <option value="all">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="col-md-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-premium"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Low to High</option>
              <option value="price-high">High to Low</option>
              <option value="name">A to Z</option>
            </select>
          </div>
          
          <div className="col-md-2">
            <button
              className="btn-premium-outline w-100 h-100"
              onClick={clearFilters}
              style={{ padding: '0.5rem' }}
            >
              <FaFilter className="me-2" /> Clear
            </button>
          </div>
        </div>
        
        <div className="mt-3 text-muted small fw-bold">
          Showing {filteredProducts.length} of {products.length} products
          {searchTerm && ` for "${searchTerm}"`}
          {categoryFilter !== 'all' && ` in ${categoryFilter}`}
        </div>
      </motion.div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-5 glass-panel"
        >
          <FaSearch size={64} className="text-muted mb-4 opacity-50" />
          <h4 className="fw-bold text-dark">No products found</h4>
          <p className="text-muted mb-4">Try adjusting your search or filters.</p>
          {(searchTerm || categoryFilter !== 'all') && (
            <button className="btn-premium" onClick={clearFilters}>Clear All Filters</button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="row g-4"
        >
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div 
                key={product._id} 
                layout
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Products;