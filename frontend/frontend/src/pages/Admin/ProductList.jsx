import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaEye, FaPlus, FaSearch, 
  FaBox, FaArrowLeft, FaExclamationTriangle, FaCheck
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAdminProducts, deleteProduct } from '../../services/api';
import { PageLoader } from '../../components/Loader';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [stats, setStats] = useState({ totalProducts: 0, activeProducts: 0, outOfStock: 0, lowStock: 0 });

  useEffect(() => {
    fetchProducts();
  }, [page]); // Removed searchKeyword from dependency to allow manual search trigger

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (!userInfo || userInfo.role !== 'admin') {
        navigate('/login');
        return;
      }

      const data = await getAdminProducts(page, searchKeyword);
      const productsData = data.data || data;
      
      setProducts(productsData.products || []);
      setPages(productsData.pages || 1);
      setTotal(productsData.total || 0);
      
      const activeProducts = productsData.products?.filter(p => p.isActive).length || 0;
      const outOfStock = productsData.products?.filter(p => p.stock === 0).length || 0;
      const lowStock = productsData.products?.filter(p => p.stock > 0 && p.stock <= 5).length || 0;
      
      setStats({
        totalProducts: productsData.total || 0,
        activeProducts,
        outOfStock,
        lowStock
      });
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    try {
      await deleteProduct(deleteModal.product._id);
      toast.success('Product deleted successfully!');
      setDeleteModal({ show: false, product: null });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getStockBadge = (stock) => {
    if (stock > 10) return <span className="premium-badge badge-success px-2 py-1">In Stock ({stock})</span>;
    if (stock > 0) return <span className="premium-badge badge-warning px-2 py-1">Low ({stock})</span>;
    return <span className="premium-badge badge-danger px-2 py-1">Out of Stock</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? <span className="premium-badge badge-success px-3 py-1 d-inline-flex align-items-center gap-1"><FaCheck size={10}/> Active</span> 
                    : <span className="premium-badge badge-danger px-3 py-1">Inactive</span>;
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  if (loading) return <PageLoader />;

  return (
    <div className="container-fluid py-5 px-4 px-md-5 bg-light" style={{ minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to="/admin" className="btn btn-light rounded-circle shadow-sm p-2 text-primary" title="Back to Dashboard">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="h2 fw-bold text-dark d-flex align-items-center gap-3 m-0">
              <FaBox className="text-primary" /> Product Management
            </h1>
            <p className="text-muted mt-1 mb-0">Total {total} products found</p>
          </div>
        </div>
        <Link to="/admin/add-product" className="btn-premium px-4 py-2 text-decoration-none">
          <FaPlus className="me-2" /> Add New Product
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="row g-4 mb-5">
        {[
          { title: 'Total Products', value: stats.totalProducts, color: 'primary' },
          { title: 'Active', value: stats.activeProducts, color: 'success' },
          { title: 'Out of Stock', value: stats.outOfStock, color: 'danger' },
          { title: 'Low Stock', value: stats.lowStock, color: 'warning' },
        ].map((stat, i) => (
          <div key={i} className="col-xl-3 col-md-6">
            <div className="glass-card p-4 text-center hover-lift position-relative overflow-hidden h-100">
              <h2 className={`fw-bold text-${stat.color} mb-1 fs-1`}>{stat.value}</h2>
              <p className="text-muted fw-bold text-uppercase small m-0">{stat.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-4 mb-5">
        <form onSubmit={handleSearch}>
          <div className="row g-3">
            <div className="col-md-9 position-relative">
              <FaSearch className="position-absolute top-50 translate-middle-y text-muted" style={{ left: '20px' }} />
              <input
                type="text"
                placeholder="Search products by name, category..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input-premium w-100 py-3 ps-5"
              />
            </div>
            <div className="col-md-3">
              <button type="submit" className="btn-premium w-100 py-3 h-100 d-flex align-items-center justify-content-center gap-2">
                <FaSearch /> Search
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      {/* Products Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-0 overflow-hidden mb-5">
        <div className="table-responsive">
          <table className="table table-hover table-premium align-middle mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-4 px-4 text-muted">Product</th>
                <th className="py-4 text-muted">Category</th>
                <th className="py-4 text-muted">Price</th>
                <th className="py-4 text-muted text-center">Stock</th>
                <th className="py-4 text-muted text-center">Status</th>
                <th className="py-4 px-4 text-end text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {products.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan="6" className="text-center py-5">
                      <FaBox size={50} className="text-muted opacity-25 mb-3" />
                      <h5 className="text-dark fw-bold">No products found</h5>
                      <p className="text-muted">Try adjusting your search or add a new product.</p>
                    </td>
                  </motion.tr>
                ) : (
                  products.map((product, index) => (
                    <motion.tr key={product._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.05 }}>
                      <td className="py-4 px-4">
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="rounded shadow-sm"
                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'; }}
                          />
                          <div>
                            <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '200px' }}>{product.name}</div>
                            <small className="text-muted">ID: {product._id.substring(0, 8)}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="premium-badge badge-primary bg-opacity-10 text-primary px-3 py-1 fs-6">{product.category}</span>
                      </td>
                      <td className="py-4 fw-bold text-dark">{formatCurrency(product.price)}</td>
                      <td className="py-4 text-center">{getStockBadge(product.stock)}</td>
                      <td className="py-4 text-center">{getStatusBadge(product.isActive)}</td>
                      <td className="py-4 px-4 text-end">
                        <div className="d-flex justify-content-end gap-2 align-items-center">
                          <Link to={`/product/${product._id}`} className="btn btn-light rounded-circle shadow-sm text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }} title="View Product">
                            <FaEye />
                          </Link>
                          <Link to={`/admin/edit-product/${product._id}`} className="btn btn-light rounded-circle shadow-sm text-warning p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }} title="Edit Product">
                            <FaEdit />
                          </Link>
                          <button 
                            className="btn btn-light rounded-circle shadow-sm text-danger p-2 d-flex align-items-center justify-content-center" 
                            style={{ width: '35px', height: '35px' }} 
                            onClick={() => setDeleteModal({ show: true, product })}
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
      </motion.div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="d-flex justify-content-center">
          <div className="glass-card p-2 d-inline-flex gap-2 rounded-pill">
            <button className="btn btn-light rounded-pill px-3 fw-bold text-muted" disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
            {[...Array(pages).keys()].map((x) => (
              <button key={x + 1} className={`btn rounded-circle fw-bold ${x + 1 === page ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`} style={{ width: '40px', height: '40px' }} onClick={() => setPage(x + 1)}>
                {x + 1}
              </button>
            ))}
            <button className="btn btn-light rounded-pill px-3 fw-bold text-muted" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, product: null })} centered>
        <div className="glass-card border-0 p-4 text-center">
          <div className="mb-4">
            <div className="bg-danger bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
              <FaExclamationTriangle size={40} className="text-danger" />
            </div>
            <h4 className="fw-bold text-dark">Confirm Delete</h4>
            <p className="text-muted">Are you sure you want to delete <strong>{deleteModal.product?.name}</strong>?</p>
            <p className="small text-danger">This action cannot be undone.</p>
          </div>
          <div className="d-flex gap-3 justify-content-center">
            <button className="btn btn-light border fw-bold text-muted px-4 py-2" onClick={() => setDeleteModal({ show: false, product: null })}>Cancel</button>
            <button className="btn btn-danger px-4 py-2 fw-bold d-flex align-items-center gap-2" onClick={handleDeleteConfirm}>
              <FaTrash /> Delete Product
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductList;