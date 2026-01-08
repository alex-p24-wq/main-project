# Bulk Product Hub Assignment - Quick Start Guide

## What Was Implemented

Bulk products added by farmers are now **only visible to the hub manager of the selected hub**. This ensures proper inventory management and hub-specific product visibility.

## How It Works

### For Farmers 🌾
1. Navigate to "Bulk Product Management" in the farmer dashboard
2. Fill in product details (name, grade, price, quantity ≥ 20kg)
3. **Select District** from Kerala's 14 cardamom-producing districts
4. **Select Hub** from the available hubs in that district
5. Submit the form

**Result**: The bulk product is now assigned to the selected hub.

### For Hub Managers 🏢
1. Navigate to "Bulk Products" in the hub dashboard (new menu item 📦)
2. View all bulk products assigned to your hub
3. Search and filter by grade (Premium, Organic, Regular)
4. Click on products to view details
5. Contact farmers directly (call/email buttons)

**Result**: Only see bulk products assigned to your specific hub.

## Setup Instructions

### Step 1: Assign Hub to Hub Manager

Hub managers need to be assigned to a specific hub. Use the provided script:

```bash
cd backend
node listHubManagers.js
```

This shows all hub managers and available hubs.

Then assign a hub to a manager:

```bash
node assignHubToManager.js <username> "<Hub Name>"
```

**Example**:
```bash
node assignHubToManager.js john_hub "Idukki Cardamom Hub"
```

### Step 2: Verify Assignment

The hub manager's user document will now have:
```javascript
{
  username: "john_hub",
  role: "hub",
  profileData: {
    assignedHub: "Idukki Cardamom Hub",
    assignedHubId: ObjectId("...")
  }
}
```

### Step 3: Test the Flow

1. **As Farmer**:
   - Login as a farmer
   - Go to "Bulk Product Management"
   - Add a bulk product and select "Idukki Cardamom Hub"
   - Submit

2. **As Hub Manager**:
   - Login as the hub manager (john_hub)
   - Go to "Bulk Products" menu
   - You should see the bulk product that was just added
   - Other hub managers won't see this product

## Technical Details

### Database Schema Changes

#### Product Model
Added `hubId` field to store ObjectId reference to Hub:
```javascript
{
  nearestHub: String,      // Hub name (for display)
  hubId: ObjectId,         // Hub reference (for querying)
}
```

### API Endpoints

#### POST `/farmer/products`
- Creates bulk product
- Automatically looks up hub by name
- Stores both hub name and hub ID

#### GET `/hubmanager/bulk-products`
- Returns bulk products for assigned hub
- Filters by `hubId` or `nearestHub`
- Requires 'hub' role

### Frontend Components

#### New Component: `HubBulkProducts.jsx`
Located at: `frontend/src/components/dashboards/hubmanager/HubBulkProducts.jsx`

Features:
- Product grid view
- Search by name/district/description
- Filter by grade
- Product detail modal
- Direct farmer contact

## File Changes Summary

### Modified Files ✏️
1. `backend/models/Product.js` - Added hubId field
2. `backend/routes/farmer.js` - Auto-populate hubId on product creation
3. `backend/routes/hubmanager.js` - Filter by hub in bulk products endpoint
4. `frontend/src/components/dashboards/HubDashboard.jsx` - Added bulk products menu

### New Files ✨
1. `frontend/src/components/dashboards/hubmanager/HubBulkProducts.jsx` - Hub bulk products view
2. `backend/assignHubToManager.js` - Script to assign hubs
3. `backend/listHubManagers.js` - Script to list hub managers
4. `BULK_PRODUCT_HUB_VISIBILITY.md` - Detailed documentation

## Quick Commands

```bash
# List all hub managers and their assignments
cd backend
node listHubManagers.js

# Assign a hub to a manager
node assignHubToManager.js username "Hub Name"

# Start backend server
npm start

# Start frontend (in frontend directory)
cd ../frontend
npm run dev
```

## Troubleshooting

### Issue: Hub manager sees no products

**Possible causes**:
1. Hub manager has no assigned hub
   - **Solution**: Run `assignHubToManager.js`

2. No bulk products exist for that hub
   - **Solution**: Create bulk products as a farmer

3. Farmer selected different hub
   - **Solution**: Check product's `nearestHub` field

### Issue: Hub manager sees all products

**Possible causes**:
1. Hub assignment not set in profileData
   - **Solution**: Verify `user.profileData.assignedHub` exists

2. Backend not filtering correctly
   - **Solution**: Check backend logs for query details

### Issue: Cannot find hub by name

**Possible causes**:
1. Hub name mismatch (case-sensitive)
   - **Solution**: Use exact hub name from `listHubManagers.js`

2. Hub doesn't exist in database
   - **Solution**: Run `seedHubs.js` to populate hubs

## Testing Checklist

- [ ] Farmer can select district and hub when creating bulk product
- [ ] Product saves with both nearestHub and hubId
- [ ] Hub manager sees "Bulk Products" menu item
- [ ] Hub manager sees only their hub's products
- [ ] Search functionality works
- [ ] Grade filters work
- [ ] Product detail modal shows complete info
- [ ] Contact buttons work (call/email farmer)
- [ ] Refresh button updates product list
- [ ] Other hub managers don't see the products

## Security Notes

✅ **Implemented**:
- Role-based access (requireRole('hub'))
- Authentication required (requireAuth)
- Hub-specific filtering

⚠️ **Recommended**:
- Add audit logging for product access
- Validate hub assignment on every request
- Add rate limiting for bulk product queries

## Future Enhancements

1. **Bulk Order Creation**: Hub managers can create orders from bulk products
2. **Price Negotiation**: Built-in messaging for price discussion
3. **Quality Verification**: QC workflow before accepting products
4. **Notifications**: Real-time alerts for new bulk products
5. **Analytics**: Hub-specific bulk product insights
6. **Export Reports**: Generate transaction reports

## Support

For issues or questions:
1. Check the detailed documentation in `BULK_PRODUCT_HUB_VISIBILITY.md`
2. Review backend logs for API errors
3. Check browser console for frontend errors
4. Verify hub assignment with `listHubManagers.js`

---

**Last Updated**: January 2025
**Version**: 1.0.0
