import React, { useState, useEffect } from "react";
import "../../../css/CardamomComponents.css";
import { getAllHubs } from "../../../services/api";
import api from "../../../services/api";
import KeralaHubMap from "./KeralaHubMap";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../notifications/ToastContainer";

export default function HubList({ user }) {
  const [hubs, setHubs] = useState([]);
  const [bulkProducts, setBulkProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterHubType, setFilterHubType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [expandedHub, setExpandedHub] = useState(null);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Load hubs data
  useEffect(() => {
    const loadHubs = async () => {
      try {
        setLoading(true);
        const response = await getAllHubs();
        setHubs(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to load hubs:', error);
        // Don't throw or cause auth issues - just set empty array and show error state
        setHubs([]);
        
        // Only log auth errors, don't propagate them
        if (!error.isAuthError) {
          console.warn('Hub loading failed due to non-auth error:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHubs();
  }, []);

  // Load bulk products for all hubs
  useEffect(() => {
    const loadBulkProducts = async () => {
      try {
        const response = await api.get('/hubmanager/bulk-products', {
          params: { limit: 1000, status: 'accepted', forNetwork: true } // Get all accepted bulk products for network view
        });
        if (response.data && response.data.items) {
          // Filter to only show accepted bulk products
          const acceptedProducts = response.data.items.filter(product => 
            product.bulkProductStatus === 'accepted'
          );
          setBulkProducts(acceptedProducts);
        }
      } catch (error) {
        console.error('Failed to load bulk products:', error);
        setBulkProducts([]);
      }
    };

    loadBulkProducts();
  }, []);

  // Filter and sort hubs
  const filteredAndSortedHubs = React.useMemo(() => {
    let filtered = hubs.filter(hub => {
      const matchesSearch = hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hub.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hub.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = !filterState || hub.state === filterState;
      const matchesHubType = !filterHubType || hub.hubType === filterHubType;
      const matchesStatus = !filterStatus || 
                          (filterStatus === "active" && hub.isActive) ||
                          (filterStatus === "inactive" && !hub.isActive);
      const matchesDistrict = !selectedDistrict || hub.district === selectedDistrict;
      
      return matchesSearch && matchesState && matchesHubType && matchesStatus && matchesDistrict;
    });

    // Sort hubs
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      
      if (sortBy === "capacity") {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [hubs, searchTerm, filterState, filterHubType, filterStatus, selectedDistrict, sortBy, sortOrder]);

  // Group hubs by district
  const hubsByDistrict = React.useMemo(() => {
    const grouped = {};
    filteredAndSortedHubs.forEach(hub => {
      if (!grouped[hub.district]) {
        grouped[hub.district] = [];
      }
      grouped[hub.district].push(hub);
    });
    return grouped;
  }, [filteredAndSortedHubs]);

  // Get bulk products for a specific hub
  const getBulkProductsForHub = (hubName) => {
    return bulkProducts.filter(product => 
      product.nearestHub === hubName && 
      product.bulkProductStatus === 'accepted'
    );
  };

  // Get bulk products for a specific district
  const getBulkProductsForDistrict = (district) => {
    return bulkProducts.filter(product => 
      product.district === district && 
      product.bulkProductStatus === 'accepted'
    );
  };

  // Get unique states, districts and hub types for filters
  const uniqueStates = [...new Set(hubs.map(hub => hub.state))].sort();
  const uniqueDistricts = [...new Set(hubs.map(hub => hub.district))].sort();
  const uniqueHubTypes = [...new Set(hubs.map(hub => hub.hubType))].sort();

  const handleDistrictSelect = (districtName) => {
    if (!districtName) return;
    const encoded = encodeURIComponent(districtName);
    navigate(`/hubs/district/${encoded}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getHubTypeColor = (hubType) => {
    const colors = {
      'Primary Production Hub': '#4CAF50',
      'Regional Hub': '#2196F3',
      'Export Hub': '#FF9800',
      'Processing Hub': '#9C27B0',
      'Distribution Hub': '#607D8B',
      'Collection Hub': '#795548',
      'Metropolitan Hub': '#E91E63',
      'Technology Hub': '#00BCD4',
      'Port Hub': '#3F51B5',
      'Commercial Hub': '#FFC107'
    };
    return colors[hubType] || '#757575';
  };

  const formatCapacity = (capacity) => {
    if (capacity >= 1000) {
      return `${(capacity / 1000).toFixed(1)}K kg`;
    }
    return `${capacity} kg`;
  };

  if (loading) {
    return (
      <div className="hub-dashboard">
        <div className="dashboard-card">
          <div className="card-content">
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3>Loading hub network...</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getGradeBadge = (grade) => {
    const badges = {
      Premium: { bg: "#fef3c7", color: "#92400e", icon: "⭐" },
      Organic: { bg: "#d1fae5", color: "#065f46", icon: "🌿" },
      Regular: { bg: "#e0e7ff", color: "#3730a3", icon: "📦" }
    };
    return badges[grade] || badges.Regular;
  };

  return (
    <div className="hub-dashboard">
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Hub Network ({hubs.length} Total Hubs, {bulkProducts.length} Bulk Products)</h3>
        </div>

        {/* Interactive Kerala Map */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0e0e0', background: '#fafcff' }}>
          <KeralaHubMap onSelectDistrict={handleDistrictSelect} />
        </div>

        {/* Filters */}
        <div style={{ padding: '20px', background: '#f9fafb', borderBottom: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="🔍 Search hubs or districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value="">📍 All Districts</option>
              {uniqueDistricts.map(district => {
                const districtProducts = getBulkProductsForDistrict(district);
                return (
                  <option key={district} value={district}>
                    {district} ({districtProducts.length} products)
                  </option>
                );
              })}
            </select>
          </div>
          
          {selectedDistrict && (
            <div style={{ 
              padding: '12px', 
              background: '#e0f2fe', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', color: '#0369a1' }}>
                📍 Viewing: <strong>{selectedDistrict}</strong>
              </span>
              <button
                onClick={() => setSelectedDistrict("")}
                style={{
                  padding: '6px 12px',
                  background: '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* Hubs Grouped by District */}
        <div style={{ padding: '20px' }}>
          {Object.keys(hubsByDistrict).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <h3>No hubs found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            Object.entries(hubsByDistrict).map(([district, districtHubs]) => {
              const districtProducts = getBulkProductsForDistrict(district);
              
              return (
                <div 
                  key={district}
                  style={{
                    marginBottom: '24px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'white'
                  }}
                >
                  {/* District Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: 'white',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                        📍 {district}
                      </h3>
                      <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                        {districtHubs.length} Hub{districtHubs.length !== 1 ? 's' : ''} • {districtProducts.length} Bulk Product{districtProducts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Total Value: ₹{districtProducts.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                    </div>
                  </div>

                  {/* Hubs in District */}
                  <div style={{ padding: '20px' }}>
                    {districtHubs.map(hub => {
                      const hubProducts = getBulkProductsForHub(hub.name);
                      const isExpanded = expandedHub === hub._id;
                      
                      return (
                        <div 
                          key={hub._id}
                          style={{
                            marginBottom: '16px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Hub Header */}
                          <div 
                            onClick={() => setExpandedHub(isExpanded ? null : hub._id)}
                            style={{
                              padding: '16px',
                              background: hubProducts.length > 0 ? '#f0fdf4' : '#f9fafb',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                  {hub.name}
                                </h4>
                                {hubProducts.length > 0 && (
                                  <span style={{
                                    background: '#059669',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>
                                    {hubProducts.length} Product{hubProducts.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                                📫 {hub.address}
                              </p>
                              {hub.contactPerson && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#9ca3af' }}>
                                  👤 {hub.contactPerson} {hub.phone && `• 📞 ${hub.phone}`}
                                </p>
                              )}
                            </div>
                            <div style={{ fontSize: '20px' }}>
                              {isExpanded ? '▼' : '▶'}
                            </div>
                          </div>

                          {/* Hub Bulk Products */}
                          {isExpanded && (
                            <div style={{ padding: '16px', background: 'white' }}>
                              {hubProducts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                  <p style={{ margin: 0 }}>📦 No bulk products for this hub yet</p>
                                </div>
                              ) : (
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                  gap: '16px'
                                }}>
                                  {hubProducts.map(product => {
                                    const gradeBadge = getGradeBadge(product.grade);
                                    
                                    return (
                                      <div
                                        key={product._id}
                                        style={{
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '8px',
                                          overflow: 'hidden',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                          e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.boxShadow = 'none';
                                          e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                      >
                                        {/* Product Image */}
                                        {product.image && (
                                          <div style={{
                                            width: '100%',
                                            height: '140px',
                                            overflow: 'hidden',
                                            background: '#f3f4f6'
                                          }}>
                                            <img
                                              src={product.image}
                                              alt={product.name}
                                              style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                              }}
                                            />
                                          </div>
                                        )}

                                        {/* Product Info */}
                                        <div style={{ padding: '12px' }}>
                                          <div style={{ marginBottom: '8px' }}>
                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600' }}>
                                              {product.name}
                                            </h5>
                                            <span
                                              style={{
                                                background: gradeBadge.bg,
                                                color: gradeBadge.color,
                                                padding: '3px 8px',
                                                borderRadius: '10px',
                                                fontSize: '11px',
                                                fontWeight: '500'
                                              }}
                                            >
                                              {gradeBadge.icon} {product.grade}
                                            </span>
                                          </div>

                                          <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px',
                                            background: '#f9fafb',
                                            borderRadius: '6px',
                                            marginBottom: '8px'
                                          }}>
                                            <div>
                                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Price/kg</div>
                                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669' }}>
                                                ₹{product.price}
                                              </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                              <div style={{ fontSize: '11px', color: '#6b7280' }}>Stock</div>
                                              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>
                                                {product.stock} kg
                                              </div>
                                            </div>
                                          </div>

                                          <div style={{
                                            padding: '8px',
                                            background: '#fef3c7',
                                            borderRadius: '6px',
                                            textAlign: 'center'
                                          }}>
                                            <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '2px' }}>
                                              Total Value
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#92400e' }}>
                                              ₹{(product.price * product.stock).toLocaleString()}
                                            </div>
                                          </div>

                                          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6b7280' }}>
                                            <div>👨‍🌾 {product.user?.username}</div>
                                            {product.user?.phone && (
                                              <div>📞 {product.user.phone}</div>
                                            )}
                                          </div>

                                          {product.description && (
                                            <div style={{
                                              marginTop: '8px',
                                              padding: '8px',
                                              background: '#f9fafb',
                                              borderRadius: '6px',
                                              fontSize: '12px',
                                              color: '#4b5563',
                                              lineHeight: '1.4'
                                            }}>
                                              {product.description.length > 80
                                                ? `${product.description.substring(0, 80)}...`
                                                : product.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
