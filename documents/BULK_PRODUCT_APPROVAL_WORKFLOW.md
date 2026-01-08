# Bulk Product Approval Workflow - Phase 1 Implementation

## Overview
Implemented a comprehensive approval workflow for bulk products where hub managers can accept or reject farmer submissions, with automatic email notifications and advance payment requirements for products under ₹50,000.

## ✅ What Was Implemented (Phase 1)

### 1. **Product Status Management**
- Three status states: `pending`, `accepted`, `rejected`
- All new bulk products default to `pending` status
- Hub managers can review and change status
- Status tracked with timestamps and reviewer information

### 2. **Accept/Reject Workflow**
- **Accept Button**: Approves product for listing
- **Reject Button**: Requires reason, hides product from marketplace
- **Email Notifications**: Farmers notified automatically
- **Action Tracking**: Records who reviewed and when

### 3. **Advance Payment Logic**
- Products under ₹50,000 require advance payment
- Automatic calculation: 10% of total value
- Flagged at acceptance time
- Ready for Phase 2 payment implementation

### 4. **Email Notifications**
- **Acceptance Email**: Congratulatory message with product details
- **Rejection Email**: Includes reason and next steps
- Professional HTML templates
- Plain text fallback

## Database Changes

### Product Model (`backend/models/Product.js`)

#### New Fields Added:

```javascript
{
  // Approval workflow
  bulkProductStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending' (for bulk products only)
  },
  hubReviewedAt: Date,
  hubReviewedBy: ObjectId (ref: User),
  rejectionReason: String (max 500 chars),
  
  // Advance payment (ready for Phase 2)
  advancePayment: {
    required: Boolean,
    amount: Number,
    status: String (enum: 'pending', 'paid', 'failed'),
    paidAt: Date,
    paidBy: ObjectId (ref: User),
    transactionId: String,
    paymentMethod: String
  }
}
```

## Backend Implementation

### API Endpoints

#### 1. Accept Bulk Product
```http
POST /api/hubmanager/bulk-products/:productId/accept
Authorization: Bearer <token>
Role: hub
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk product accepted successfully",
  "product": { ... },
  "advancePaymentRequired": true,
  "advancePaymentAmount": 5000
}
```

**Actions:**
- Updates status to `accepted`
- Records reviewer and timestamp
- Calculates advance payment if total < ₹50,000
- Sends acceptance email to farmer

#### 2. Reject Bulk Product
```http
POST /api/hubmanager/bulk-products/:productId/reject
Authorization: Bearer <token>
Role: hub

Body:
{
  "reason": "Quality does not meet our standards"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk product rejected successfully",
  "product": { ... }
}
```

**Actions:**
- Updates status to `rejected`
- Stores rejection reason
- Records reviewer and timestamp
- Sends rejection email to farmer

### Email Service (`backend/utils/emailService.js`)

#### New Functions:

**sendBulkProductAcceptedEmail(farmerEmail, farmerName, productData)**
- Green-themed success email
- Shows product details
- Indicates product is now live
- Mentions advance payment booking option

**sendBulkProductRejectedEmail(farmerEmail, farmerName, productData)**
- Red-themed rejection email
- Includes rejection reason
- Provides actionable next steps
- Maintains professional tone

## Frontend Implementation

### HubBulkProducts Component

#### New Features:

**1. Status Badges**
- 🟡 Pending Review (Yellow)
- ✅ Accepted (Green)
- ❌ Rejected (Red)
- Displayed prominently on product cards

**2. Action Buttons** (for pending products only)
- ✅ Accept Button: One-click approval
- ❌ Reject Button: Opens rejection modal
- Disabled during processing
- Click events don't trigger product detail modal

**3. Rejection Modal**
- Textarea for rejection reason (required)
- Character counter (500 max)
- Cancel and Confirm buttons
- Form validation

**4. User Feedback**
- Toast notifications for success/error
- Loading states during API calls
- Immediate UI updates
- Auto-refresh after actions

## User Flow

### Hub Manager Workflow

```
Hub Manager Opens Bulk Products
    ↓
Sees Products with Status Badges
    ├── Pending Products: Show Accept/Reject buttons
    ├── Accepted Products: Show as approved
    └── Rejected Products: Show as rejected
    ↓
Click Accept
    ├── Confirm dialog
    ├── API call to accept
    ├── Email sent to farmer
    ├── Status updated to 'accepted'
    └── Toast notification shown
    ↓
OR Click Reject
    ├── Rejection modal opens
    ├── Enter reason (required)
    ├── Confirm rejection
    ├── API call with reason
    ├── Email sent to farmer with reason
    ├── Status updated to 'rejected'
    └── Toast notification shown
```

### Farmer Experience

```
Farmer Adds Bulk Product
    ↓
Product Status: Pending
    ↓
Hub Manager Reviews
    ↓
IF ACCEPTED:
    ├── Farmer receives congratulatory email
    ├── Product goes live
    ├── Available for booking
    └── Ready for advance payment (if applicable)
    ↓
IF REJECTED:
    ├── Farmer receives email with reason
    ├── Product hidden from marketplace
    ├── Can review feedback
    └── Can submit improved product
```

## Email Templates

### Acceptance Email
- **Subject**: ✅ Your Bulk Product Has Been Accepted!
- **Content**:
  - Congratulations message
  - Product details table
  - Hub information
  - "Product is now live" notice
  - Next steps for booking
  
### Rejection Email
- **Subject**: ❌ Bulk Product Review Update
- **Content**:
  - Professional rejection message
  - Product details
  - Rejection reason (highlighted)
  - Actionable next steps
  - Encouragement to try again

## Advance Payment Logic

### Calculation
```javascript
const totalValue = product.price * product.stock;

if (totalValue < 50000) {
  advancePayment.required = true;
  advancePayment.amount = totalValue * 0.1; // 10% advance
  advancePayment.status = 'pending';
}
```

### Products Requiring Advance Payment
- Total value < ₹50,000
- 10% of total value
- Example: ₹40,000 total → ₹4,000 advance

### Products NOT Requiring Advance Payment
- Total value ≥ ₹50,000
- Full payment at time of booking

## UI Components

### Status Badge Styles

**Pending:**
```css
background: #fef3c7;
color: #92400e;
icon: ⏳
```

**Accepted:**
```css
background: #d1fae5;
color: #065f46;
icon: ✅
```

**Rejected:**
```css
background: #fee2e2;
color: #991b1b;
icon: ❌
```

### Action Buttons

**Accept Button:**
- Green background (#059669)
- White text
- Bold font
- Full width in flex container

**Reject Button:**
- Red background (#dc2626)
- White text
- Bold font
- Full width in flex container

### Rejection Modal

**Components:**
- Header with warning icon
- Descriptive text
- Textarea (500 char limit)
- Character counter
- Cancel and Confirm buttons
- Click-outside to close

## Security & Validation

### Backend Validation
- ✅ Requires authentication
- ✅ Requires 'hub' role
- ✅ Validates product exists
- ✅ Validates product is bulk type
- ✅ Prevents duplicate actions
- ✅ Requires rejection reason
- ✅ Sanitizes input (trim, length limits)

### Frontend Validation
- ✅ Disables buttons during processing
- ✅ Requires rejection reason before submit
- ✅ Character limit on textarea
- ✅ Confirmation dialog for acceptance
- ✅ Error handling with toast notifications

## Testing Checklist

- [ ] Farmer can create bulk product (status: pending)
- [ ] Hub manager sees pending badge
- [ ] Accept button works and sends email
- [ ] Reject button opens modal
- [ ] Rejection requires reason
- [ ] Rejection sends email with reason
- [ ] Status badges update immediately
- [ ] Advance payment calculated correctly for < ₹50k
- [ ] Advance payment not required for ≥ ₹50k
- [ ] Email notifications arrive
- [ ] Toast notifications appear
- [ ] Only hub role can accept/reject
- [ ] Cannot re-accept accepted products
- [ ] Cannot re-reject rejected products

## Phase 2 Preview: Advance Payment

### Planned Features (NOT YET IMPLEMENTED)

1. **Payment Gateway Integration**
   - Razorpay integration for advance payments
   - Payment confirmation workflow
   - Transaction tracking

2. **Booking System**
   - Reserve product with advance payment
   - Lock stock for paid bookings
   - Booking expiration (if not completed)

3. **Payment Status Tracking**
   - Pending payment reminders
   - Payment receipt emails
   - Balance payment tracking

4. **Hub Manager Dashboard**
   - View booked products
   - Track advance payments
   - Manage reservations

## Configuration

### Environment Variables
```env
# Email service (already configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@e-cardamom-connect.com
```

### Advance Payment Settings (Hardcoded)
```javascript
// Threshold for advance payment
const ADVANCE_PAYMENT_THRESHOLD = 50000;

// Percentage of advance required
const ADVANCE_PAYMENT_PERCENTAGE = 0.10; // 10%
```

## Files Modified

### Backend
1. ✏️ `backend/models/Product.js` - Added status and payment fields
2. ✏️ `backend/utils/emailService.js` - Added email templates
3. ✏️ `backend/routes/hubmanager.js` - Added accept/reject endpoints

### Frontend
4. ✏️ `frontend/src/components/dashboards/hubmanager/HubBulkProducts.jsx` - Added UI components

### Documentation
5. ✨ `BULK_PRODUCT_APPROVAL_WORKFLOW.md` (this file)

## Future Enhancements (Beyond Phase 2)

1. **Batch Operations**: Accept/reject multiple products at once
2. **Review History**: View all reviewer actions and timestamps
3. **Appeal System**: Farmers can appeal rejections
4. **Quality Ratings**: Hub managers can rate accepted products
5. **Auto-Approval**: Trust-based auto-approval for verified farmers
6. **Review Reminders**: Notify hub managers of pending reviews
7. **Analytics**: Track acceptance/rejection rates
8. **Feedback Loop**: Improve farmer submissions based on patterns

## Support & Troubleshooting

### Common Issues

**Email not sent:**
- Check SMTP configuration in .env
- Verify farmer email exists in database
- Check email service logs

**Accept/Reject buttons not showing:**
- Verify product has `type: 'Bulk'`
- Check user has 'hub' role
- Ensure product status is 'pending'

**Advance payment not calculated:**
- Verify total value < ₹50,000
- Check product price and stock values
- Review backend logs for calculation

---

**Implementation Date**: January 2025  
**Status**: ✅ Phase 1 Complete - Ready for Phase 2  
**Version**: 1.0.0  
**Next Phase**: Advance Payment Gateway Integration
