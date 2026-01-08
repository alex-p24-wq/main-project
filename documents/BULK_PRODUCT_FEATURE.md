# Bulk Product Management Feature

## Overview
The Bulk Product Management feature allows farmers to add large quantity cardamom products (20kg+) for wholesale buyers, with the ability to select from 14 Kerala districts and choose specific hubs.

## Features Implemented

### 1. District Selection
- **14 Kerala Cardamom-Producing Districts:**
  - Idukki
  - Wayanad
  - Palakkad
  - Kozhikode
  - Kannur
  - Kasaragod
  - Thrissur
  - Ernakulam
  - Kottayam
  - Pathanamthitta
  - Kollam
  - Thiruvananthapuram
  - Alappuzha
  - Malappuram

### 2. Hub Selection
- Dynamic hub loading based on selected district
- Fetches available hubs from the database via API
- Displays hub name and address for easy identification
- Shows count of available hubs in the selected district

### 3. Product Details
Farmers can input the following details:

#### Required Fields:
- **Product Name**: Default "Cardamom" (customizable)
- **District**: Select from 14 Kerala districts
- **Hub**: Select from available hubs in the chosen district
- **Grade**: Choose from Premium, Organic, or Regular
- **Price per kg**: Must be greater than ₹0
- **Quantity**: Minimum 20 kg for bulk orders

#### Optional Fields:
- **Product Type**: e.g., "Bulk", "Wholesale"
- **Product Image**: Upload image (max 5MB, JPG/PNG/WEBP)
- **Description**: Additional details (max 500 characters)

### 4. Form Validation
- District must be selected
- Hub must be selected
- Price must be a positive number
- Quantity must be at least 20 kg (bulk minimum)
- Image file size limited to 5MB
- Image must be a valid image format

### 5. Real-time Features
- **Image Preview**: Shows uploaded image before submission
- **Order Summary**: Calculates and displays:
  - Total Quantity
  - Price per kg
  - Total Value (auto-calculated)
- **Character Counter**: For description field (500 char limit)
- **Hub Availability**: Shows number of available hubs

### 6. User Feedback
- **Success Messages**: Confirmation when product is added
- **Error Messages**: Clear error notifications
- **Loading States**: Visual feedback during submission
- **Form Reset**: Automatically clears after successful submission

## Backend Changes

### Updated Files:
1. **`backend/routes/farmer.js`**
   - Modified product creation to support bulk products
   - Added validation for bulk vs regular products:
     - Bulk products (type='Bulk' or stock >= 20kg): minimum 20 kg
     - Regular products: 1-20 kg range
   - Added support for `type` field in products

### API Endpoints Used:
1. **GET `/hub/by-district/:state/:district`**
   - Fetches hubs for a specific district
   - Returns hub details including name and address

2. **POST `/farmer/products`**
   - Creates new product (supports bulk and regular)
   - Handles multipart/form-data for image uploads
   - Validates all required fields

## Frontend Changes

### Updated Files:
1. **`frontend/src/components/dashboards/farmer/BulkProductManager.jsx`**
   - Complete implementation of bulk product form
   - State management for form data
   - Hub fetching logic
   - Image upload and preview
   - Form validation and submission

2. **`frontend/src/css/FarmerComponents.css`**
   - Added comprehensive styles for bulk product form
   - Responsive design for mobile devices
   - Alert message styles
   - Form input styles
   - Summary section styles
   - Image preview styles

## User Flow

1. **Navigate to Bulk Product Manager**
   - Farmer clicks "Bulk Product" from the dashboard menu

2. **Select District**
   - Choose from 14 Kerala cardamom-producing districts
   - Hubs automatically load for selected district

3. **Select Hub**
   - Choose from available hubs in the district
   - See hub address for confirmation

4. **Enter Product Details**
   - Fill in product name, type, grade
   - Set price per kg
   - Enter quantity (minimum 20 kg)
   - Optionally upload image
   - Add description if needed

5. **Review Summary**
   - Check auto-calculated total value
   - Verify all details

6. **Submit**
   - Click "Add Bulk Product"
   - See loading state during submission
   - Get success confirmation
   - Form automatically resets

## Validation Rules

### Price:
- Must be a positive number > 0
- Supports decimal values (e.g., ₹1250.50)

### Quantity (Stock):
- Must be integer
- Minimum 20 kg for bulk products
- No maximum limit for bulk orders

### Image:
- Maximum size: 5MB
- Accepted formats: JPG, PNG, WEBP, GIF
- Preview shown before upload

### Description:
- Maximum 500 characters
- Character counter displayed
- Optional field

## Database Schema

### Product Model Fields Used:
- `user`: Reference to farmer
- `name`: Product name
- `type`: Product type (e.g., "Bulk")
- `price`: Price per kg
- `stock`: Quantity in kg
- `grade`: Premium/Organic/Regular
- `image`: Image URL
- `state`: "Kerala" (fixed)
- `district`: Selected district
- `nearestHub`: Selected hub name
- `description`: Optional description
- `createdAt`: Timestamp

## Responsive Design

### Desktop (1024px+):
- Two-column form layout
- All fields clearly visible
- Large buttons and inputs

### Tablet (768px - 1023px):
- Single-column form layout
- Optimized spacing

### Mobile (< 768px):
- Full-width inputs
- Larger touch targets
- Stacked layout
- Full-width buttons

## Error Handling

### Frontend Errors:
- Missing required fields
- Invalid price or quantity
- File size too large
- Invalid file format
- No hubs available in district

### Backend Errors:
- Server connection issues
- Authentication failures
- Validation errors
- Database errors

All errors are displayed with clear, user-friendly messages.

## Future Enhancements

Potential improvements:
1. Bulk edit multiple products
2. CSV import for multiple products
3. Pricing suggestions based on market rates
4. Hub capacity check before selection
5. Automatic grade detection from images
6. Scheduled product additions
7. Inventory alerts for low stock
8. Price history tracking
9. Hub-to-hub transfer options
10. Wholesale buyer matching system

## Testing Checklist

- [ ] District dropdown loads all 14 districts
- [ ] Hub dropdown populates when district is selected
- [ ] Hub dropdown is disabled without district selection
- [ ] Form validation works for all fields
- [ ] Image upload and preview work correctly
- [ ] Order summary calculates correctly
- [ ] Success message appears after submission
- [ ] Form resets after successful submission
- [ ] Error messages display properly
- [ ] Responsive design works on all devices
- [ ] API integration works correctly
- [ ] Image file size validation works
- [ ] Minimum 20 kg validation works
- [ ] Price validation accepts decimals
- [ ] Character counter updates correctly

## Notes

- The feature is specifically designed for Kerala's cardamom industry
- Hub data must be seeded in the database for proper functionality
- Farmers can add both regular (1-20kg) and bulk (20kg+) products
- The system automatically detects bulk products based on quantity or type
