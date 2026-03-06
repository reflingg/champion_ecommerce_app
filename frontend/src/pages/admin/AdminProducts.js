import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { FiBox, FiShoppingBag, FiUsers, FiMessageSquare, FiGrid, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminProducts = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const location = useLocation();

  const emptyForm = {
    name: '', description: '', price: '', category: 'living-room',
    stock: '', material: '', color: '', featured: false,
    dimensions: { width: '', height: '', depth: '' },
  };
  const [form, setForm] = useState(emptyForm);

  const fetchProducts = async () => {
    try {
      const { data } = await getProducts({ limit: 100 });
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id, productData);
        showToast('Product updated!', 'success');
      } else {
        await createProduct(productData);
        showToast('Product created!', 'success');
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm(emptyForm);
      fetchProducts();
    } catch (error) {
      showToast('Failed to save product', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      material: product.material || '',
      color: product.color || '',
      featured: product.featured,
      dimensions: product.dimensions || { width: '', height: '', depth: '' },
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      showToast('Product deleted', 'info');
      fetchProducts();
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <h2>Admin Panel</h2>
        <Link to="/admin" className={isActive('/admin')}><FiGrid /> Dashboard</Link>
        <Link to="/admin/products" className={isActive('/admin/products')}><FiBox /> Products</Link>
        <Link to="/admin/orders" className={isActive('/admin/orders')}><FiShoppingBag /> Orders</Link>
        <Link to="/admin/chats" className={isActive('/admin/chats')}><FiMessageSquare /> Chats</Link>
        <Link to="/">← Back to Store</Link>
      </div>

      <div className="admin-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Products</h1>
          <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setForm(emptyForm); setShowModal(true); }}>
            <FiPlus /> Add Product
          </button>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>{product.featured ? '⭐' : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => handleEdit(product)}>
                          <FiEdit />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product._id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows="3" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Price</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                      <option value="living-room">Living Room</option>
                      <option value="bedroom">Bedroom</option>
                      <option value="dining">Dining</option>
                      <option value="office">Office</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="storage">Storage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Material</label>
                    <input type="text" value={form.material} onChange={(e) => setForm({...form, material: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({...form, featured: e.target.checked})} />
                    Featured Product
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'Update' : 'Create'} Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
