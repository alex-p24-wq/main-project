import React, { useState, useEffect } from "react";
import api, { getCardamomPrices } from "../../../services/api";
import { indianStatesDistricts } from "../../../data/indianStatesDistricts";
import "../../../css/FarmerComponents.css";
import { validateFarmerProductImage } from "../../../utils/imageValidation";

export default function BulkProductManager() {
  const [formData, setFormData] = useState({
    name: 'Cardamom',
    type: 'Bulk',
    state: 'Kerala',
    district: '',
    nearestHub: '',
    grade: 'Regular',
    price: '',
    stock: '',
    description: ''
  });

  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Kerala's 14 cardamom-producing districts
  const cardamomDistricts = [
    'Idukki',
    'Wayanad',
    'Palakkad',
    'Kozhikode',
    'Kannur',
    'Kasaragod',
    'Thrissur',
    'Ernakulam',
    'Kottayam',
    'Pathanamthitta',
    'Kollam',
    'Thiruvananthapuram',
    'Alappuzha',
    'Malappuram'
  ];

  // Fetch hubs when district changes
  useEffect(() => {
    if (formData.district) {
      fetchHubs();
    } else {
      setHubs([]);
      setFormData(prev => ({ ...prev, nearestHub: '' }));
    }
  }, [formData.district]);

  const fetchHubs = async () => {
    try {
      const response = await api.get(`/hubs/by-district/${formData.state}/${formData.district}`);
      setHubs(response.data);
    } catch (error) {
      console.error('Error fetching hubs:', error);
      setHubs([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }

      // Skip validation - just set the image file directly
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Auto-fill price based on market data
      fetchAndSetMarketPrice();
    }
  };

  const fetchAndSetMarketPrice = async () => {
    try {
      const response = await getCardamomPrices();

      if (response && response.success && response.data && response.data.length > 0) {
        // Get the latest available price (avg_price)
        const marketData = response.data[0];
        const avgPriceStr = marketData.avg_price;
        const cleanPrice = avgPriceStr.replace(/[^\d.]/g, '');
        const price = parseFloat(cleanPrice);

        if (!isNaN(price) && price > 0) {
          setFormData(prev => ({
            ...prev,
            price: price.toFixed(2)
          }));
        }
      }
    } catch (error) {
      console.error("Failed to auto-fill price:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.district) {
      setError('Please select a district');
      return;
    }

    if (!formData.nearestHub) {
      setError('Please select a hub');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price greater than 0');
      return;
    }

    if (!formData.stock || parseInt(formData.stock) < 20) {
      setError('Bulk quantity must be at least 20 kg');
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('type', formData.type);
      submitData.append('state', formData.state);
      submitData.append('district', formData.district);
      submitData.append('nearestHub', formData.nearestHub);
      submitData.append('grade', formData.grade);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      if (formData.description) {
        submitData.append('description', formData.description);
      }
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await api.post('/farmer/products', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Bulk product added successfully!');

      // Reset form
      setFormData({
        name: 'Cardamom',
        type: 'Bulk',
        state: 'Kerala',
        district: '',
        nearestHub: '',
        grade: 'Regular',
        price: '',
        stock: '',
        description: ''
      });
      setImageFile(null);
      setImagePreview('');

      // Scroll to top to see success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error adding bulk product:', error);
      setError(error.response?.data?.message || 'Failed to add bulk product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Bulk Product Management</h3>
        <p className="card-subtitle">Add large quantity cardamom products (20kg+) for wholesale buyers</p>
      </div>
      <div className="card-content">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bulk-product-form">
          <div className="form-grid">
            {/* Product Name */}
            <div className="form-group">
              <label htmlFor="name">
                Product Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            {/* Product Type */}
            <div className="form-group">
              <label htmlFor="type">
                Product Type
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Bulk, Wholesale"
              />
            </div>

            {/* District Selection */}
            <div className="form-group">
              <label htmlFor="district">
                Select District <span className="required">*</span>
              </label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="">-- Choose District --</option>
                {cardamomDistricts.map(district => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              <small className="form-hint">Select from Kerala's 14 cardamom-producing districts</small>
            </div>

            {/* Hub Selection */}
            <div className="form-group">
              <label htmlFor="nearestHub">
                Select Hub <span className="required">*</span>
              </label>
              <select
                id="nearestHub"
                name="nearestHub"
                value={formData.nearestHub}
                onChange={handleChange}
                required
                className="form-input"
                disabled={!formData.district}
              >
                <option value="">-- Choose Hub --</option>
                {hubs.map(hub => (
                  <option key={hub._id} value={hub.name}>
                    {hub.name} - {hub.address}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                {formData.district
                  ? hubs.length > 0
                    ? `${hubs.length} hub(s) available in ${formData.district}`
                    : 'No hubs available in this district'
                  : 'Select a district first'}
              </small>
            </div>

            {/* Grade */}
            <div className="form-group">
              <label htmlFor="grade">
                Grade <span className="required">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
                className="form-input"
              >
                <option value="Regular">Regular</option>
                <option value="Premium">Premium</option>
                <option value="Organic">Organic</option>
              </select>
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="price">
                Price per kg (₹) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
                className="form-input"
                placeholder="Enter price per kg"
              />
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label htmlFor="stock">
                Quantity (kg) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="20"
                step="1"
                className="form-input"
                placeholder="Minimum 20 kg"
              />
              <small className="form-hint">Minimum bulk quantity: 20 kg</small>
            </div>

            {/* Image Upload */}
            <div className="form-group full-width">
              <label htmlFor="image">
                Product Image (Optional)
              </label>
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input"
              />
              <small className="form-hint">Max file size: 5MB. Supported formats: JPG, PNG, WEBP</small>
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="form-group full-width">
              <label htmlFor="description">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows="4"
                maxLength="500"
                placeholder="Add any additional details about your bulk product..."
              />
              <small className="form-hint">
                {formData.description.length}/500 characters
              </small>
            </div>
          </div>

          {/* Summary */}
          {formData.price && formData.stock && (
            <div className="bulk-summary">
              <h4>Order Summary</h4>
              <div className="summary-item">
                <span>Total Quantity:</span>
                <strong>{formData.stock} kg</strong>
              </div>
              <div className="summary-item">
                <span>Price per kg:</span>
                <strong>₹{parseFloat(formData.price).toFixed(2)}</strong>
              </div>
              <div className="summary-item total">
                <span>Total Value:</span>
                <strong>₹{(parseFloat(formData.price) * parseInt(formData.stock)).toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Adding Product...
                </>
              ) : (
                <>
                  <span>📦</span>
                  Add Bulk Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}