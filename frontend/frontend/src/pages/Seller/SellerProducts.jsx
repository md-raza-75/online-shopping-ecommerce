import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import { 
  FaBox, FaPlus, FaEdit, FaTrash, FaSearch, FaArrowLeft, FaTimes, FaSync, FaRupeeSign
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getSellerProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const SellerProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Electronics',
    image: ''
  });

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');

  useEffect(() => {
    if (!userInfo || (userInfo.role !== 'seller' && userInfo.role !== 'admin')) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getSellerProducts();
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditMode(false);
    setSelectedProductId(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'Electronics',
      image: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditMode(true);
    setSelectedProductId(prod._id);
    setFormData({
      name: prod.name || '',
      description: prod.description || '',
      price: prod.price || '',
      stock: prod.stock || '',
      category: prod.category || 'Electronics',
      image: prod.image || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        stock: Number(formData.stock),
        category: formData.category,
        image: formData.image || '/images/default-product.jpg'
      };

      if (editMode && selectedProductId) {
        await updateProduct(selectedProductId, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product created successfully');
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product removed successfully');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);

  if (loading && products.length === 0) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/seller" className="btn btn-light rounded-circle shadow-sm p-2 text-primary">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark m-0 d-flex align-items-center gap-2">
              <FaBox className="text-primary" /> My Products
            </h1>
            <p className="text-muted m-0">Manage products listed under your vendor store</p>
          </div>
        </div>
        <div className="d-flex gap-2">
          <button onClick={fetchProducts} className="btn btn-light border px-3 py-2 rounded-3">
            <FaSync />
          </button>
          <button onClick={handleOpenAddModal} className="btn-premium px-4 py-2">
            <FaPlus className="me-2" /> Add Product
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 mb-4">
        <div className="position-relative">
          <FaSearch className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '15px' }} />
          <input
            type="text"
            className="input-premium w-100 ps-5"
            placeholder="Search your products by title or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="glass-panel p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover table-premium align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3">Category</th>
                <th className="py-3">Price</th>
                <th className="py-3 text-center">Stock</th>
                <th className="py-3 px-4 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      <FaBox size={48} className="opacity-25 mb-3" />
                      <h5>No products found</h5>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => (
                    <motion.tr key={prod._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td className="py-3 px-4">
                        <div className="d-flex align-items-center gap-3">
                          {prod.image && (
                            <img 
                              src={prod.image} 
                              alt={prod.name} 
                              className="rounded-3" 
                              style={{ width: 45, height: 45, objectFit: 'cover' }} 
                            />
                          )}
                          <div>
                            <strong className="text-dark d-block fs-6">{prod.name}</strong>
                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: 260 }}>{prod.description}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2 rounded-pill">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 fw-bold text-dark">
                        {formatCurrency(prod.price)}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`badge px-3 py-2 rounded-pill ${prod.stock > 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                          {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button 
                            className="btn btn-light rounded-circle text-primary p-2" 
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit Product"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn btn-light rounded-circle text-danger p-2" 
                            onClick={() => handleDelete(prod._id)}
                            title="Delete Product"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <div className="glass-card border-0 p-4 rounded-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold m-0 text-dark">
              {editMode ? '✏️ Edit Product' : '➕ Add New Product'}
            </h4>
            <button className="btn btn-light rounded-circle p-2 text-muted" onClick={() => setShowModal(false)}>
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label fw-bold text-dark small">Product Title</label>
                <input
                  type="text"
                  className="input-premium w-100"
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-bold text-dark small">Category</label>
                <select
                  className="input-premium w-100"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home</option>
                  <option value="Books">Books</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-dark small">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="input-premium w-100"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold text-dark small">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="input-premium w-100"
                  placeholder="0"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-dark small">Image URL</label>
                <input
                  type="url"
                  className="input-premium w-100"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image}
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-dark small">Description</label>
                <textarea
                  rows="4"
                  className="input-premium w-100"
                  placeholder="Describe your product specifications and features..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-3 mt-4">
              <button 
                type="button" 
                className="btn btn-light border px-4 py-2 rounded-3" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-premium px-4 py-2" 
                disabled={submitting}
              >
                {submitting ? <span className="spinner-border spinner-border-sm" /> : (editMode ? 'Save Changes' : 'Publish Product')}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default SellerProducts;
