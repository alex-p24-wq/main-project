import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { addToWishlist, removeFromWishlist, getWishlist } from "../../../services/api";
import "../../../css/CustomerDashboard.css";
import { analyzeImageHeuristic } from "../../../utils/imageGrading";

export default function CustomerMarketplace({ user }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);

  // Scan modal state
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState(null); // product
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");

  // Categories mapped to backend grades
  const categories = [
    { id: "all", name: "All Products" },
    { id: "Premium", name: "Premium Grade" },
    { id: "Organic", name: "Organic" },
    { id: "Regular", name: "Regular Grade" },
  ];

  // Load products from backend (public list)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (activeCategory !== "all") params.grade = activeCategory;
        if (searchQuery) params.q = searchQuery;
        const { data } = await api.get("/customer/products", { params });
        setItems(data?.items || []);
        // fetch wishlist (ignore errors if unauthenticated)
        try {
          const w = await getWishlist();
          const ids = (w.items || []).map(p => String(p._id || p.id));
          setWishlistIds(ids);
        } catch (_) {}
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeCategory, searchQuery]);

  // Client-side sort (basic)
  const sorted = useMemo(() => {
    const arr = [...items];
    switch (sortBy) {
      case "price-low":
        return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating":
        // Placeholder: no ratings from backend yet
        return arr;
      case "popularity":
      default:
        return arr; // no popularity metric yet
    }
  }, [items, sortBy]);

  // Using the shared strict image validation heuristic imported from utils

  const openScan = (product) => {
    setScanTarget(product);
    setScanResult(null);
    setScanError("");
    setScanOpen(true);
  };

  const runScan = async () => {
    if (!scanTarget?.image) return;
    setScanLoading(true);
    setScanResult(null);
    setScanError("");
    try {
      // For cross-origin images, the heuristic needs a proxy or will fail on canvas context. 
      // Assuming images are hosted on the same origin or have CORS headers allowing this, as established by the codebase.
      const resultObj = await analyzeImageHeuristic(scanTarget.image);
      setScanResult(resultObj);
    } catch (e) {
      setScanError("Failed to scan the image. CORS or formatting issue. Try again.");
    } finally {
      setScanLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <div className="customer-marketplace">
      {/* Hero */}
      <div className="market-hero">
        <div>
          <h2>Marketplace</h2>
          <p>Discover premium cardamom directly from farmers</p>
        </div>
        <div className="hero-badge">🌿 Fresh Harvest</div>
      </div>

      {/* Controls */}
      <div className="marketplace-controls controls-card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">🔍</button>
        </div>
        
        <div className="sort-dropdown">
          <label htmlFor="sort">Sort by:</label>
          <select 
            id="sort" 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity">Default</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="marketplace-layout">
        {/* Sidebar */}
        <div className="categories-sidebar card">
          <h3>Categories</h3>
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(category.id)}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Products */}
        <div className="products-grid">
          {loading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="product-card skeleton" key={i}>
                  <div className="product-image skeleton-image" />
                  <div className="product-details">
                    <div className="skeleton-text" style={{ width: '70%' }} />
                    <div className="skeleton-text" style={{ width: '40%' }} />
                    <div className="skeleton-text" style={{ width: '50%' }} />
                  </div>
                </div>
              ))}
            </>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <h3>Failed to load products</h3>
              <p>{error}</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting filters or search</p>
              <button className="reset-btn" onClick={() => {
                setActiveCategory("all");
                setSearchQuery("");
              }}>
                Reset Filters
              </button>
            </div>
          ) : (
            sorted.map((p) => (
              <div className="product-card fancy" key={p._id || p.id}>
                <div className="product-image">
                  {p.image ? <img src={p.image} alt={p.name} /> : <div className="empty-img">📦</div>}
                  {p.grade && <div className={`grade-pill ${p.grade.toLowerCase()}`}>{p.grade}</div>}
                  <div className="image-actions">
                    <button className="view-btn" title="View">👁️</button>
                    <button className="scan-btn" title="Scan image" onClick={() => openScan(p)}>🔎 Scan</button>
                  </div>
                </div>
                <div className="product-details">
                  <h3>{p.name}</h3>
                  <p className="product-seller">Grade: {p.grade}</p>
                  {p.address && <p className="product-seller">📍 {p.address}</p>}
                  <p className="product-price">₹{p.price}/kg · {p.stock} kg</p>
                  <div className="product-actions">
                    <button className="add-to-cart-btn" onClick={() => {
                      const id = p._id || p.id;
                      navigate(`/checkout/${id}`);
                    }}>Buy Now</button>
                    <button className={`wishlist-btn ${wishlistIds.includes(String(p._id || p.id)) ? 'active' : ''}`}
                      title={wishlistIds.includes(String(p._id || p.id)) ? 'Remove from wishlist' : 'Add to wishlist'}
                      onClick={async () => {
                        const id = String(p._id || p.id);
                        try {
                          if (wishlistIds.includes(id)) {
                            const res = await removeFromWishlist(id);
                            setWishlistIds((res.items || []).map(x => String(x._id || x.id)));
                          } else {
                            const res = await addToWishlist(id);
                            setWishlistIds((res.items || []).map(x => String(x._id || x.id)));
                          }
                        } catch (e) {
                          alert(e?.message || 'Wishlist action failed');
                        }
                      }}>
                      {wishlistIds.includes(String(p._id || p.id)) ? '💔' : '❤️'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scan Modal */}
      {scanOpen && (
        <div className="scan-modal-backdrop" onClick={() => setScanOpen(false)}>
          <div className="scan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scan-modal-header">
              <h3>Scan Product Image</h3>
              <button className="close-btn" onClick={() => setScanOpen(false)}>✕</button>
            </div>
            <div className="scan-modal-body">
              {scanTarget?.image ? (
                <img src={scanTarget.image} alt={scanTarget.name} />
              ) : (
                <div className="empty-img" style={{ height: 240 }}>No image</div>
              )}
              <div className="scan-result">
                {scanLoading ? (
                  <span>Analyzing...</span>
                ) : scanError ? (
                  <span className="error-text">{scanError}</span>
                ) : scanResult?.isCardamom === false ? (
                  <span><strong style={{ color: "#c62828" }}>Not Cardamom Detected.</strong> ({scanResult.featureAnalysis?.cardamomPercentage}% match)</span>
                ) : scanResult ? (
                  <span><strong>AI Validated Grade:</strong> {scanResult.quality}</span>
                ) : (
                  <span>Click "Scan Quality" to analyze this photo.</span>
                )}
              </div>
            </div>
            <div className="scan-modal-actions">
              <button className="btn-ghost" onClick={() => setScanOpen(false)}>Close</button>
              <button className="btn-primary" onClick={runScan} disabled={scanLoading || !scanTarget?.image}>
                {scanLoading ? "Scanning..." : "Scan Quality"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}