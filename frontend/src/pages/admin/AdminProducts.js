import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { FiBox, FiShoppingBag, FiMessageSquare, FiGrid, FiPlus, FiEdit, FiTrash2, FiUploadCloud, FiX, FiImage, FiCamera } from 'react-icons/fi';

const AdminProducts = ({ showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [dragActive, setDragActive] = useState(false);
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

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const processFiles = useCallback((files) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Please select image files only', 'error');
      return;
    }
    const totalSlots = 5 - existingImages.length;
    const newFiles = validFiles.slice(0, totalSlots - imageFiles.length);
    if (newFiles.length < validFiles.length) {
      showToast(`Max 5 images total. Added ${newFiles.length} of ${validFiles.length}.`, 'info');
    }
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [existingImages.length, imageFiles.length, showToast]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const removeNewImage = (idx) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
      closeModal();
      fetchProducts();
    } catch (error) {
      showToast('Failed to save product', 'error');
    } finally {
      setSubmitting(false);
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
    setImagePreviews([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setImageFiles([]);
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    setImagePreviews([]);
    setExistingImages([]);
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
  const totalImages = existingImages.length + imageFiles.length;

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
          <button className="btn btn-primary" onClick={() => { closeModal(); setShowModal(true); }}>
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
                    <td><strong>{product.name}</strong></td>
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
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
                <button type="button" onClick={closeModal} style={{ background: 'none', fontSize: '1.3rem', color: 'var(--text-light)', padding: '4px' }}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                {/* Image Picker - Top of form for prominence */}
                <div className="form-group">
                  <label style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCamera /> Product Images
                    <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-light)' }}>({totalImages}/5)</span>
                  </label>

                  {/* Drag & Drop Zone */}
                  <div
                    className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
                    onClick={() => totalImages < 5 && fileInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: totalImages > 0 ? '16px' : '30px 20px',
                      textAlign: 'center',
                      cursor: totalImages < 5 ? 'pointer' : 'default',
                      background: dragActive ? 'rgba(184, 134, 11, 0.04)' : 'rgba(253, 246, 227, 0.5)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />

                    {/* Existing + New image previews grid */}
                    {totalImages > 0 && (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: totalImages < 5 ? '12px' : 0 }}>
                        {existingImages.map((url, idx) => (
                          <div key={`e-${idx}`} style={{
                            position: 'relative', width: '90px', height: '90px', borderRadius: '10px',
                            overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 2px 8px rgba(184,134,11,0.15)',
                          }}>
                            <img src={url} alt={`Product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingImage(idx); }}
                              style={{
                                position: 'absolute', top: '3px', right: '3px', width: '22px', height: '22px',
                                borderRadius: '50%', background: 'rgba(231,76,60,0.9)', color: '#fff', border: 'none',
                                fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              }}>
                              <FiX />
                            </button>
                            {idx === 0 && (
                              <span style={{
                                position: 'absolute', bottom: '3px', left: '3px', background: 'var(--primary)',
                                color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', fontWeight: 600,
                              }}>Main</span>
                            )}
                          </div>
                        ))}
                        {imagePreviews.map((url, idx) => (
                          <div key={`n-${idx}`} style={{
                            position: 'relative', width: '90px', height: '90px', borderRadius: '10px',
                            overflow: 'hidden', border: '2px solid var(--success)', boxShadow: '0 2px 8px rgba(39,174,96,0.15)',
                          }}>
                            <img src={url} alt={`New ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeNewImage(idx); }}
                              style={{
                                position: 'absolute', top: '3px', right: '3px', width: '22px', height: '22px',
                                borderRadius: '50%', background: 'rgba(231,76,60,0.9)', color: '#fff', border: 'none',
                                fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              }}>
                              <FiX />
                            </button>
                            <span style={{
                              position: 'absolute', bottom: '3px', left: '3px', background: 'var(--success)',
                              color: '#fff', fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', fontWeight: 600,
                            }}>New</span>
                          </div>
                        ))}
                        {totalImages < 5 && (
                          <div style={{
                            width: '90px', height: '90px', borderRadius: '10px', border: '2px dashed var(--border)',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-light)', fontSize: '0.7rem', gap: '4px',
                          }}>
                            <FiPlus style={{ fontSize: '1.2rem' }} />
                            Add
                          </div>
                        )}
                      </div>
                    )}

                    {totalImages === 0 && (
                      <div>
                        <FiUploadCloud style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                        <p style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>
                          Drag & drop images here
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)' }}>
                          or click to browse • JPG, PNG, WEBP • Max 5 images
                        </p>
                      </div>
                    )}

                    {totalImages > 0 && totalImages < 5 && (
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        Click or drag to add more ({5 - totalImages} remaining)
                      </p>
                    )}
                  </div>
                </div>

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
                    <label>Price (₦)</label>
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
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update' : 'Create')} {!submitting && 'Product'}
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
                            </button >
                          </div >
                        ))}
                      </div >
                    </>
                  )}
                </div >
  <div className="modal-actions">
    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
    <button type="submit" className="btn btn-primary">
      {editingProduct ? 'Update' : 'Create'} Product
    </button>
  </div>
              </form >
            </div >
          </div >
        )}
      </div >
    </div >
  );
};

export default AdminProducts;
