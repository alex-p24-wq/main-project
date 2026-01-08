# Bulk Product Hub Visibility Implementation

## Overview
This document describes the implementation of bulk product visibility for hub managers, ensuring that bulk products added by farmers are only shown to the hub manager of the selected hub.

## Changes Made

### 1. Backend Changes

#### a. Product Model Update (`backend/models/Product.js`)
- **Added field**: `hubId` - A reference to the Hub document
- **Purpose**: Store a direct reference to the hub for efficient querying
- **Type**: `mongoose.Schema.Types.ObjectId` referencing 'Hub' collection

```javascript
hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' }
```

#### b. Farmer Route Enhancement (`backend/routes/farmer.js`)
- **Updated**: Product creation endpoint to automatically find and store hub ID
- **Logic**: 
  1. When a bulk product is created (type === 'Bulk' or stock >= 20)
  2. System looks up the hub by name using `nearestHub` field
  3. If found, stores the hub's ObjectId in `hubId` field
  
```javascript
// Find hub ID by name for bulk products
let hubId = undefined;
if (isBulkProduct && nearestHub) {
  const { default: Hub } = await import('../models/Hub.js');
  const hub = await Hub.findOne({ name: nearestHub.trim() });
  if (hub) {
    hubId = hub._id;
  }
}
```

#### c. Hub Manager Route Enhancement (`backend/routes/hubmanager.js`)
- **Updated**: `/hubmanager/bulk-products` endpoint
- **Features**:
  1. Retrieves hub name from user's `profileData.assignedHub`
  2. Looks up hub by name to get hub ID
  3. Filters products by `hubId` (primary) or `nearestHub` (fallback)
  4. Returns only bulk products assigned to that specific hub

**Query Logic**:
```javascript
let query = { type: 'Bulk' };

// Filter by hub - match either hubId or nearestHub name
if (hubId) {
  query.hubId = hubId;
} else if (hubName) {
  query.nearestHub = hubName;
}
```

### 2. Frontend Changes

#### a. New Component: HubBulkProducts (`frontend/src/components/dashboards/hubmanager/HubBulkProducts.jsx`)
A comprehensive component for hub managers to view and manage bulk products.

**Features**:
- ✅ Displays all bulk products assigned to the hub
- ✅ Search functionality (by name, district, description)
- ✅ Filter by grade (Premium, Organic, Regular)
- ✅ Product cards with complete information
- ✅ Detailed product modal view
- ✅ Direct contact options (call/email farmer)
- ✅ Beautiful responsive UI
- ✅ Real-time refresh capability
- ✅ Toast notifications for user feedback

**Key Functionality**:
```javascript
// Fetches bulk products specific to hub manager's assigned hub
const hubName = user?.profileData?.assignedHub;
const response = await api.get('/hubmanager/bulk-products', { 
  params: { hubName } 
});
```

#### b. Hub Dashboard Update (`frontend/src/components/dashboards/HubDashboard.jsx`)
- **Added**: "Bulk Products" menu item (📦)
- **Import**: HubBulkProducts component
- **Routing**: New case for "bulkproducts" page

### 3. Data Flow

```
Farmer Creates Bulk Product
    ↓
Selects District → Fetches Available Hubs → Selects Specific Hub
    ↓
Frontend sends: { nearestHub: "Hub Name", type: "Bulk", ... }
    ↓
Backend receives request
    ↓
Looks up Hub by name → Gets Hub ObjectId
    ↓
Saves Product with both:
  - nearestHub: "Hub Name" (string)
  - hubId: ObjectId (reference)
    ↓
Hub Manager logs in
    ↓
System reads: user.profileData.assignedHub
    ↓
Queries products WHERE hubId = assigned hub's ObjectId
    ↓
Displays only relevant bulk products
```

## Hub Manager Setup

For this feature to work properly, hub managers must have their assigned hub configured:

### Option 1: During Registration
When registering a hub manager, set:
```javascript
{
  role: 'hub',
  profileData: {
    assignedHub: 'Hub Name Here'
  }
}
```

### Option 2: Admin Update
Admin can update user profile:
```javascript
await User.findByIdAndUpdate(hubManagerId, {
  'profileData.assignedHub': 'Hub Name Here'
});
```

## Benefits

1. **Accurate Filtering**: Uses ObjectId references for precise hub-product relationships
2. **Backward Compatible**: Falls back to name-based matching if hubId not available
3. **Scalable**: Indexed queries using ObjectId are more efficient than string matching
4. **Maintainable**: Clear separation between hub assignment (name) and hub relationship (ID)
5. **Secure**: Hub managers only see products assigned to their hub
6. **User-Friendly**: Beautiful UI with search, filters, and detailed views

## Testing Checklist

- [ ] Farmer can create bulk product and select hub
- [ ] Product saves with both nearestHub (name) and hubId (ObjectId)
- [ ] Hub manager with assignedHub sees only their hub's products
- [ ] Hub manager without assignedHub sees appropriate message
- [ ] Search functionality works correctly
- [ ] Grade filters work correctly
- [ ] Product detail modal displays complete information
- [ ] Contact actions (call/email) work correctly
- [ ] Refresh functionality updates product list
- [ ] Toast notifications appear for all actions

## Future Enhancements

1. **Bulk Order Management**: Allow hub managers to create orders from bulk products
2. **Price Negotiation**: Enable communication thread for price negotiation
3. **Quality Verification**: Add quality check workflow before accepting products
4. **Inventory Sync**: Automatically update hub inventory when bulk products arrive
5. **Analytics**: Show trends in bulk product offerings and purchases
6. **Notifications**: Real-time alerts when new bulk products are added
7. **Export Reports**: Generate reports of bulk product transactions

## Security Considerations

- ✅ Role-based access: Only 'hub' role can access bulk products endpoint
- ✅ Hub isolation: Products filtered by assigned hub
- ✅ Authentication required: requireAuth middleware enforced
- ⚠️ Recommend: Add additional validation to ensure hub managers can only access their own hub's data
- ⚠️ Recommend: Audit log for bulk product access and modifications

## Notes

- Bulk products are defined as products with `type: 'Bulk'` OR `stock >= 20 kg`
- Farmers must select a hub when creating bulk products (required field)
- Hub selection is dynamically filtered by the farmer's selected district
- Only 14 cardamom-producing districts in Kerala are supported
