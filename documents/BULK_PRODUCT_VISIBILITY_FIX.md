# Bulk Product Visibility Fix

## Problem
Bulk products created by farmers were visible to all customers in the marketplace. These products should only be visible to the hub managers at the hubs selected by the farmer, not to regular customers.

## Solution
Modified the product visibility logic to ensure:
1. **Customers** can only see regular/domestic products (not bulk products)
2. **Hub Managers** can see bulk products assigned to their specific hub
3. **Farmers** can still create and manage bulk products as before

## Changes Made

### 1. Backend Routes - Customer (`backend/routes/customer.js`)

#### Modified: GET `/customer/products`
- **Before**: Returned all products to customers
- **After**: Filters out bulk products (type === 'Bulk')
- **Logic**: Only shows products where `type` is not 'Bulk' or doesn't exist

```javascript
const filter = {
  // Exclude bulk products - only show regular/domestic products to customers
  $or: [
    { type: { $exists: false } },
    { type: { $ne: 'Bulk' } }
  ]
};
```

### 2. Backend Routes - Hub Manager (`backend/routes/hubmanager.js`)

#### Modified: GET `/hubmanager/inventory`
- **Before**: Showed all products including bulk
- **After**: Excludes bulk products from general inventory
- **Reason**: Bulk products have their own dedicated endpoint

#### Added: GET `/hubmanager/bulk-products`
- **New endpoint** for hub managers to view bulk products
- **Filter by hub**: Use `?hubName=<hub_name>` query parameter
- **Search**: Supports search across name, description, and district
- **Pagination**: Supports page and limit parameters
- **Returns**: All bulk products (type === 'Bulk') assigned to specified hub

**Example Usage:**
```javascript
// Get all bulk products for a specific hub
GET /hubmanager/bulk-products?hubName=Idukki%20Processing%20Hub&page=1&limit=20

// Search bulk products
GET /hubmanager/bulk-products?search=cardamom&hubName=Wayanad%20Hub
```

## Product Type Field

The `type` field in the Product model is used to distinguish product categories:
- **`type: 'Bulk'`**: Wholesale/bulk products (20kg+) - visible only to hub managers
- **`type: undefined or other values`**: Regular/domestic products (1-20kg) - visible to all customers

## How It Works

### For Farmers:
1. Farmer creates a bulk product using the Bulk Product Manager
2. Selects district and specific hub
3. Product is saved with `type: 'Bulk'` and `nearestHub: <selected_hub_name>`
4. Product is NOT visible in customer marketplace

### For Hub Managers:
1. Hub manager logs in with role 'hub'
2. Can access `/hubmanager/bulk-products` endpoint
3. Filter by their hub name to see assigned bulk products
4. Can view farmer contact details and product information

### For Customers:
1. Customer browses marketplace
2. Only sees regular products (type !== 'Bulk')
3. Cannot see or purchase bulk products
4. Marketplace remains focused on smaller quantity purchases

## Testing

### Test Customer View (Should NOT show bulk products):
```bash
# Customer marketplace - should only show non-bulk products
GET /customer/products
```

### Test Hub Manager View (Should show bulk products):
```bash
# Hub manager bulk products - should show bulk products for specific hub
GET /hubmanager/bulk-products?hubName=<hub_name>
```

### Create Test Data:
```javascript
// Regular product (visible to customers)
POST /farmer/products
{
  "name": "Cardamom Premium",
  "type": "Regular",
  "price": 1200,
  "stock": 10,
  "grade": "Premium"
}

// Bulk product (NOT visible to customers)
POST /farmer/products
{
  "name": "Cardamom Bulk",
  "type": "Bulk",
  "price": 1100,
  "stock": 50,
  "grade": "Regular",
  "nearestHub": "Idukki Hub"
}
```

## Future Enhancements

1. **Hub User Association**: Link hub managers to specific hubs in User model
2. **Automatic Filtering**: Auto-detect hub manager's hub and filter automatically
3. **Hub Dashboard**: Add bulk products view in hub manager dashboard
4. **Notifications**: Notify hub managers when new bulk products are assigned
5. **Approval Workflow**: Hub managers can approve/reject bulk product listings

## Files Modified

1. `backend/routes/customer.js` - Filtered customer product endpoint
2. `backend/routes/hubmanager.js` - Added bulk products endpoint and filtered inventory

## API Endpoints Summary

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/customer/products` | GET | Public | List regular products (excludes bulk) |
| `/hubmanager/inventory` | GET | hub | List regular inventory (excludes bulk) |
| `/hubmanager/bulk-products` | GET | hub | List bulk products for specific hub |
| `/farmer/products` | POST | farmer | Create product (regular or bulk) |

## Notes

- No database migration required - uses existing `type` field
- Backward compatible - products without `type` field are treated as regular
- Farmers can continue adding both regular and bulk products
- Hub selection in bulk product form is now meaningful and functional
