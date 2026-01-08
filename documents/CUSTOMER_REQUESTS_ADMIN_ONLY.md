# Customer Product Requests - Admin Only Access

## Overview
Customer product requests are now managed exclusively by administrators. Hub managers no longer have access to view or manage customer product requests.

## Changes Made

### 1. Backend Changes (`backend/routes/orderRequest.js`)

#### New Endpoint: `/admin-requests` (Admin Only)
- **Route**: `GET /api/order-requests/admin-requests`
- **Access**: Admin role only
- **Purpose**: Fetch all customer product requests
- **Features**:
  - Filter by status (pending, accepted, rejected, completed)
  - Filter by preferred hub
  - Pagination support
  - Populates customer information

#### Updated Endpoint: `/hub-requests` (Deprecated)
- **Route**: `GET /api/order-requests/hub-requests`
- **Access**: Admin role only (restricted from hub managers)
- **Status**: Deprecated - kept for backward compatibility
- **Behavior**: Now redirects hub managers with access denied message

#### Updated Endpoint: `/status` Update (Admin Only)
- **Route**: `PATCH /api/order-requests/:id/status`
- **Access**: Admin role only (changed from hub/admin)
- **Purpose**: Update request status (accept/reject/complete)

### 2. Frontend API Service (`frontend/src/services/api.js`)

#### New Function: `getAdminOrderRequests`
```javascript
export const getAdminOrderRequests = async (params = {}) => {
  try {
    const res = await api.get('/order-requests/admin-requests', { params });
    return res.data;
  } catch (error) {
    const msg = error?.response?.data?.message || error?.message || 'Failed to fetch admin requests';
    throw { message: msg };
  }
};
```

### 3. Hub Dashboard Changes (`frontend/src/components/dashboards/HubDashboard.jsx`)

#### Removed "Requests" Menu Item
**Before:**
```javascript
{ id: "requests", label: "Requests", icon: "📝" },
```

**After:** Removed completely

#### Removed Route Handling
- Removed `case "requests"` from `renderPageContent()`
- Removed `HubRequests` component import

### 4. Admin Dashboard Changes (`frontend/src/components/dashboards/AdminDashboard.jsx`)

#### Added "Customer Requests" Menu Item
```javascript
{ id: "requests", label: "Customer Requests", icon: "📝" },
```

#### Added Import
```javascript
import AdminRequests from "./admin/AdminRequests";
```

#### Added Render Function
```javascript
const renderRequests = () => <AdminRequests user={user} />;
```

#### Updated Body Logic
```javascript
if (active === "requests") return renderRequests();
```

### 5. New Component: AdminRequests (`frontend/src/components/dashboards/admin/AdminRequests.jsx`)

Created new component specifically for admin to manage customer requests with features:
- **Auto-refresh**: Refreshes every 60 seconds
- **Manual refresh**: Button to refresh on demand
- **Filter tabs**: All, Pending, Accepted, Rejected, Completed
- **Status management**: Accept or reject requests
- **Detailed view**: Shows all customer and request details
- **Response tracking**: Shows admin responses and timestamps

## API Endpoints Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/order-requests` | POST | customer | Create new product request |
| `/order-requests/my-requests` | GET | customer | Get own requests |
| `/order-requests/admin-requests` | GET | admin | Get all requests (NEW) |
| `/order-requests/hub-requests` | GET | admin | Deprecated - use admin-requests |
| `/order-requests/:id/status` | PATCH | admin | Update request status |
| `/order-requests/:id` | GET | customer/admin | Get single request |
| `/order-requests/:id` | DELETE | customer | Delete own pending request |

## User Flow

### Customer Flow
1. Customer creates product request via "Request Order" page
2. Request is submitted with status "pending"
3. Customer can view their requests in "My Orders" section
4. Customer receives updates when admin responds

### Admin Flow
1. Admin logs into Admin Dashboard
2. Clicks on "Customer Requests" menu item
3. Views all customer product requests
4. Can filter by status (All, Pending, Accepted, Rejected, Completed)
5. Reviews request details (product, quantity, budget, urgency)
6. Can accept or reject pending requests
7. System auto-refreshes every 60 seconds for new requests

### Hub Manager Flow
1. Hub managers no longer see "Requests" menu item
2. If they try to access old `/hub-requests` endpoint, they get 403 Forbidden
3. Error message: "Access denied. Customer product requests are now managed by administrators only."

## Security & Access Control

### Admin Only Access
```javascript
// Backend route protection
router.get('/admin-requests', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admins can access
});

router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  // Only admins can update status
});
```

### Hub Managers Blocked
```javascript
// Old hub-requests endpoint now blocks hub role
if (req.user.role !== 'admin') {
  return res.status(403).json({ 
    message: 'Access denied. Customer product requests are now managed by administrators only.' 
  });
}
```

## Features

### AdminRequests Component Features

1. **Real-time Updates**
   - Auto-refresh every 60 seconds
   - Manual refresh button
   - Loading and refreshing states

2. **Request Filtering**
   - All requests
   - Pending (awaiting action)
   - Accepted (approved by admin)
   - Rejected (denied by admin)
   - Completed (fulfilled)

3. **Request Details Display**
   - Customer information (name, email, phone)
   - Product specifications (type, grade, quantity)
   - Budget range
   - Urgency level (high/medium/low)
   - Preferred hub
   - Description
   - Request timestamp

4. **Actions**
   - Accept request (with confirmation)
   - Reject request
   - View response history
   - Status badges with color coding

5. **UI/UX**
   - Clean card-based layout
   - Color-coded status badges
   - Urgency indicators (🔴 high, 🟡 medium, 🟢 low)
   - Modal confirmations
   - Success/error notifications

## Status Colors

| Status | Color | Hex Code |
|--------|-------|----------|
| Pending | Orange | #ff9800 |
| Accepted | Green | #4caf50 |
| Rejected | Red | #f44336 |
| Completed | Blue | #2196f3 |

## Benefits

### For Administrators
- ✅ Centralized request management
- ✅ Better oversight and control
- ✅ Consistent handling of customer requests
- ✅ Clear audit trail
- ✅ Single point of responsibility

### For Hub Managers
- ✅ Simplified dashboard (reduced clutter)
- ✅ Focus on core hub operations
- ✅ No confusion about request handling

### For Customers
- ✅ Consistent service quality
- ✅ Direct admin oversight
- ✅ Faster response times
- ✅ Better accountability

## Testing

### Test Admin Access
1. Login as admin
2. Navigate to Admin Dashboard
3. Click "Customer Requests" menu item
4. Verify all customer requests are visible
5. Test accept/reject actions
6. Verify auto-refresh works

### Test Hub Manager Restriction
1. Login as hub manager
2. Verify "Requests" menu item is not visible
3. Try accessing old hub requests page (should be blocked)
4. Verify other hub functions still work

### Test Customer Request Flow
1. Login as customer
2. Create new product request
3. Verify request appears in "My Orders"
4. Login as admin
5. Verify request appears in admin requests
6. Accept/reject the request
7. Login as customer again
8. Verify status update is visible

## Files Modified

### Backend
- ✅ `backend/routes/orderRequest.js` - Added admin endpoint, restricted hub access

### Frontend
- ✅ `frontend/src/services/api.js` - Added `getAdminOrderRequests` function
- ✅ `frontend/src/components/dashboards/HubDashboard.jsx` - Removed requests menu
- ✅ `frontend/src/components/dashboards/AdminDashboard.jsx` - Added requests menu
- ✅ `frontend/src/components/dashboards/admin/AdminRequests.jsx` - New component (created)

## Migration Notes

- Existing customer requests remain in database
- No data migration needed
- Hub managers immediately lose access
- Admins immediately gain access
- All existing routes continue to work
- Backward compatible (old endpoint still exists but restricted)

## Future Enhancements

1. **Email Notifications**: Notify customers when admin responds
2. **Bulk Actions**: Accept/reject multiple requests at once
3. **Assignment**: Assign requests to specific hubs
4. **Analytics**: Track request trends and response times
5. **Export**: Export requests to CSV/Excel
6. **Notes**: Add internal notes to requests
7. **Priority Sorting**: Sort by urgency automatically
8. **Search**: Search requests by customer name, product, etc.
