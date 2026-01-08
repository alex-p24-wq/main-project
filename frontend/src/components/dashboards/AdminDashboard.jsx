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
import { Card, CardHeader, CardContent, StatCard } from "../ui/Card";
import Filters from "../ui/Filters";
import SearchBar from "../ui/SearchBar";
import QuickActions from "../ui/QuickActions";
import AreaLineChart from "../charts/AreaLineChart";
import AdminFeedbackTable from "../reports/AdminFeedbackTable";
import AdminRequests from "./admin/AdminRequests";
import HubStockSummary from "./admin/HubStockSummary";

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
  const [summary, setSummary] = useState({ users: 0, products: 0, orders: 0 });
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
        setSummary(res?.stats || { users: 0, products: 0, orders: 0 });
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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
  }, [active]);

  const formatCurrency = (n) => {
    try { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0); }
    catch { return `₹${n || 0}`; }
  };

  // Global dashboard filters
  const [region, setRegion] = useState("");
  const [period, setPeriod] = useState("30d");
  const [variety, setVariety] = useState("");

  const renderOverview = () => (
    <div className="admin-dashboard">
      <Card className="blob-bg">
        <CardHeader title={`Welcome back, ${user.username}!`} subtitle="Monitor the whole platform at a glance." 
          actions={(
            <Filters 
              region={region} setRegion={setRegion}
              period={period} setPeriod={setPeriod}
              variety={variety} setVariety={setVariety}
              onApply={() => {/* hook for future data fetch */}}
            />
          )}
        />
        <CardContent>
          <div className="grid-auto">
            <StatCard icon="👥" value={summary.users} label="Total Users" accent="#2e7d32" />
            <StatCard icon="📦" value={summary.products} label="Active Products" accent="#43a047" />
            <StatCard icon="🛒" value={summary.orders} label="Total Orders" accent="#66bb6a" />
            <StatCard icon="💰" value={formatCurrency(0)} label="Revenue (demo)" accent="#81c784" />
          </div>
        </CardContent>
      </Card>

      <div style={{ marginTop: 16 }} className="grid-2">
        <Card>
          <CardHeader title="Performance" subtitle="Recent orders trend" 
            actions={<SearchBar value={productQuery} onChange={setProductQuery} onSubmit={fetchProducts} placeholder="Search products..." />}
          />
          <CardContent>
            <AreaLineChart color="#43a047" data={[{x:1,y:12},{x:2,y:9},{x:3,y:15},{x:4,y:13},{x:5,y:18},{x:6,y:14},{x:7,y:22}]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Quick Actions" />
          <CardContent>
            <QuickActions actions={[
              { label: 'Manage Users', onClick: () => setActive('users') },
              { label: 'Manage Products', onClick: () => setActive('products') },
              { label: 'Manage Orders', onClick: () => setActive('orders') },
            ]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Users</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={usersRoleFilter} onChange={(e) => setUsersRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {['customer','farmer','agricare','hub','admin'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button className="view-all-btn" onClick={fetchUsers}>Refresh</button>
            <button className="view-all-btn" onClick={() => setShowAddUser(true)}>Add User</button>
          </div>
        </div>
        <div className="card-content">
          {showAddUser && (
            <div className="inline-form">
              <h4>Create User</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                <input placeholder="Password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                <input placeholder="Phone" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  {['customer','farmer','agricare','hub','admin'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button className="view-all-btn" onClick={async () => {
                  try {
                    if (!newUser.username || !newUser.email || !newUser.password) { alert('Fill username, email, password'); return; }
                    await adminCreateUser({ username: newUser.username, email: newUser.email, password: newUser.password, role: newUser.role, phone: newUser.phone });
                    setShowAddUser(false);
                    setNewUser({ username: "", email: "", password: "", role: "customer", phone: "" });
                    await fetchUsers();
                  } catch (err) { alert(err?.message || 'Failed to create user'); }
                }}>Create</button>
                <button className="view-all-btn" onClick={() => setShowAddUser(false)}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <p>Loading...</p> : error ? <p className="err-text">{error}</p> : (
            usersData.items.length === 0 ? <p>No users</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th><th>Email</th><th>Role</th><th>Phone</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.items.map(u => (
                    <tr key={u._id}>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
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
                          {['customer','farmer','agricare','hub','admin'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td>{u.phone || '-'}</td>
                      <td>
                        {u.role !== 'admin' && (
                          <button className="view-all-btn" onClick={async () => {
                            if (!confirm('Delete this user?')) return;
                            try { await adminDeleteUser(u._id); await fetchUsers(); } catch (err) { alert(err?.message || 'Delete failed'); }
                          }}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Products</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input placeholder="Search products..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            <button className="view-all-btn" onClick={fetchProducts}>Search</button>
            <button className="view-all-btn" onClick={() => setShowAddProduct(true)}>Add Product</button>
          </div>
        </div>
        <div className="card-content">
          {showAddProduct && (
            <div className="inline-form">
              <h4>Create Product</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input placeholder="Owner User ID" value={newProduct.userId} onChange={(e) => setNewProduct({ ...newProduct, userId: e.target.value })} />
                <input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                <input type="number" min={0} placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) || 0 })} />
                <input type="number" min={0} placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) || 0 })} />
                <select value={newProduct.grade} onChange={(e) => setNewProduct({ ...newProduct, grade: e.target.value })}>
                  {['Premium','Organic','Regular'].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <input placeholder="Image URL" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
                <input placeholder="Address" value={newProduct.address} onChange={(e) => setNewProduct({ ...newProduct, address: e.target.value })} />
                <input placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
                <button className="view-all-btn" onClick={async () => {
                  try {
                    const payload = { user: newProduct.userId, name: newProduct.name, price: newProduct.price, stock: newProduct.stock, grade: newProduct.grade, image: newProduct.image, address: newProduct.address, description: newProduct.description };
                    if (!payload.user || !payload.name || payload.price == null || payload.stock == null || !payload.grade) { alert('Fill userId, name, price, stock, grade'); return; }
                    await adminCreateProduct(payload);
                    setShowAddProduct(false);
                    setNewProduct({ userId: "", name: "", price: 0, stock: 0, grade: "Regular", image: "", address: "", description: "" });
                    await fetchProducts();
                  } catch (err) { alert(err?.message || 'Failed to create product'); }
                }}>Create</button>
                <button className="view-all-btn" onClick={() => setShowAddProduct(false)}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <p>Loading...</p> : error ? <p className="err-text">{error}</p> : (
            productsData.items.length === 0 ? <p>No products</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Grade</th><th>Stock</th><th>Price</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.items.map(p => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.grade}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={p.stock}
                          onChange={async (e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            try {
                              await adminUpdateProduct(p._id, { stock: next });
                              setProductsData(prev => ({
                                ...prev,
                                items: prev.items.map(x => x._id === p._id ? { ...x, stock: next } : x)
                              }));
                            } catch (err) { alert(err?.message || 'Failed to update stock'); }
                          }}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="no-spin"
                          value={p.price}
                          disabled={p?.user?.role === 'farmer'}
                          title={p?.user?.role === 'farmer' ? 'Price is controlled by the farmer' : 'Edit price'}
                          onChange={async (e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            try {
                              await adminUpdateProduct(p._id, { price: next });
                              setProductsData(prev => ({
                                ...prev,
                                items: prev.items.map(x => x._id === p._id ? { ...x, price: next } : x)
                              }));
                            } catch (err) { alert(err?.message || 'Failed to update price'); }
                          }}
                          style={{ width: 110 }}
                        />
                      </td>
                      <td>
                        <button className="view-all-btn" onClick={() => alert(`Open product ${p._id}`)}>Open</button>
                        <button className="view-all-btn" style={{ marginLeft: 8 }} onClick={async () => {
                          if (!confirm('Delete this product?')) return;
                          try { await adminDeleteProduct(p._id); await fetchProducts(); } catch (err) { alert(err?.message || 'Delete failed'); }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Orders</h3>
          <div>
            <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
              <option value="">All</option>
              {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button className="view-all-btn" style={{ marginLeft: 8 }} onClick={fetchOrders}>Filter</button>
          </div>
        </div>
        <div className="card-content">
          {loading ? <p>Loading...</p> : error ? <p className="err-text">{error}</p> : (
            ordersData.items.length === 0 ? <p>No orders</p> : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Status</th><th>Items</th><th>Total</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersData.items.map(o => (
                    <tr key={o._id}>
                      <td>{o._id}</td>
                      <td>
                        <select
                          value={o.status}
                          onChange={async (e) => {
                            const next = e.target.value;
                            try {
                              await adminUpdateOrder(o._id, { status: next });
                              setOrdersData(prev => ({
                                ...prev,
                                items: prev.items.map(x => x._id === o._id ? { ...x, status: next } : x)
                              }));
                            } catch (err) { alert(err?.message || 'Failed to update status'); }
                          }}
                        >
                          {['Pending','Processing','Shipped','Delivered','Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>{(o.items || []).length}</td>
                      <td>{formatCurrency(o.amount)}</td>
                      <td>
                        <button className="view-all-btn" onClick={() => alert(`Open order ${o._id}`)}>Open</button>
                        <button className="view-all-btn" style={{ marginLeft: 8 }} onClick={async () => {
                          if (!confirm('Delete this order?')) return;
                          try { await adminDeleteOrder(o._id); await fetchOrders(); } catch (err) { alert(err?.message || 'Delete failed'); }
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );

  // Simple hubs view: list hub users from Users tab data (role filter would be better here)
  const renderHubs = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header"><h3>Hubs</h3></div>
        <div className="card-content">
          <p>Tip: Filter users by role "hub" in Users tab for full list. Future: dedicated hub endpoints.</p>
        </div>
      </div>
    </div>
  );

  // Minimal reports placeholder
  const renderReports = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header"><h3>Feedback Reports</h3></div>
        <div className="card-content">
          <AdminFeedbackTable />
        </div>
      </div>
    </div>
  );

  // Settings: toggle theme (demo) and info
  const [dark, setDark] = useState(false);
  const renderSettings = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header"><h3>Settings</h3></div>
        <div className="card-content">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={dark} onChange={() => setDark(v => !v)} />
            Use dark header accents (demo)
          </label>
          <p style={{ marginTop: 12 }}>Further settings can be wired to backend config.</p>
        </div>
      </div>
    </div>
  );

  // Profile: show current admin basic info
  const renderProfile = () => (
    <div className="admin-dashboard">
      <div className="dashboard-card">
        <div className="card-header"><h3>Profile</h3></div>
        <div className="card-content">
          <p><b>Username:</b> {user.username}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Role:</b> {user.role}</p>
        </div>
      </div>
    </div>
  );

  // Customer Requests: show all customer product requests
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
  }, [active, loading, error, usersData, productsData, ordersData, summary, dark]);

  return (
    <DashboardLayout
      user={user}
      menuItems={menuItems}
      pageTitle="Admin Dashboard"
      roleName="Administrator"
      onMenuItemClick={setActive}
    >
      {body}
    </DashboardLayout>
  );
}