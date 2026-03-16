import React, { useState, useEffect } from "react";
import "../../../css/HubDashboard.css";
import "../../../css/HubRequests.css";
import { getHubIncomingRequests, acceptHubRequest, rejectHubRequest, getCurrentUser } from "../../../services/api";
import { useToast } from "../../notifications/ToastContainer";

export default function HubRequests({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, rejected
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [roleError, setRoleError] = useState(false);

  // Toast notifications
  const { showSuccess, showError, showWarning } = useToast();

  // Fetch requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching hub requests for user:', user);
        console.log('🔍 User role:', user?.role);
        console.log('🔍 Auth token exists:', !!localStorage.getItem('token'));

        // Debug: Check current user from backend
        try {
          const currentUser = await getCurrentUser();
          console.log('🔍 Backend user info:', currentUser);
        } catch (debugError) {
          console.error('❌ Failed to get current user info:', debugError);
        }

        const response = await getHubIncomingRequests();
        console.log('📊 Hub requests response:', response);

        // Check if response has data
        if (response && response.data && Array.isArray(response.data)) {
          console.log('✅ Found', response.data.length, 'requests');

          // Show notification only on manual refresh or first load
          if (response.data.length > 0 && !loading) {
            showSuccess(
              'Requests Updated',
              `Found ${response.data.length} customer request${response.data.length === 1 ? '' : 's'}`,
              { duration: 2000 }
            );
          }
          const fetchedRequests = response.data.map(req => ({
            id: req._id,
            customerName: req.orderRequest?.customerName || req.orderRequest?.customer?.username || 'Unknown',
            customerEmail: req.orderRequest?.customerEmail || req.orderRequest?.customer?.email,
            customerPhone: req.orderRequest?.customerPhone || req.orderRequest?.customer?.phone,
            productType: req.orderRequest?.productType || 'Product',
            grade: req.orderRequest?.grade,
            quantity: req.quantity,
            budgetMin: req.orderRequest?.budgetMin,
            budgetMax: req.orderRequest?.budgetMax,
            urgency: req.orderRequest?.urgency || 'normal',
            preferredHub: req.orderRequest?.preferredHub,
            description: req.orderRequest?.description,
            status: req.status,
            createdAt: req.createdAt
          }));

          setRequests(fetchedRequests);
        } else {
          setRequests([]);
        }
      } catch (error) {
        console.error("❌ Error fetching requests:", error);
        console.error("❌ Error status:", error?.response?.status);
        console.error("❌ Error message:", error?.response?.data?.message);
        console.error("❌ Full error response:", error?.response);

        // Don't throw error, just set empty array
        setRequests([]);

        // Check if this is an auth/role error
        if (error?.response?.status === 403) {
          console.error("🚫 Access denied - user may not have hub role");
          setRoleError(true);
        }

        // Only log auth errors, don't propagate them
        if (!error.isAuthError) {
          console.warn('Request loading failed due to non-auth error:', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Set up auto-refresh every 60 seconds to check for new requests (reduced frequency)
    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing hub requests...');
      fetchRequests();
    }, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await getHubIncomingRequests();

      if (response && response.data && Array.isArray(response.data)) {
        const fetchedRequests = response.data.map(req => ({
          id: req._id,
          customerName: req.orderRequest?.customerName || req.orderRequest?.customer?.username || 'Unknown',
          customerEmail: req.orderRequest?.customerEmail || req.orderRequest?.customer?.email,
          customerPhone: req.orderRequest?.customerPhone || req.orderRequest?.customer?.phone,
          productType: req.orderRequest?.productType,
          grade: req.orderRequest?.grade,
          quantity: req.quantity,
          budgetMin: req.orderRequest?.budgetMin,
          budgetMax: req.orderRequest?.budgetMax,
          urgency: req.orderRequest?.urgency,
          preferredHub: req.orderRequest?.preferredHub,
          description: req.orderRequest?.description,
          status: req.status,
          createdAt: req.createdAt
        }));

        setRequests(fetchedRequests);

        // Show refresh notification
        showSuccess(
          'Refreshed Successfully! 🔄',
          `Updated with ${fetchedRequests.length} request${fetchedRequests.length === 1 ? '' : 's'}`,
          { duration: 2000 }
        );
      } else {
        setRequests([]);
        showSuccess('Refreshed', 'No requests found', { duration: 2000 });
      }
    } catch (error) {
      console.error("Error refreshing requests:", error);
      showError(
        'Refresh Failed',
        'Failed to refresh requests. Please try again.',
        { duration: 3000 }
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === "all") return true;
    return req.status === filter;
  });

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      console.log(`🔄 Attempting to ${newStatus} request ${requestId}...`);

      // Find the request to get customer name
      const request = requests.find(req => req.id === requestId);
      const customerName = request?.customerName || 'Customer';

      if (newStatus === 'accepted') {
        await acceptHubRequest(requestId);
      } else if (newStatus === 'rejected') {
        await rejectHubRequest(requestId);
      } else {
        throw new Error('Invalid status update');
      }

      // Update local state
      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: newStatus } : req
        )
      );

      console.log(`✅ Request ${requestId} ${newStatus} successfully`);

      // Show beautiful success notification
      if (newStatus === 'accepted') {
        showSuccess(
          'Request Accepted! 🎉',
          `${customerName}'s request has been accepted successfully. They will be notified shortly.`,
          { duration: 4000 }
        );
      } else if (newStatus === 'rejected') {
        showWarning(
          'Request Rejected',
          `${customerName}'s request has been rejected. They will be notified of the decision.`,
          { duration: 4000 }
        );
      } else {
        showSuccess(
          'Status Updated',
          `Request status changed to ${newStatus} successfully.`,
          { duration: 3000 }
        );
      }

    } catch (error) {
      console.error("❌ Error updating request status:", error);
      console.error("❌ Error details:", error?.response?.data);

      // Show beautiful error notifications
      if (error?.response?.status === 403) {
        showError(
          'Access Denied 🚫',
          `You don't have permission to ${newStatus} requests. Current role: ${user?.role}. Required: hub or admin.`,
          { duration: 6000 }
        );
      } else {
        showError(
          'Action Failed',
          `Failed to ${newStatus} request: ${error.message}`,
          { duration: 5000 }
        );
      }
    }
  };

  const getUrgencyBadge = (urgency) => {
    const badges = {
      immediate: { color: "#dc2626", label: "🔴 Immediate" },
      urgent: { color: "#f59e0b", label: "🟡 Urgent" },
      normal: { color: "#10b981", label: "🟢 Normal" }
    };
    return badges[urgency] || badges.normal;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "#fef3c7", color: "#92400e", label: "⏳ Pending" },
      accepted: { bg: "#d1fae5", color: "#065f46", label: "✅ Accepted" },
      rejected: { bg: "#fee2e2", color: "#991b1b", label: "❌ Rejected" }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="hub-requests">
      {/* Header */}
      <div className="page-header" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
        <div>
          <h2>Customer Requests</h2>
          <p>Manage custom order requests from customers • Auto-refreshes every 60s</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {refreshing ? '🔄' : '↻'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="header-badge">{filteredRequests.length} Requests</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All ({requests.length})
        </button>
        <button
          className={filter === "pending" ? "active" : ""}
          onClick={() => setFilter("pending")}
        >
          Pending ({requests.filter(r => r.status === "pending").length})
        </button>
        <button
          className={filter === "accepted" ? "active" : ""}
          onClick={() => setFilter("accepted")}
        >
          Accepted ({requests.filter(r => r.status === "accepted").length})
        </button>
        <button
          className={filter === "rejected" ? "active" : ""}
          onClick={() => setFilter("rejected")}
        >
          Rejected ({requests.filter(r => r.status === "rejected").length})
        </button>
      </div>

      {/* Requests List */}
      <div className="requests-container">
        {roleError ? (
          <div className="empty-state">
            <div className="empty-icon">🚫</div>
            <h3>Access Denied</h3>
            <p>You don't have permission to view hub requests.</p>
            <p><small>Current role: {user?.role || 'Unknown'}</small></p>
            <p><small>Required role: hub or admin</small></p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No requests found</h3>
            <p>There are no {filter !== "all" ? filter : ""} requests at the moment.</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map(request => {
              const isExpanded = expandedRequest === request.id;
              const urgencyBadge = getUrgencyBadge(request.urgency);
              const statusBadge = getStatusBadge(request.status);

              return (
                <div key={request.id} className="request-card">
                  {/* Card Header */}
                  <div
                    className="request-header"
                    onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                  >
                    <div className="request-info">
                      <h3>{request.customerName}</h3>
                      <p>{request.grade} • {request.quantity} kg</p>
                    </div>
                    <div className="request-badges">
                      <span
                        className="urgency-badge"
                        style={{ color: urgencyBadge.color }}
                      >
                        {urgencyBadge.label}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: statusBadge.bg,
                          color: statusBadge.color
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="request-body">
                    <div className="request-details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Budget Range:</span>
                        <span className="detail-value">₹{request.budgetMin} - ₹{request.budgetMax}/kg</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Preferred Hub:</span>
                        <span className="detail-value">{request.preferredHub}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Requested:</span>
                        <span className="detail-value">
                          {new Date(request.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="expanded-details">
                        <div className="detail-section">
                          <h4>Description</h4>
                          <p>{request.description}</p>
                        </div>

                        <div className="detail-section">
                          <h4>Contact Information</h4>
                          <p><strong>Email:</strong> {request.customerEmail}</p>
                          <p><strong>Phone:</strong> {request.customerPhone}</p>
                        </div>

                        <div className="detail-section">
                          <h4>Order Details</h4>
                          <div className="details-grid">
                            <div>
                              <strong>Product:</strong> {request.productType}
                            </div>
                            <div>
                              <strong>Grade:</strong> {request.grade}
                            </div>
                            <div>
                              <strong>Quantity:</strong> {request.quantity} kg
                            </div>
                            <div>
                              <strong>Urgency:</strong> {request.urgency}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div className="request-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleStatusChange(request.id, "accepted")}
                        >
                          ✅ Accept Request
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleStatusChange(request.id, "rejected")}
                        >
                          ❌ Reject Request
                        </button>
                        <button className="btn-contact">
                          📞 Contact Customer
                        </button>
                      </div>
                    )}

                    {request.status === "accepted" && (
                      <div className="request-actions">
                        <button className="btn-contact">
                          📞 Contact Customer
                        </button>
                        <button className="btn-secondary">
                          📋 View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
