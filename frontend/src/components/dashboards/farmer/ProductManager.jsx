import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import { useNotifications } from "../../../contexts/NotificationContext";
import { notificationTemplates, createErrorNotification } from "../../../utils/notifications";
import { getAllStates, getDistrictsForState } from "../../../data/indianStatesDistricts";
import { getHubsByDistrict } from "../../../services/api";
import ProductTypeModal from "../../modals/ProductTypeModal";
import BulkProductManager from "./BulkProductManager";
import "../../../css/CardamomComponents.css";
import "../../../css/FarmerComponents.css";
import { validateFarmerProductImage } from "../../../utils/imageValidation";

// Manage products to sell (persisted in database)
export default function ProductManager() {
  const { addNotification } = useNotifications();
  
  const emptyForm = {
    name: "",
    price: "",
    stock: "",
    grade: "Premium",
    image: "",
    state: "",
    district: "",
    nearestHub: "",
    description: "",
  };

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null); // image file
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [states] = useState(getAllStates());
  const [districts, setDistricts] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loadingHubs, setLoadingHubs] = useState(false);
  const [showProductTypeModal, setShowProductTypeModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showBulkManager, setShowBulkManager] = useState(false);

  // Load current farmer's products
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/farmer/products/mine");
        setProducts(data || []);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    
    // Update districts when state changes
    if (name === 'state') {
      const stateDistricts = getDistrictsForState(value);
      setDistricts(stateDistricts);
      setForm((f) => ({ ...f, state: value, district: '', nearestHub: '' })); // Reset district and hub
      setHubs([]); // Clear hubs when state changes
    }
    
    // Update hubs when district changes
    if (name === 'district' && value && form.state) {
      setLoadingHubs(true);
      try {
        const districtHubs = await getHubsByDistrict(form.state, value);
        setHubs(districtHubs);
        setForm((f) => ({ ...f, district: value, nearestHub: '' })); // Reset hub selection
      } catch (error) {
        console.error('Error fetching hubs:', error);
        setHubs([]);
        // Don't show error to user, just log it
      } finally {
        setLoadingHubs(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate that the image is an original captured photo, not AI-generated or cartoon
    validateFarmerProductImage(file).then(validationResult => {
      if (!validationResult.isValid) {
        setError(validationResult.error || 'Please upload an original captured photo, not an AI-generated or cartoon image.');
        return;
      }
      
      // Show warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        // Show warnings to the user
        validationResult.warnings.forEach(warning => {
          addNotification({
            type: 'warning',
            title: 'Image Warning',
            message: warning,
            icon: '⚠️'
          });
        });
      }

      setFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }).catch(err => {
      console.error('Image validation error:', err);
      // Still allow the image if validation fails (fallback to server-side validation)
      setFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setPreviewUrl("");
  };

  const handleAddProductClick = () => {
    setShowProductTypeModal(true);
  };

  const handleSelectDomestic = () => {
    setShowProductTypeModal(false);
    setShowForm(true);
  };

  const handleSelectBulk = () => {
    setShowProductTypeModal(false);
    setShowBulkManager(true);
  };

  const handleCloseModal = () => {
    setShowProductTypeModal(false);
  };

  const addProduct = async (e) => {
    e.preventDefault();
    setError("");
    
    // Client-side validation
    const price = Number(form.price);
    const stock = Number(form.stock);
    
    if (!form.name.trim()) {
      setError("Product name is required");
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      setError("Price must be a positive number greater than ₹0");
      return;
    }
    
    if (isNaN(stock) || stock < 1 || stock > 20 || !Number.isInteger(stock)) {
      setError("Stock must be between 1-20 kg (whole number)");
      return;
    }
    
    setAdding(true);
    try {
      // Use multipart/form-data when a file is selected
      let created;
      if (file) {
        const formData = new FormData();
        formData.append('name', form.name.trim());
        formData.append('price', String(Number(form.price)));
        formData.append('stock', String(Number(form.stock)));
        formData.append('grade', form.grade);
        if (form.state) formData.append('state', form.state.trim());
        if (form.district) formData.append('district', form.district.trim());
        if (form.nearestHub) formData.append('nearestHub', form.nearestHub.trim());
        if (form.description) formData.append('description', form.description.trim());
        formData.append('image', file); // field name must be 'image'

        const res = await api.post("/farmer/products", formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        created = res.data;
      } else {
        // Fallback to JSON if no file (still supports URL)
        const payload = {
          name: form.name.trim(),
          price: Number(form.price),
          stock: Number(form.stock),
          grade: form.grade,
          image: form.image?.trim() || undefined,
          state: form.state?.trim() || undefined,
          district: form.district?.trim() || undefined,
          nearestHub: form.nearestHub?.trim() || undefined,
          description: form.description?.trim() || undefined,
        };
        const res = await api.post("/farmer/products", payload);
        created = res.data;
      }

      setProducts((list) => [created, ...list]);
      resetForm();
      
      // Show success notification
      addNotification(notificationTemplates.productAdded(form.name));
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to add product";
      setError(errorMessage);
      addNotification(createErrorNotification("Failed to Add Product", errorMessage));
    } finally {
      setAdding(false);
    }
  };

  const removeProduct = async (id) => {
    setError("");
    try {
      await api.delete(`/farmer/products/${id}`);
      setProducts((list) => list.filter((p) => (p._id || p.id) !== id));
      addNotification({
        type: 'success',
        title: 'Product Removed',
        message: 'Product has been successfully removed from the marketplace.',
        icon: '🗑️'
      });
    } catch (e) {
      const errorMessage = e?.response?.data?.message || e?.message || "Failed to delete";
      setError(errorMessage);
      addNotification(createErrorNotification("Failed to Remove Product", errorMessage));
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>
          {showBulkManager ? "Bulk Product Management" :
           showForm ? "Add Domestic Product" :
           "Add Product"}
        </h3>
        {showForm && (
          <button className="btn-ghost" onClick={() => setShowForm(false)}>
            ← Back to Selection
          </button>
        )}
        {showBulkManager && (
          <button className="btn-ghost" onClick={() => setShowBulkManager(false)}>
            ← Back to Selection
          </button>
        )}
        {!showForm && !showBulkManager && (
          <button className="btn-primary" onClick={handleAddProductClick}>
            Add New Product
          </button>
        )}
      </div>
      <div className="card-content pm-section">
        {showBulkManager ? (
          <BulkProductManager />
        ) : showForm ? (
          <>
            {/* Decorative and friendly hero */}
            <div className="pm-hero">
              <div>
                <h2 className="pm-hero-title">🌿 Share Your Cardamom Harvest</h2>
                <p className="pm-hero-sub">Connect with buyers and showcase your premium cardamom. Fill the details below and watch your product come to life.</p>
              </div>
            </div>

        <div className="pm-grid">
          {/* Form */}
          <form onSubmit={addProduct} className="pm-form">
            <div className="pm-field">
              <label>Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="pm-field">
              <label>Price (₹/kg)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} min="0.01" step="0.01" required />
              <small style={{ color: '#666', fontSize: '12px' }}>Must be greater than ₹0</small>
            </div>
            <div className="pm-field">
              <label>Stock (kg)</label>
              <input type="number" name="stock" value={form.stock} onChange={handleChange} min="1" max="20" step="1" required />
              <small style={{ color: '#666', fontSize: '12px' }}>Must be between 1-20 kg</small>
            </div>
            <div className="pm-field">
              <label>Grade</label>
              <select name="grade" value={form.grade} onChange={handleChange}>
                <option>Premium</option>
                <option>Organic</option>
                <option>Regular</option>
              </select>
            </div>
            <div className="pm-field">
              <label>State</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div className="pm-field">
              <label>District</label>
              <select name="district" value={form.district} onChange={handleChange} disabled={!form.state}>
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div className="pm-field pm-col-span-2">
              <label>Nearest Hub</label>
              <select 
                name="nearestHub" 
                value={form.nearestHub} 
                onChange={handleChange}
                disabled={!form.district || loadingHubs}
              >
                <option value="">
                  {!form.district ? 'Select District First' : 
                   loadingHubs ? 'Loading Hubs...' : 
                   hubs.length === 0 ? 'No Hubs Available in This District' : 
                   'Select Nearest Hub'}
                </option>
                {hubs.map(hub => (
                  <option key={hub._id} value={hub.name}>
                    {hub.name} - {hub.address}
                  </option>
                ))}
              </select>
              {form.district && hubs.length === 0 && !loadingHubs && (
                <small style={{ color: '#ff9800', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  No registered hubs found in {form.district}. You can still add your product.
                </small>
              )}
            </div>
            <div className="pm-field pm-col-span-2">
              <label>Image (upload from device)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <div style={{ fontSize: 12, color: '#607d8b', marginTop: 4 }}>Or paste an image URL below (optional)</div>
              <input name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="pm-field pm-col-span-2">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe your cardamom quality, aroma, harvest details..." />
            </div>
            <div className="pm-actions pm-col-span-2">
              <button className="btn-primary" type="submit" disabled={adding}>{adding ? "Adding..." : "Add Product"}</button>
              <button className="btn-ghost" type="button" onClick={resetForm}>Reset</button>
            </div>
            {error && <div className="pm-col-span-2" style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
          </form>

          {/* Live preview */}
          <div className="pm-right">
            <h4 className="pm-right-title">Live Preview</h4>
            <div className="pm-preview-card">
              <div className="pm-preview-image">
                {previewUrl ? (
                  <img src={previewUrl} alt={form.name || 'Product'} />
                ) : form.image ? (
                  <img src={form.image} alt={form.name || 'Product'} />
                ) : (
                  <div className="empty-img">📦</div>
                )}
              </div>
              <div className="pm-preview-details">
                <h3>{form.name || 'Product Name'}</h3>
                <p className="pm-preview-price">₹{form.price || 0}/kg · {form.stock || 0} kg · {form.grade}</p>
                {(form.state || form.district || form.nearestHub) && (
                  <p className="pm-preview-meta">
                    {form.state && form.district ? <>📍 {form.district}, {form.state}</> : form.state ? <>📍 {form.state}</> : null}
                    {form.nearestHub ? <> · 🏪 {form.nearestHub}</> : null}
                  </p>
                )}
                {form.description && <p className="pm-preview-desc">{form.description}</p>}
              </div>
            </div>
          </div>
        </div>
        </>
        ) : (
          <div className="pm-empty-state">
            <div className="empty-state-content">
              <div className="empty-icon">🛒</div>
              <h3>Ready to Add Your First Product?</h3>
              <p>Click the "Add New Product" button above to get started.</p>
            </div>
          </div>
        )}

        {/* Existing products */}
        <div className="pm-products">
          <div className="pm-products-header">
            <h3>Your Products</h3>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
              {products.length === 0 ? (
                <p>No products yet. Add your first product above.</p>
              ) : (
                products.map((p) => (
                  <div className="product-card" key={p._id || p.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                    <div className="product-image" style={{ height: 150, background: '#f5f7f9', display: 'grid', placeItems: 'center' }}>
                      {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div className="empty-img">📦</div>}
                    </div>
                    <div className="product-details" style={{ padding: 12 }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>{p.name}</h3>
                      <p className="product-price" style={{ margin: 0, color: '#2e7d32', fontWeight: 700 }}>₹{p.price}/kg · {p.stock} kg · {p.grade}</p>
                      {(p.state || p.district || p.nearestHub) && (
                        <p style={{ margin: '6px 0 0', color: '#607d8b', fontSize: 13 }}>
                          {p.state && p.district ? <>📍 {p.district}, {p.state}</> : p.state ? <>📍 {p.state}</> : null}
                          {p.nearestHub ? <> · 🏪 {p.nearestHub}</> : null}
                        </p>
                      )}
                      {p.description && <p style={{ margin: '8px 0 0', color: '#37474f', fontSize: 13 }}>{p.description}</p>}
                      <div className="product-actions" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                        <button className="wishlist-btn" onClick={() => removeProduct(p._id || p.id)}>🗑️ Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ProductTypeModal
        isOpen={showProductTypeModal}
        onClose={handleCloseModal}
        onSelectDomestic={handleSelectDomestic}
        onSelectBulk={handleSelectBulk}
      />
    </div>
  );
}