import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import "../../css/AgriCareDashboard.css";
import "../../css/theme-modern.css";
import FeedbackForm from "./shared/FeedbackForm";
import { getAgricareStats, getAgricareProducts, getAgricareOrders, getAgricareFarmers, createAgricareProduct } from "../../services/api";

export default function AgriCareDashboard({ user }) {
  // Sidebar menu for AgriCare
  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "products", label: "Products", icon: "🧪" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "farmers", label: "Farmers", icon: "👨‍🌾" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  // Track active section (synced with DashboardLayout via onMenuItemClick)
  const [active, setActive] = useState("overview");

  // Live data from API
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, farmers: 0, revenue: 0 });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const emptyForm = { name: "", type: "Fertilizer", price: "", stock: "", image: "", description: "" };
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState("");

  // Simple profile (persisted locally for demo)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("agricareProfile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { fullName: user?.profile?.fullName || user?.username || "", email: user?.email || "", phone: "" };
  });

  useEffect(() => {
    try { localStorage.setItem("agricareProfile", JSON.stringify(profile)); } catch {}
  }, [profile]);

  // Load data when component mounts or active section changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load stats
        const statsRes = await getAgricareStats();
        setStats(statsRes);

        // Load products
        const productsRes = await getAgricareProducts({ page: 1, limit: 10 });
        setProducts(productsRes.items || []);

        // Load orders
        const ordersRes = await getAgricareOrders({ page: 1, limit: 10 });
        setOrders(ordersRes.items || []);

        // Load farmers
        const farmersRes = await getAgricareFarmers({ page: 1, limit: 10 });
        setFarmers(farmersRes.items || []);
      } catch (error) {
        console.error('Failed to load AgriCare data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const onFormChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    try { setPreview(f ? URL.createObjectURL(f) : ""); } catch {}
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setFormError("");
    setPreview("");
  };

  const onAddProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim()) return setFormError("Product name is required");
    if (isNaN(price) || price <= 0) return setFormError("Price must be greater than ₹0");
    if (!Number.isInteger(stock) || stock < 1) return setFormError("Stock must be at least 1");

    setAdding(true);
    try {
      let payload;
      if (file) {
        const fd = new FormData();
        fd.append('name', form.name.trim());
        if (form.type) fd.append('type', form.type.trim());
        fd.append('price', String(price));
        fd.append('stock', String(stock));
        if (form.description) fd.append('description', form.description.trim());
        fd.append('image', file);
        payload = fd;
      } else {
        payload = {
          name: form.name.trim(),
          type: form.type?.trim() || undefined,
          price,
          stock,
          image: form.image?.trim() || undefined,
          description: form.description?.trim() || undefined,
        };
      }

      const created = await createAgricareProduct(payload);
      setProducts((list) => [created, ...list]);
      resetForm();
      setShowAddModal(false);
    } catch (err) {
      const msg = err?.message || 'Failed to add product';
      setFormError(msg);
    } finally {
      setAdding(false);
    }
  };

  const counts = useMemo(() => ({
    products: stats.products || products.length,
    orders: stats.orders || orders.length,
    farmers: stats.farmers || farmers.length,
    revenue: stats.revenue || orders.reduce((sum, o) => sum + (o.total || 0), 0),
  }), [stats, products, orders, farmers]);

  const formatCurrency = (amount, currency = "INR") => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount || 0); }
    catch { return `₹${amount || 0}`; }
  };

  const renderOverview = () => (
    <div className="agricare-dashboard">
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, {profile.fullName || user.username}!</h2>
          <p>Manage your agricultural products and services.</p>
        </div>
        <div className="welcome-image">
          <img src="/images/plant13.jpeg" alt="Welcome" />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#4CAF50" }}>🧪</div>
          <div className="stat-details">
            <h3>{loading ? "..." : counts.products}</h3>
            <p>Active Products</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#2196F3" }}>🛒</div>
          <div className="stat-details">
            <h3>{loading ? "..." : counts.orders}</h3>
            <p>Recent Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#FF9800" }}>👨‍🌾</div>
          <div className="stat-details">
            <h3>{loading ? "..." : counts.farmers}</h3>
            <p>Farmer Clients</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: "#9C27B0" }}>💰</div>
          <div className="stat-details">
            <h3>{loading ? "..." : formatCurrency(counts.revenue)}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="dashboard-col">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <button className="view-all-btn" onClick={() => setActive("orders")}>View All</button>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">⏳</div>
                  <h3>Loading orders...</h3>
                </div>
              ) : orders.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🛒</div>
                  <h3>No recent orders</h3>
                  <p>Orders will appear here as they come in.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td>{o.id}</td>
                        <td>{o.date}</td>
                        <td><span className={`status-badge ${String(o.status).toLowerCase()}`}>{o.status}</span></td>
                        <td>{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="dashboard-col">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Top Products</h3>
              <button className="view-all-btn" onClick={() => setActive("products")}>View All</button>
            </div>
            <div className="card-content">
              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">⏳</div>
                  <h3>Loading products...</h3>
                </div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🧪</div>
                  <h3>No products yet</h3>
                  <p>Add your first AgriCare product to get started.</p>
                </div>
              ) : (
                <div className="product-grid">
                  {products.slice(0, 4).map(p => (
                    <div className="product-card" key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                      <div className="product-image" style={{ height: '160px', background: '#f8fafc', display: 'grid', placeItems: 'center' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '48px' }}>🧪</div>
                        )}
                      </div>
                      <div className="product-details" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{p.name}</h4>
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{p.type}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '700', color: '#059669' }}>{formatCurrency(p.price)}</span>
                          <span style={{ fontSize: '14px', color: '#64748b' }}>Stock: {p.stock}</span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px', minHeight: '40px' }}>{p.description || 'No description available'}</p>
                        <button className="view-all-btn" onClick={() => setActive("products")} style={{ width: '100%', padding: '8px', borderRadius: '8px', fontWeight: '500' }}>Manage Product</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const [searchProducts, setSearchProducts] = useState("");
  const filteredProducts = useMemo(() => {
    const q = searchProducts.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, searchProducts]);

  const renderProducts = () => (
    <div className="agricare-dashboard">
      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Products</h3>
          <button className="view-all-btn" onClick={() => setShowAddModal(true)}>+ Add New</button>
        </div>
        <div className="card-content">
          <div className="marketplace-controls controls-card" style={{ padding: 12, marginBottom: 16, borderRadius: 12, background: '#f8fafc' }}>
            <div className="search-bar">
              <input type="text" placeholder="Search products..." value={searchProducts} onChange={(e) => setSearchProducts(e.target.value)} />
              <button className="search-btn">🔍</button>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <p>No products found</p>
          ) : (
            <div className="table-container" style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table className="data-table" style={{ minWidth: '600px' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Product</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p._id || p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>{p._id || p.id}</td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', background: '#f1f5f9', display: 'grid', placeItems: 'center', borderRadius: '8px' }}>🧪</div>
                          )}
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{p.name}</div>
                            {p.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{p.description.substring(0, 50)}{p.description.length > 50 ? '...' : ''}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{p.type || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <span style={{ background: p.stock > 10 ? '#dcfce7' : '#fee2e2', color: p.stock > 10 ? '#166534' : '#b91c1c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{p.stock}</span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', verticalAlign: 'middle', fontWeight: '600', color: '#059669' }}>{formatCurrency(p.price)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button className="view-all-btn" onClick={() => alert(`Edit ${p.name}`)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showAddModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(2px)' }}>
          <div className="modal" style={{ width: 720, maxWidth: '95%', borderRadius: 16 }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🧪</span> Add AgriCare Product
              </h3>
              <button className="close-btn" onClick={() => { setShowAddModal(false); resetForm(); }}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
              {formError && <div className="alert-error" style={{ marginBottom: 12 }}>⚠️ {formError}</div>}
              <form onSubmit={onAddProduct} className="edit-profile-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Product Name *</label>
                    <input name="name" value={form.name} onChange={onFormChange} required style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Category</label>
                    <select name="type" value={form.type} onChange={onFormChange} style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}>
                      <option>Fertilizer</option>
                      <option>Tonic</option>
                      <option>Medicine</option>
                      <option>Seeds</option>
                      <option>Equipment</option>
                      <option>Service</option>
                      <option>Pesticide</option>
                      <option>Fungicide</option>
                      <option>Herbicide</option>
                      <option>Soil Test Kit</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Price (₹) *</label>
                      <input type="number" name="price" value={form.price} min="0.01" step="0.01" onChange={onFormChange} required style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Stock *</label>
                      <input type="number" name="stock" value={form.stock} min="1" step="1" onChange={onFormChange} required style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Description</label>
                    <textarea name="description" value={form.description} onChange={onFormChange} rows="3" style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Upload Image</label>
                    <input type="file" accept="image/*" onChange={onFileChange} style={{ padding: '8px', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>Image URL (optional)</label>
                    <input name="image" value={form.image} onChange={onFormChange} placeholder="https://..." style={{ padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#f8fafc', borderRadius: '12px', height: '100%', display: 'grid', placeItems: 'center', overflow: 'hidden', border: '1px solid #e2e8f1', width: '100%' }}>
                      {preview || form.image ? (
                        <img src={preview || form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
                      ) : (
                        <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                          <p>Image Preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', paddingTop: '12px' }}>
                  <button className="save-btn" type="submit" disabled={adding} style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: '600' }}>{adding ? 'Adding Product...' : 'Add Product'}</button>
                  <button className="view-all-btn" type="button" onClick={() => { setShowAddModal(false); resetForm(); }} style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: '600' }}>Cancel</button>
                </div>
              </form>
              <div className="preview-pane" style={{ paddingLeft: 8 }}>
                <div style={{ background: '#f1f5f9', borderRadius: 12, height: 260, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {preview || form.image ? (
                    <img src={preview || form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#64748b' }}>Image preview</div>
                  )}
                </div>
                <p style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Tip: Add a clear product image for better visibility.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const [statusFilter, setStatusFilter] = useState("All");
  const statusTabs = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];
  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return orders;
    return orders.filter(o => String(o.status) === statusFilter);
  }, [orders, statusFilter]);

  const renderOrders = () => (
    <div className="agricare-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Orders</h3>
          <div>
            {statusTabs.map(s => (
              <button
                key={s}
                className={`view-all-btn ${statusFilter === s ? 'active' : ''}`}
                style={{ marginLeft: 8 }}
                onClick={() => setStatusFilter(s)}
              >{s}</button>
            ))}
          </div>
        </div>
        <div className="card-content">
          {filteredOrders.length === 0 ? (
            <p>No orders found</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.date}</td>
                    <td><span className={`status-badge ${String(o.status).toLowerCase()}`}>{o.status}</span></td>
                    <td>{o.items}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td>
                      <button className="view-all-btn" onClick={() => alert(`View ${o.id}`)}>View</button>
                      {o.status === 'Processing' && (
                        <button className="view-all-btn" style={{ marginLeft: 8 }} onClick={() => alert(`Mark shipped ${o.id}`)}>Mark Shipped</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderFarmers = () => (
    <div className="agricare-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Farmer Clients</h3>
          <button className="view-all-btn" onClick={() => alert("Invite Farmer")}>Invite</button>
        </div>
        <div className="card-content">
          {farmers.length === 0 ? (
            <p>No farmers yet</p>
          ) : (
            <div className="product-grid">
              {farmers.map(f => (
                <div className="product-card" key={f.id}>
                  <div className="product-image">
                    <img src="/images/plant11.jpeg" alt={f.name} />
                  </div>
                  <div className="product-details">
                    <h4>{f.name}</h4>
                    <p className="product-price">📍 {f.location}</p>
                    <button className="view-all-btn" onClick={() => alert(`Message ${f.name}`)}>Message</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="agricare-dashboard">
      <div className="dashboard-card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h3>Sales Overview</h3></div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[{ label: 'This Week', value: 65 }, { label: 'This Month', value: 78 }].map((m, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>{m.label}</span><span>{m.value}%</span>
                </div>
                <div style={{ height: 10, background: '#eee', borderRadius: 999 }}>
                  <div style={{ width: `${m.value}%`, height: '100%', background: 'linear-gradient(90deg, #667eea, #764ba2)', borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header"><h3>Top Performing Products</h3></div>
        <div className="card-content">
          {products.length === 0 ? (
            <p>No data</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{(idx + 1) * 7}</td>
                    <td>{formatCurrency((idx + 1) * 1500)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [msg, setMsg] = useState("");
  const onSaveProfile = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsSavingProfile(true);
    try {
      await new Promise(r => setTimeout(r, 600));
      setMsg("Profile updated");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderProfile = () => (
    <div className="agricare-dashboard">
      <div className="dashboard-card">
        <div className="card-header"><h3>Profile</h3></div>
        <div className="card-content">
          {msg && <div className="alert-success" style={{ marginBottom: 12 }}>✅ {msg}</div>}
          <form onSubmit={onSaveProfile} className="edit-profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" value={profile.fullName} onChange={(e) => setProfile(p => ({ ...p, fullName: e.target.value }))} placeholder="Enter your full name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={profile.email} onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="Enter your email" required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
            </div>
            <div className="form-actions">
              <button className="save-btn" type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const body = (() => {
    switch (active) {
      case "products": return renderProducts();
      case "orders": return renderOrders();
      case "farmers": return renderFarmers();
      case "analytics": return renderAnalytics();
      case "feedback": return <FeedbackForm title="AgriCare Feedback" />;
      case "profile": return renderProfile();
      case "overview":
      default: return renderOverview();
    }
  })();

  return (
    <DashboardLayout
      user={user}
      menuItems={menuItems}
      pageTitle="AgriCare Dashboard"
      roleName="AgriCare Provider"
      onMenuItemClick={(id) => setActive(id)}
    >
      {body}
    </DashboardLayout>
  );
}