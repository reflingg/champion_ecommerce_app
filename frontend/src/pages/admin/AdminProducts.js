import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { FiBox, FiShoppingBag, FiUsers, FiMessageSquare, FiGrid, FiPlus, FiEdit, FiTrash2, FiUpload, FiX, FiImage } from 'react-icons/fi';

const AdminProducts = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const fileInputRef = useRef(null);
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
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', parseFloat(form.price));
      formData.append('category', form.category);
      formData.append('stock', parseInt(form.stock, 10));
      formData.append('material', form.material);
      formData.append('color', form.color);
      formData.append('featured', form.featured);
      if (form.dimensions.width) formData.append('dim_width', form.dimensions.width);
      if (form.dimensions.height) formData.append('dim_height', form.dimensions.height);
      if (form.dimensions.depth) formData.append('dim_depth', form.dimensions.depth);

      // Append new image files
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });

      // If editing and keeping existing images (no new files uploaded)
      if (editingProduct && imageFiles.length === 0 && existingImages.length > 0) {
        existingImages.forEach((url) => {
          formData.append('images', url);
        });
      }

      if (editingProduct) {
        await updateProduct(editingProduct._id, formData);
        showToast('Product updated!', 'success');
      } else {
        await createProduct(formData);
        showToast('Product created!', 'success');
      }
      setShowModal(false);
      setEditingProduct(null);
      setForm(emptyForm);
      setImageFiles([]);
      setExistingImages([]);
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
    setExistingImages(product.images || []);
    setImageFiles([]);
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const removeNewImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
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
          <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setForm(emptyForm); setImageFiles([]); setExistingImages([]); setShowModal(true); }}>
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
                  <th>Image</th>
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
                    <td>
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ width: '50px', height: '50px', background: '#f5e6c8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiImage style={{ color: '#B8860B' }} />
                        </div>
                      )}
                    </td>
                    <td>{product.category}</td>
                    <td>₦{product.price.toFixed(2)}</td>
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
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Price</label>
                    <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
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
                    <input type="text" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                    Featured Product
                  </label>
                </div>
                <div className="form-group">
                  <label>Product Images (max 5)</label>
                  <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                    <FiUpload style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>Click to upload images</p>
                  </div>
                  {existingImages.length > 0 && (
                    <>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '8px 0 4px' }}>Current images:</p>
                      <div className="image-previews">
                        {existingImages.map((url, idx) => (
                          <div key={`existing-${idx}`} className="image-preview-item">
                            <img src={url} alt={`Existing ${idx + 1}`} />
                            <button type="button" className="remove-image" onClick={() => removeExistingImage(idx)}>
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {imageFiles.length > 0 && (
                    <>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '8px 0 4px' }}>New images to upload:</p>
                      <div className="image-previews">
                        {imageFiles.map((file, idx) => (
                          <div key={`new-${idx}`} className="image-preview-item">
                            <img src={URL.createObjectURL(file)} alt={`New ${idx + 1}`} />
                            <button type="button" className="remove-image" onClick={() => removeNewImage(idx)}>
                              <FiX />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
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
