# 📊 E-Cardamom Connect - Database Schema Documentation

**Project:** E-Cardamom Connect  
**Database:** MongoDB (NoSQL)  
**Date:** 2025-10-28  
**Version:** 1.0.0

---

## 🗂️ Table of Contents

1. [Users Collection](#1-users-collection)
2. [Products Collection](#2-products-collection)
3. [Orders Collection](#3-orders-collection)
4. [Hubs Collection](#4-hubs-collection)
5. [Order Requests Collection](#5-order-requests-collection)
6. [Notifications Collection](#6-notifications-collection)
7. [Feedback Collection](#7-feedback-collection)
8. [Hub Activities Collection](#8-hub-activities-collection)
9. [Email OTP Collection](#9-email-otp-collection)

---

## 1. Users Collection

**Collection Name:** `users`  
**Description:** Stores all user accounts (Customers, Farmers, Hub Managers, AgriCare, Admin)

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique user identifier (MongoDB default) |
| 2 | username | String | UNIQUE, NOT NULL, MIN 3 chars | Unique username for login |
| 3 | email | String | UNIQUE, NOT NULL | User's email address (lowercase, trimmed) |
| 4 | phone | String | Optional | User's contact number |
| 5 | password | String | NOT NULL, MIN 8 chars | Hashed password (bcrypt) |
| 6 | role | String | NOT NULL, ENUM | User role: customer, farmer, agricare, hub, admin |
| 7 | profileData | Mixed Object | Optional | Dynamic fields based on user role |
| 8 | wishlist | Array[ObjectId] | FOREIGN KEY → Product | Customer's wishlist items |
| 9 | createdAt | Date | DEFAULT NOW | Account creation timestamp |

**Indexes:**
- Unique: `username`, `email`
- Index: `role`

---

## 2. Products Collection

**Collection Name:** `products`  
**Description:** Stores cardamom products listed by farmers

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique product identifier |
| 2 | user | ObjectId | FOREIGN KEY → User, NOT NULL | Farmer who listed the product |
| 3 | name | String | NOT NULL, MAX 100 chars | Product name |
| 4 | type | String | Optional, MAX 100 chars | Product type (e.g., "Bulk", "Retail") |
| 5 | price | Number | NOT NULL, MIN 0.01 | Price per kg (must be positive) |
| 6 | stock | Number | NOT NULL, MIN 1 | Available quantity in kg |
| 7 | grade | String | NOT NULL, ENUM | Quality grade: Premium, Organic, Regular |
| 8 | image | String | Optional | Product image URL |
| 9 | state | String | Optional, MAX 100 chars | State where product is located |
| 10 | district | String | Optional, MAX 100 chars | District location |
| 11 | nearestHub | String | Optional, MAX 200 chars | Nearest hub name |
| 12 | hubId | ObjectId | FOREIGN KEY → Hub | Reference to hub for bulk products |
| 13 | description | String | Optional, MAX 500 chars | Product description |
| 14 | bulkProductStatus | String | ENUM: pending, accepted, rejected | Approval status for bulk products |
| 15 | hubReviewedAt | Date | Optional | When hub reviewed the product |
| 16 | hubReviewedBy | ObjectId | FOREIGN KEY → User | Hub manager who reviewed |
| 17 | rejectionReason | String | Optional, MAX 500 chars | Reason if rejected |
| 18 | advancePayment.required | Boolean | DEFAULT false | If advance payment needed |
| 19 | advancePayment.amount | Number | MIN 0 | Advance payment amount |
| 20 | advancePayment.status | String | ENUM: pending, paid, failed | Payment status |
| 21 | advancePayment.paidAt | Date | Optional | Payment timestamp |
| 22 | advancePayment.paidBy | ObjectId | FOREIGN KEY → User | Customer who paid |
| 23 | advancePayment.transactionId | String | Optional | Payment transaction ID |
| 24 | advancePayment.paymentMethod | String | Optional | Payment method used |
| 25 | createdAt | Date | DEFAULT NOW | Product listing date |

**Indexes:**
- Index: `user`, `type`, `grade`, `bulkProductStatus`

---

## 3. Orders Collection

**Collection Name:** `orders`  
**Description:** Stores customer orders

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique order identifier |
| 2 | customer | ObjectId | FOREIGN KEY → User, NOT NULL | Customer who placed order |
| 3 | items | Array[Object] | NOT NULL, MIN 1 item | Order items (embedded documents) |
| 3.1 | items.product | ObjectId | FOREIGN KEY → Product, NOT NULL | Product reference |
| 3.2 | items.name | String | NOT NULL | Product name (snapshot) |
| 3.3 | items.image | String | Optional | Product image (snapshot) |
| 3.4 | items.grade | String | Optional | Product grade (snapshot) |
| 3.5 | items.price | Number | NOT NULL | Price per unit at order time |
| 3.6 | items.quantity | Number | NOT NULL, MIN 1 | Quantity ordered |
| 4 | amount | Number | NOT NULL, MIN 0 | Total order amount |
| 5 | currency | String | DEFAULT "INR" | Currency code |
| 6 | status | String | ENUM, DEFAULT "Pending" | Order status: Pending, Processing, Shipped, Delivered, Cancelled |
| 7 | shippingAddress.fullName | String | Optional | Recipient name |
| 8 | shippingAddress.phone | String | Optional | Contact number |
| 9 | shippingAddress.line1 | String | Optional | Address line 1 |
| 10 | shippingAddress.line2 | String | Optional | Address line 2 |
| 11 | shippingAddress.city | String | Optional | City |
| 12 | shippingAddress.state | String | Optional | State |
| 13 | shippingAddress.postalCode | String | Optional | Postal/ZIP code |
| 14 | shippingAddress.country | String | DEFAULT "IN" | Country code |
| 15 | paymentMethod | String | ENUM, DEFAULT "COD" | Payment method: COD, UPI, CARD, ONLINE |
| 16 | paymentStatus | String | ENUM, DEFAULT "Pending" | Payment status: Pending, Paid, Failed |
| 17 | notes | String | Optional | Customer notes/instructions |
| 18 | razorpayOrderId | String | Optional | Razorpay order ID |
| 19 | razorpayPaymentId | String | Optional | Razorpay payment ID |
| 20 | razorpaySignature | String | Optional | Razorpay signature for verification |
| 21 | tracking | Array[Object] | Optional | Order tracking history |
| 21.1 | tracking.status | String | Optional | Status update |
| 21.2 | tracking.message | String | Optional | Status message |
| 21.3 | tracking.at | Date | DEFAULT NOW | Timestamp of update |
| 22 | createdAt | Date | AUTO | Order creation timestamp |
| 23 | updatedAt | Date | AUTO | Last update timestamp |

**Indexes:**
- Index: `customer`, `status`, `createdAt`

---

## 4. Hubs Collection

**Collection Name:** `hubs`  
**Description:** Stores cardamom collection/processing hubs across India

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique hub identifier |
| 2 | name | String | NOT NULL, MIN 3, MAX 100 | Hub name |
| 3 | state | String | NOT NULL, MAX 100 | State location |
| 4 | district | String | NOT NULL, MAX 100 | District location |
| 5 | address | String | NOT NULL, MAX 500 | Complete address |
| 6 | contactPerson | String | Optional, MAX 100 | Contact person name |
| 7 | phone | String | Optional, MAX 15 | Contact number |
| 8 | email | String | Optional, MAX 100 | Contact email (lowercase) |
| 9 | capacity | Number | MIN 0, DEFAULT 0 | Storage capacity in kg |
| 10 | services | Array[String] | ENUM array | Services offered: Storage, Processing, Packaging, Quality Testing, Transportation, Export Services |
| 11 | operatingHours | String | Optional, MAX 100 | Operating hours |
| 12 | coordinates.latitude | Number | MIN -90, MAX 90 | Latitude for mapping |
| 13 | coordinates.longitude | Number | MIN -180, MAX 180 | Longitude for mapping |
| 14 | hubType | String | ENUM, DEFAULT "Regional Hub" | Hub type: Primary Production Hub, Regional Hub, Export Hub, Processing Hub, Distribution Hub, Collection Hub, Metropolitan Hub, Technology Hub, Port Hub, Commercial Hub, Border Hub |
| 15 | isActive | Boolean | DEFAULT true | Hub operational status |
| 16 | registeredBy | ObjectId | FOREIGN KEY → User, NOT NULL | Admin who registered hub |
| 17 | createdAt | Date | DEFAULT NOW | Hub registration date |
| 18 | updatedAt | Date | DEFAULT NOW | Last update timestamp |

**Indexes:**
- Compound: `state + district`
- Index: `isActive`

---

## 5. Order Requests Collection

**Collection Name:** `orderrequests`  
**Description:** Stores bulk order requests from customers to hubs

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique request identifier |
| 2 | customer | ObjectId | FOREIGN KEY → User, NOT NULL | Customer making request |
| 3 | customerName | String | NOT NULL | Customer name (snapshot) |
| 4 | customerEmail | String | NOT NULL | Customer email (snapshot) |
| 5 | customerPhone | String | NOT NULL | Customer phone (snapshot) |
| 6 | productType | String | NOT NULL, DEFAULT "Cardamom" | Type of product requested |
| 7 | grade | String | NOT NULL, ENUM | Desired grade: A Grade, B Grade, C Grade, Mixed, Any |
| 8 | quantity | Number | NOT NULL, MIN 0 | Quantity needed in kg |
| 9 | budgetMin | Number | NOT NULL, MIN 0 | Minimum budget per kg |
| 10 | budgetMax | Number | NOT NULL, MIN 0 | Maximum budget per kg |
| 11 | urgency | String | NOT NULL, ENUM, DEFAULT "normal" | Urgency level: normal, urgent, immediate |
| 12 | preferredHub | String | NOT NULL | Preferred hub name |
| 13 | description | String | NOT NULL | Detailed requirements |
| 14 | status | String | ENUM, DEFAULT "pending" | Request status: pending, accepted, rejected, completed |
| 15 | hubResponse.message | String | Optional | Hub's response message |
| 16 | hubResponse.respondedBy | ObjectId | FOREIGN KEY → User | Hub manager who responded |
| 17 | hubResponse.respondedAt | Date | Optional | Response timestamp |
| 18 | createdAt | Date | AUTO | Request creation timestamp |
| 19 | updatedAt | Date | AUTO | Last update timestamp |

**Indexes:**
- Compound: `customer + status`
- Compound: `preferredHub + status`
- Index: `createdAt` (descending)

---

## 6. Notifications Collection

**Collection Name:** `notifications`  
**Description:** Stores in-app notifications for users

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique notification identifier |
| 2 | recipient | ObjectId | FOREIGN KEY → User, NOT NULL | User receiving notification |
| 3 | type | String | NOT NULL, ENUM | Notification type: order_placed, payment_received, product_sold, order_cancelled, stock_low, general |
| 4 | title | String | NOT NULL | Notification title |
| 5 | message | String | NOT NULL | Notification message |
| 6 | data.orderId | ObjectId | FOREIGN KEY → Order | Related order (if applicable) |
| 7 | data.productId | ObjectId | FOREIGN KEY → Product | Related product (if applicable) |
| 8 | data.customerId | ObjectId | FOREIGN KEY → User | Related customer (if applicable) |
| 9 | data.amount | Number | Optional | Transaction amount (if applicable) |
| 10 | data.quantity | Number | Optional | Quantity (if applicable) |
| 11 | data.productName | String | Optional | Product name (snapshot) |
| 12 | data.customerName | String | Optional | Customer name (snapshot) |
| 13 | read | Boolean | DEFAULT false | Read status |
| 14 | priority | String | ENUM, DEFAULT "medium" | Priority: low, medium, high |
| 15 | icon | String | DEFAULT "🔔" | Notification icon |
| 16 | createdAt | Date | AUTO | Notification creation timestamp |
| 17 | updatedAt | Date | AUTO | Last update timestamp |

**Indexes:**
- Compound: `recipient + createdAt` (descending)
- Compound: `recipient + read`

---

## 7. Feedback Collection

**Collection Name:** `feedbacks`  
**Description:** Stores user feedback and ratings

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique feedback identifier |
| 2 | user | ObjectId | FOREIGN KEY → User, NOT NULL | User submitting feedback |
| 3 | role | String | NOT NULL, ENUM | User's role: customer, farmer, agricare, hub, admin |
| 4 | subject | String | NOT NULL, MAX 200 | Feedback subject/title |
| 5 | message | String | NOT NULL, MAX 5000 | Detailed feedback message |
| 6 | rating | Number | MIN 1, MAX 5, DEFAULT 5 | Star rating (1-5) |
| 7 | category | String | DEFAULT "General" | Feedback category |
| 8 | createdAt | Date | DEFAULT NOW | Feedback submission date |

**Indexes:**
- Text: `subject`, `message`, `category` (for search)
- Compound: `role + rating + createdAt` (descending)

---

## 8. Hub Activities Collection

**Collection Name:** `hubactivities`  
**Description:** Tracks product sales and hub-related activities

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique activity identifier |
| 2 | type | String | NOT NULL, ENUM: "sold" | Activity type |
| 3 | state | String | NOT NULL | State where activity occurred |
| 4 | district | String | NOT NULL | District where activity occurred |
| 5 | nearestHub | String | Optional | Nearest hub name |
| 6 | product | ObjectId | FOREIGN KEY → Product, NOT NULL | Related product |
| 7 | order | ObjectId | FOREIGN KEY → Order, NOT NULL | Related order |
| 8 | farmer | ObjectId | FOREIGN KEY → User, NOT NULL | Farmer who sold product |
| 9 | customer | ObjectId | FOREIGN KEY → User | Customer who bought product |
| 10 | quantity | Number | Optional | Quantity sold in kg |
| 11 | amount | Number | Optional | Sale amount |
| 12 | hubArrivalConfirmed | Boolean | DEFAULT false | Product arrival confirmed at hub |
| 13 | hubArrivalOTP | String | Optional | OTP for arrival confirmation |
| 14 | hubArrivalOTPExpiry | Date | Optional | OTP expiry time |
| 15 | hubArrivalConfirmedAt | Date | Optional | Confirmation timestamp |
| 16 | hubArrivalConfirmedBy | ObjectId | FOREIGN KEY → User | Hub manager who confirmed |
| 17 | customerNotified | Boolean | DEFAULT false | Customer notification status |
| 18 | createdAt | Date | DEFAULT NOW | Activity timestamp |

**Indexes:**
- Compound: `type + state + district + createdAt` (descending)
- Index: `product`

---

## 9. Email OTP Collection

**Collection Name:** `emailotps`  
**Description:** Stores email verification OTPs (temporary data with TTL)

| No. | Field Name | Data Type | Key Constraints | Description of the Field |
|-----|------------|-----------|-----------------|--------------------------|
| 1 | _id | ObjectId | PRIMARY KEY, AUTO | Unique OTP record identifier |
| 2 | email | String | NOT NULL, INDEX, lowercase | Email address for verification |
| 3 | otpHash | String | NOT NULL | Hashed OTP code |
| 4 | verified | Boolean | DEFAULT false, INDEX | Verification status |
| 5 | expiresAt | Date | NOT NULL, TTL INDEX | OTP expiration time (auto-delete) |
| 6 | attempts | Number | DEFAULT 0 | Number of verification attempts |
| 7 | createdAt | Date | DEFAULT NOW | OTP generation timestamp |

**Indexes:**
- Index: `email`
- Index: `verified`
- TTL Index: `expiresAt` (auto-expires documents)

---

## 📈 Database Statistics

| Collection | Primary Purpose | Estimated Volume |
|------------|----------------|------------------|
| users | User accounts | Thousands |
| products | Product listings | Thousands |
| orders | Customer orders | Thousands-Millions |
| hubs | Hub locations | Hundreds |
| orderrequests | Bulk order requests | Hundreds-Thousands |
| notifications | In-app alerts | Millions |
| feedbacks | User feedback | Thousands |
| hubactivities | Sales tracking | Thousands-Millions |
| emailotps | Temporary OTP storage | Hundreds (auto-delete) |

---

## 🔗 Key Relationships

```
User (1) ──────> (Many) Products
User (1) ──────> (Many) Orders
User (1) ──────> (Many) OrderRequests
User (1) ──────> (Many) Notifications
User (1) ──────> (Many) Feedbacks
User (1) ──────> (Many) HubActivities
User (1) ──────> (Many) Hubs (registered by)

Product (1) ───> (1) User (farmer)
Product (1) ───> (1) Hub (optional)
Product (Many) -> (1) Order (items)

Order (1) ─────> (1) User (customer)
Order (1) ─────> (Many) HubActivities

Hub (1) ───────> (Many) Products
Hub (1) ───────> (Many) OrderRequests

OrderRequest (1) > (1) User (customer)
OrderRequest (1) > (1) User (hub manager - responder)
```

---

## 🔒 Security Notes

1. **Password Storage:** All passwords are hashed using bcrypt with salt rounds = 10
2. **OTP Storage:** OTPs are hashed before storage
3. **TTL Indexes:** Email OTPs auto-delete after expiration
4. **Unique Constraints:** Email and username must be unique
5. **Validation:** All inputs validated before database operations
6. **Indexes:** Optimized for common query patterns

---

## 📝 Notes

- MongoDB uses `_id` as the default primary key (ObjectId type)
- All timestamps are stored in UTC
- Soft deletes are not implemented (hard deletes used)
- Embedded documents used for order items and shipping address
- Foreign keys are references (not enforced by MongoDB, handled by application)

---

**Database Version:** MongoDB 8.x  
**ORM/ODM:** Mongoose 8.8.4  
**Last Updated:** 2025-10-28
