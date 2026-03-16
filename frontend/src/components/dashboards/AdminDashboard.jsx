import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "./DashboardLayout";
import {
  adminGetSummary,
  adminListUsers,
  adminGetUser,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
  adminListProducts,
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminListOrders,
  adminGetOrder,
  adminUpdateOrder,
  adminDeleteOrder,
} from "../../services/api";
import "../../css/AdminDashboard.css";
import "../../css/theme-modern.css";
import "../../css/ui.css";
import { Card, CardHeader, CardContent } from "../ui/Card";
import AreaLineChart from "../charts/AreaLineChart";
import AdminFeedbackTable from "../reports/AdminFeedbackTable";
import AdminRequests from "./admin/AdminRequests";
import HubStockSummary from "./admin/HubStockSummary";
import { 
  Users, Package, ShoppingCart, IndianRupee, 
  Trash2, Edit, Save, Plus, X, Search, 
  Activity, ShieldCheck, Mail, Phone, Calendar, 
  ArrowUpRight, TrendingUp, Filter, Eye, AlertCircle
} from "lucide-react";

export default function AdminDashboard({ user }) {
  const menuItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "products", label: "Products", icon: "📦" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "requests", label: "Customer Requests", icon: "📝" },
    { id: "hubs", label: "Hubs", icon: "🏢" },
    { id: "hub-stocks", label: "Hub Stocks", icon: "🏭" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  const [active, setActive] = useState("overview");
  const [summary, setSummary] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [usersData, setUsersData] = useState({ items: [], total: 0 });
  const [productsData, setProductsData] = useState({ items: [], total: 0 });
  const [ordersData, setOrdersData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [orderStatus, setOrderStatus] = useState("");

  // Create forms state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "customer", phone: "" });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ userId: "", name: "", price: 0, stock: 0, grade: "Regular", image: "", address: "", description: "" });

  // Initial summary
  useEffect(() => {
    (async () => {
      try {
        const res = await adminGetSummary();
        setSummary(res?.stats || { users: 0, products: 0, orders: 0, revenue: 0 });
      } catch (e) {
        console.error("Failed to load admin summary", e);
      }
    })();
  }, [active]); // Refresh summary occasionally (e.g. when tab changes)

  // Fetch helpers
  const fetchUsers = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminListUsers({ page: 1, limit: 10, role: usersRoleFilter || undefined });
      setUsersData(res);
    } catch (e) { setError(e?.message || "Failed to load users"); }
    finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminListProducts({ page: 1, limit: 10, q: productQuery || undefined });
      setProductsData(res);
    } catch (e) { setError(e?.message || "Failed to load products"); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminListOrders({ page: 1, limit: 10, status: orderStatus || undefined });
      setOrdersData(res);
    } catch (e) { setError(e?.message || "Failed to load orders"); }
    finally { setLoading(false); }
  };

  // Load when tab changes
  useEffect(() => {
    if (active === "users") fetchUsers();
    else if (active === "products") fetchProducts();
    else if (active === "orders") fetchOrders();
  }, [active, usersRoleFilter, orderStatus]); // Re-fetch on filter changes automatically

  const formatCurrency = (n) => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0); }
    catch { return `₹${n || 0}`; }
  };

  const renderOverview = () => (
    <div className="admin-dashboard">
      <div className="welcome-banner">
        <div className="welcome-content">
          <h2>Welcome back, Admin!</h2>
          <p>Supervise platform operations, user growth, and service revenue dynamically.</p>
        </div>
        <div className="welcome-image">
          <img src="/logo.png" alt="Admin Badge" onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=Admin&background=10b981&color=fff&size=140"; }} />
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
            <Users size={28} />
          </div>
          <div className="stat-details">
            <h3>{summary.users}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <Package size={28} />
          </div>
          <div className="stat-details">
            <h3>{summary.products}</h3>
            <p>Active Products</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <ShoppingCart size={28} />
          </div>
          <div className="stat-details">
            <h3>{summary.orders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card" style={{ border: "2px solid #10b981", transform: "scale(1.02)", boxShadow: "0 10px 25px rgba(16,185,129,0.15)" }}>
          <div className="stat-icon" style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}>
            <IndianRupee size={28} />
          </div>
          <div className="stat-details">
            <h3 style={{ color: "#059669" }}>{formatCurrency(summary.revenue || 0)}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669" }}>
              <TrendingUp size={14} />
              <p style={{ color: "#059669", margin: 0 }}>Platform Profit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="dashboard-card">
          <div className="card-header">
            <h3><Activity size={20} color="#6366f1" /> Performance Analytics</h3>
          </div>
          <div className="card-content">
            <AreaLineChart color="#6366f1" data={[{x:1,y:12},{x:2,y:9},{x:3,y:15},{x:4,y:13},{x:5,y:18},{x:6,y:14},{x:7,y:25}]} />
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><ArrowUpRight size={20} color="#10b981" /> Quick Actions</h3>
          </div>
          <div className="card-content" style={{ display: 'grid', gap: '16px' }}>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '16px' }} onClick={() => setActive('users')}>
              <div style={{ background: '#dbeafe', color: '#2563eb', padding: '10px', borderRadius: '10px', display: 'flex' }}><Users size={20} /></div>
              <div style={{ textAlign: 'left', marginLeft: '12px' }}>
                <strong style={{ display: 'block', fontSize: '16px', color: '#111827' }}>Manage Users</strong>
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal' }}>Add, edit or moderate user accounts</span>
              </div>
            </button>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '16px' }} onClick={() => setActive('products')}>
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '10px', borderRadius: '10px', display: 'flex' }}><Package size={20} /></div>
              <div style={{ textAlign: 'left', marginLeft: '12px' }}>
                <strong style={{ display: 'block', fontSize: '16px', color: '#111827' }}>Manage Products</strong>
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal' }}>Review marketplace inventory and prices</span>
              </div>
            </button>

            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '16px' }} onClick={() => setActive('orders')}>
              <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px', display: 'flex' }}><ShoppingCart size={20} /></div>
              <div style={{ textAlign: 'left', marginLeft: '12px' }}>
                <strong style={{ display: 'block', fontSize: '16px', color: '#111827' }}>Manage Orders</strong>
                <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 'normal' }}>Track fulfillment and payments globally</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'role-admin';
      case 'customer': return 'role-customer';
      case 'farmer': return 'role-farmer';
      case 'agricare': return 'role-agricare';
      case 'hub': return 'role-hub';
      default: return 'role-customer';
    }
  };

  const renderUsers = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Users size={20} color="#2563eb" /> System Users</h3>
          <div className="card-header-actions">
            <button className="btn-primary" onClick={() => setShowAddUser(!showAddUser)}>
              {showAddUser ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add User</>}
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="filter-bar">
            <Filter size={18} color="#6b7280" />
            <select className="admin-select" value={usersRoleFilter} onChange={(e) => setUsersRoleFilter(e.target.value)} style={{ width: '200px' }}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="farmer">Farmer</option>
              <option value="agricare">AgriCare Provider</option>
              <option value="hub">Hub Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {showAddUser && (
            <div className="inline-form-card">
              <h4><Plus size={18} /> Create New User</h4>
              <div className="inline-form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Username</label>
                  <input className="admin-input" placeholder="Enter username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Email Address</label>
                  <input className="admin-input" placeholder="Enter email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Password</label>
                  <input className="admin-input" placeholder="Create password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Phone (Optional)</label>
                  <input className="admin-input" placeholder="Phone number" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Role Assignment</label>
                  <select className="admin-select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="customer">Customer</option>
                    <option value="farmer">Farmer</option>
                    <option value="agricare">AgriCare Provider</option>
                    <option value="hub">Hub Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={async () => {
                  try {
                    if (!newUser.username || !newUser.email || !newUser.password) { alert('Fill username, email, password'); return; }
                    await adminCreateUser({ username: newUser.username, email: newUser.email, password: newUser.password, role: newUser.role, phone: newUser.phone });
                    setShowAddUser(false);
                    setNewUser({ username: "", email: "", password: "", role: "customer", phone: "" });
                    await fetchUsers();
                  } catch (err) { alert(err?.message || 'Failed to create user'); }
                }}>
                  <Save size={18} /> Save User
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon"><Activity size={40} className="animate-spin" /></div>
              <h3>Loading Users...</h3>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div style={{ color: '#ef4444', marginBottom: 16 }}><AlertCircle size={40} /></div>
              <h3 style={{ color: '#dc2626' }}>{error}</h3>
            </div>
          ) : usersData.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Users size={40} /></div>
              <h3>No users found</h3>
              <p>Try adjusting your search filters.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-info-row">
                          <div className="user-avatar">{u.username.substring(0, 1).toUpperCase()}</div>
                          <div>
                            <span className="user-name-text">{u.username}</span>
                            <span className="user-email-text">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(u.role)}`}>{u.role}</span>
                        {/* Inline role changer for simplicity */}
                        <div style={{ marginTop: 8 }}>
                          <select
                            className="admin-select"
                            style={{ padding: '6px', fontSize: '11px', width: 'auto' }}
                            value={u.role}
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? 'Admin role cannot be changed' : 'Change role'}
                            onChange={async (e) => {
                              const nextRole = e.target.value;
                              try {
                                await adminUpdateUser(u._id, { role: nextRole });
                                setUsersData((prev) => ({
                                  ...prev,
                                  items: prev.items.map(x => x._id === u._id ? { ...x, role: nextRole } : x)
                                }));
                              } catch (err) { alert(err?.message || 'Failed to update role'); }
                            }}
                          >
                            <option value="customer">Customer</option>
                            <option value="farmer">Farmer</option>
                            <option value="agricare">AgriCare</option>
                            <option value="hub">Hub</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563', fontSize: 14 }}>
                          <Phone size={14} /> {u.phone || 'Not provided'}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {u.role !== 'admin' ? (
                          <button className="btn-danger" onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ${u.username}?`)) return;
                            try { await adminDeleteUser(u._id); await fetchUsers(); } catch (err) { alert(err?.message || 'Delete failed'); }
                          }}>
                            <Trash2 size={16} /> Delete
                          </button>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>Protected Default</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Package size={20} color="#10b981" /> Marketplace Inventory</h3>
          <div className="card-header-actions">
            <button className="btn-primary" onClick={() => setShowAddProduct(!showAddProduct)}>
              {showAddProduct ? <><X size={18} /> Cancel</> : <><Plus size={18} /> Add Product</>}
            </button>
          </div>
        </div>

        <div className="card-content">
          <div className="filter-bar">
            <Search size={18} color="#6b7280" />
            <input 
              className="admin-input" 
              placeholder="Search products by name..." 
              value={productQuery} 
              onChange={(e) => setProductQuery(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
              style={{ width: '300px' }}
            />
            <button className="btn-secondary" onClick={fetchProducts}>Apply Filter</button>
          </div>

          {showAddProduct && (
            <div className="inline-form-card">
              <h4><Plus size={18} /> Register New Product</h4>
              <div className="inline-form-grid">
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Owner User ID</label>
                  <input className="admin-input" placeholder="User Object ID" value={newProduct.userId} onChange={(e) => setNewProduct({ ...newProduct, userId: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Product Name</label>
                  <input className="admin-input" placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Price (₹ per kg)</label>
                  <input className="admin-input" type="number" min={0} value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Stock (kg)</label>
                  <input className="admin-input" type="number" min={0} value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) || 0 })} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Grade</label>
                  <select className="admin-select" value={newProduct.grade} onChange={(e) => setNewProduct({ ...newProduct, grade: e.target.value })}>
                    <option value="Premium">Premium</option>
                    <option value="Organic">Organic</option>
                    <option value="Regular">Regular</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600 }}>Image URL</label>
                  <input className="admin-input" placeholder="URL" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={async () => {
                  try {
                    const payload = { user: newProduct.userId, name: newProduct.name, price: newProduct.price, stock: newProduct.stock, grade: newProduct.grade, image: newProduct.image, address: newProduct.address, description: newProduct.description };
                    if (!payload.user || !payload.name || payload.price == null || payload.stock == null || !payload.grade) { alert('Fill userId, name, price, stock, grade'); return; }
                    await adminCreateProduct(payload);
                    setShowAddProduct(false);
                    setNewProduct({ userId: "", name: "", price: 0, stock: 0, grade: "Regular", image: "", address: "", description: "" });
                    await fetchProducts();
                  } catch (err) { alert(err?.message || 'Failed to create product'); }
                }}>
                  <Save size={18} /> Save Product
                </button>
              </div>
            </div>
          )}

          {loading ? (
             <div className="empty-state">
              <div className="empty-icon"><Activity size={40} className="animate-spin" /></div>
              <h3>Loading Inventory...</h3>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div style={{ color: '#ef4444', marginBottom: 16 }}><AlertCircle size={40} /></div>
              <h3 style={{ color: '#dc2626' }}>{error}</h3>
            </div>
          ) : productsData.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Package size={40} /></div>
              <h3>No products found</h3>
              <p>Add products globally to feature them on the marketplace.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Grade</th>
                    <th>Stock (Kg)</th>
                    <th>Price (₹)</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.items.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-info-row">
                          {p.image ? (
                            <img src={p.image} className="product-thumbnail" alt={p.name} />
                          ) : (
                            <div className="product-thumbnail"><Package size={20} /></div>
                          )}
                          <div>
                            <span className="product-name-text">{p.name}</span>
                            <span className="product-id-text">ID: {p._id.substring(0,8).toUpperCase()}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                          background: p.grade === 'Premium' ? '#fef08a' : p.grade === 'Organic' ? '#dcfce7' : '#f3f4f6',
                          color: p.grade === 'Premium' ? '#854d0e' : p.grade === 'Organic' ? '#166534' : '#4b5563'
                        }}>
                          {p.grade}
                        </span>
                      </td>
                      <td>
                        <input
                          className="admin-input"
                          type="number"
                          min={0}
                          value={p.stock}
                          onChange={async (e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            try {
                              await adminUpdateProduct(p._id, { stock: next });
                              setProductsData(prev => ({ ...prev, items: prev.items.map(x => x._id === p._id ? { ...x, stock: next } : x) }));
                            } catch (err) { alert(err?.message || 'Failed to update stock'); }
                          }}
                          style={{ width: '100px', fontWeight: 600, color: p.stock < 10 ? '#ef4444' : 'inherit' }}
                        />
                      </td>
                      <td>
                        <input
                          className="admin-input"
                          type="number"
                          min={0}
                          value={p.price}
                          disabled={p?.user?.role === 'farmer'}
                          title={p?.user?.role === 'farmer' ? 'Price is controlled by the farmer' : 'Edit price'}
                          onChange={async (e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            try {
                              await adminUpdateProduct(p._id, { price: next });
                              setProductsData(prev => ({ ...prev, items: prev.items.map(x => x._id === p._id ? { ...x, price: next } : x) }));
                            } catch (err) { alert(err?.message || 'Failed to update price'); }
                          }}
                          style={{ width: '120px' }}
                        />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button className="btn-danger" onClick={async () => {
                            if (!confirm('Are you sure you want to delete this product?')) return;
                            try { await adminDeleteProduct(p._id); await fetchProducts(); } catch (err) { alert(err?.message || 'Delete failed'); }
                          }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getOrderStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-Pending';
      case 'Processing': return 'status-Processing';
      case 'Shipped': return 'status-Shipped';
      case 'Delivered': return 'status-Delivered';
      case 'Cancelled': return 'status-Cancelled';
      default: return 'status-Pending';
    }
  };

  const renderOrders = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><ShoppingCart size={20} color="#f59e0b" /> Global Orders</h3>
        </div>

        <div className="card-content">
          <div className="filter-bar">
            <Filter size={18} color="#6b7280" />
            <select className="admin-select" value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={{ width: '200px' }}>
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
             <div className="empty-state">
              <div className="empty-icon"><Activity size={40} className="animate-spin" /></div>
              <h3>Loading Orders...</h3>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div style={{ color: '#ef4444', marginBottom: 16 }}><AlertCircle size={40} /></div>
              <h3 style={{ color: '#dc2626' }}>{error}</h3>
            </div>
          ) : ordersData.items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ShoppingCart size={40} /></div>
              <h3>No orders yet</h3>
              <p>Incoming orders will be displayed here.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Details</th>
                    <th>Customer</th>
                    <th>Fulfillment Status</th>
                    <th>Subtotal + Service Charge</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.items.map(o => (
                    <tr key={o._id}>
                      <td>
                        <strong style={{ display: 'block', color: '#111827' }}>#{o._id.substring(0,8).toUpperCase()}</strong>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          <Calendar size={12} style={{ display: 'inline', marginRight: 4, transform: 'translateY(2px)' }}/> 
                          {new Date(o.createdAt).toLocaleDateString()}
                        </span>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#4b5563' }}>
                          <Package size={12} style={{ display: 'inline', marginRight: 4 }}/>
                          {o.items?.length || 0} item(s)
                        </div>
                      </td>
                      <td>
                         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                           <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12, background: '#f3f4f6', color: '#4b5563' }}>
                             {o.customer?.username?.substring(0, 1)?.toUpperCase() || '?'}
                           </div>
                           <span style={{ fontWeight: 500 }}>{o.customer?.username || 'Unknown Customer'}</span>
                         </div>
                      </td>
                      <td>
                        <select
                          className={`admin-select ${getOrderStatusClass(o.status)}`}
                          style={{ border: 'none', background: 'transparent', fontWeight: 600, padding: '4px 8px', width: 'auto' }}
                          value={o.status}
                          onChange={async (e) => {
                            const next = e.target.value;
                            try {
                              await adminUpdateOrder(o._id, { status: next });
                              setOrdersData(prev => ({ ...prev, items: prev.items.map(x => x._id === o._id ? { ...x, status: next } : x) }));
                            } catch (err) { alert(err?.message || 'Failed to update status'); }
                          }}
                        >
                          {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#10b981', fontSize: 16 }}>{formatCurrency(o.amount)}</div>
                        {o.platformFee > 0 && (
                          <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                            + {formatCurrency(o.platformFee)} Platform Profit
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                          {o.paymentMethod || 'COD'} • {o.paymentStatus || 'Pending'}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="btn-danger" onClick={async () => {
                          if (!confirm(`Permanently delete order #${o._id.substring(0,8)}?`)) return;
                          try { await adminDeleteOrder(o._id); await fetchOrders(); } catch (err) { alert(err?.message || 'Delete failed'); }
                        }}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Hubs Placeholder
  const renderHubs = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><ShieldCheck size={20} color="#8b5cf6" /> Regional Hubs Management</h3>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}><ShieldCheck size={40} /></div>
            <h3>Centralized Hub Operations</h3>
            <p>Go to the Users tab and filter by "Hub" role to manage your regional distribution centers.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => { setUsersRoleFilter("hub"); setActive("users"); }}>
              Manage Hub Managers
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Activity size={20} color="#ec4899" /> System Reports & Feedback</h3>
        </div>
        <div className="card-content">
          <AdminFeedbackTable />
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3><Edit size={20} color="#64748b" /> Platform Configuration</h3>
        </div>
        <div className="card-content">
          <div className="inline-form-card" style={{ maxWidth: 600 }}>
            <h4 style={{ margin: 0, marginBottom: 10 }}>General Settings</h4>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>System configuration endpoints will be wired here.</p>
            
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
                  <input type="checkbox" defaultChecked={true} style={{ width: 18, height: 18, accentColor: '#10b981' }}/>
                  Enable Global Platform Fee (5%)
                </label>
                <p style={{ margin: '4px 0 0 30px', fontSize: 13, color: '#6b7280' }}>Automatically applies a 5% service charge to all online and COD payments natively.</p>
              </div>
              
              <div style={{ borderTop: '1px solid #e2e8f0', margin: '10px 0' }}></div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
                  <input type="checkbox" defaultChecked={true} style={{ width: 18, height: 18, accentColor: '#10b981' }}/>
                  Enable Razorpay Integrations
                </label>
              </div>
            </div>
            <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => alert("Settings saved successfully!")}><Save size={18} /> Save Preferences</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card" style={{ maxWidth: 500, margin: '0 auto' }}>
        <div className="card-header">
          <h3><Users size={20} color="#0f766e" /> Admin Profile</h3>
        </div>
        <div className="card-content" style={{ textAlign: 'center' }}>
          <div className="user-avatar" style={{ width: 100, height: 100, fontSize: 32, margin: '0 auto 20px', background: 'linear-gradient(135deg, #0f766e, #0d9488)' }}>
            {user.username.substring(0,2).toUpperCase()}
          </div>
          <h2 style={{ margin: 0, color: '#111827', fontSize: 24, fontWeight: 800 }}>{user.username}</h2>
          <span className="role-badge role-admin" style={{ display: 'inline-block', marginTop: 10, fontSize: 14, padding: '6px 16px' }}>Super Admin</span>
          
          <div style={{ marginTop: 30, textAlign: 'left', background: '#f8fafc', padding: 24, borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
               <Mail size={18} color="#64748b" />
               <span style={{ fontWeight: 600, color: '#334155' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <Phone size={18} color="#64748b" />
               <span style={{ fontWeight: 600, color: '#334155' }}>Premium Support Access Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRequests = () => <AdminRequests user={user} />;

  const renderHubStocks = () => <HubStockSummary />;

  const body = useMemo(() => {
    if (active === "users") return renderUsers();
    if (active === "products") return renderProducts();
    if (active === "orders") return renderOrders();
    if (active === "requests") return renderRequests();
    if (active === "hubs") return renderHubs();
    if (active === "hub-stocks") return renderHubStocks();
    if (active === "reports") return renderReports();
    if (active === "settings") return renderSettings();
    if (active === "profile") return renderProfile();
    return renderOverview();
  }, [active, loading, error, usersData, productsData, ordersData, summary]);

  return (
    <DashboardLayout
      user={user}
      menuItems={menuItems}
      pageTitle="Admin Central Command"
      roleName="Administrator"
      onMenuItemClick={setActive}
    >
      {body}
    </DashboardLayout>
  );
}