import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Table, Badge, Button, 
  Form, Alert, Pagination, Modal 
} from 'react-bootstrap';
import { 
  FaEdit, FaTrash, FaEye, FaPlus, FaSearch, 
  FaBox, FaArrowLeft, FaExclamationTriangle 
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAdminProducts, deleteProduct } from '../../services/api';
import Loader, { PageLoader } from '../../components/Loader';

const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    outOfStock: 0,
    lowStock: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [page, searchKeyword]);

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
      
      // Calculate stats
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
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDeleteClick = (product) => {
    setDeleteModal({ show: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.product) return;
    
    try {
      await deleteProduct(deleteModal.product._id);
      toast.success('Product deleted successfully!');
      setDeleteModal({ show: false, product: null });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const getStockBadge = (stock) => {
    if (stock > 10) {
      return <Badge bg="success">{stock}</Badge>;
    } else if (stock > 0) {
      return <Badge bg="warning">{stock}</Badge>;
    } else {
      return <Badge bg="danger">Out</Badge>;
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge bg="success">Active</Badge>
    ) : (
      <Badge bg="danger">Inactive</Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <PageLoader />;

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" as={Link} to="/admin" className="me-3">
            <FaArrowLeft className="me-2" />
            Back to Dashboard
          </Button>
          <h1 className="h3 fw-bold d-inline-block mb-0">
            <FaBox className="me-2" />
            Product Management
          </h1>
        </div>
        <Button as={Link} to="/admin/add-product" variant="primary">
          <FaPlus className="me-2" />
          Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <h3 className="text-primary">{stats.totalProducts}</h3>
              <p className="text-muted mb-0">Total Products</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <h3 className="text-success">{stats.activeProducts}</h3>
              <p className="text-muted mb-0">Active</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <h3 className="text-danger">{stats.outOfStock}</h3>
              <p className="text-muted mb-0">Out of Stock</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm text-center">
            <Card.Body>
              <h3 className="text-warning">{stats.lowStock}</h3>
              <p className="text-muted mb-0">Low Stock</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search Bar */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={9}>
                <Form.Control
                  type="text"
                  placeholder="Search products by name, category..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="py-2"
                />
              </Col>
              <Col md={3}>
                <Button
                  type="submit"
                  variant="info"
                  className="w-100 py-2 d-flex align-items-center justify-content-center"
                >
                  <FaSearch className="me-2" />
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="text-muted">
                        <FaBox size={48} className="mb-3" />
                        <h5>No products found</h5>
                        <p>Try adjusting your search or add a new product</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product, index) => (
                    <tr key={product._id}>
                      <td>{(page - 1) * 20 + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="rounded me-3"
                            style={{
                              width: '60px',
                              height: '60px',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                            }}
                          />
                          <div>
                            <div className="fw-bold">{product.name}</div>
                            <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                              {product.description?.substring(0, 50)}...
                            </small>
                            <small className="text-muted">
                              ID: {product._id.substring(0, 8)}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg="secondary">{product.category}</Badge>
                      </td>
                      <td className="fw-bold">{formatCurrency(product.price)}</td>
                      <td>{getStockBadge(product.stock)}</td>
                      <td>{getStatusBadge(product.isActive)}</td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            variant="outline-info"
                            size="sm"
                            as={Link}
                            to={`/product/${product._id}`}
                            title="View Product"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            as={Link}
                            to={`/admin/edit-product/${product._id}`}
                            title="Edit Product"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(product)}
                            title="Delete Product"
                            disabled={!product.isActive}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            />
            
            {[...Array(pages).keys()].map((x) => (
              <Pagination.Item
                key={x + 1}
                active={x + 1 === page}
                onClick={() => setPage(x + 1)}
              >
                {x + 1}
              </Pagination.Item>
            ))}
            
            <Pagination.Next
              onClick={() => setPage(page + 1)}
              disabled={page === pages}
            />
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, product: null })} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationTriangle className="me-2 text-danger" />
            Confirm Delete
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            <h6>Are you sure you want to delete this product?</h6>
            <p className="mb-2">
              <strong>{deleteModal.product?.name}</strong>
            </p>
            <p className="mb-0 text-muted">
              This product will be marked as inactive and won't be visible to customers.
              This action can be reversed by editing the product.
            </p>
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal({ show: false, product: null })}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            <FaTrash className="me-2" />
            Delete Product
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductList;