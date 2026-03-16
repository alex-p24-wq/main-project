import React, { useState, useRef } from 'react';
import axios from 'axios';
import styles from './DiseasePredictor.module.css';

const DiseasePredictor = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch prediction history
  const fetchHistory = async (page = 1) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease-prediction/history?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPredictionHistory(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setCurrentPage(response.data.pagination.currentPage);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load prediction history');
    }
  };

  const handleImageChange = (file) => {
    setError(null);
    setPredictionResult(null);
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleImageChange(file);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageChange(files[0]);
    }
  };

  const handlePredict = async () => {
    if (!imageFile) {
      setError('Please select an image of cardamom plant');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/disease-prediction/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPredictionResult(response.data.data);
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.message || 'Failed to predict disease. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      fetchHistory();
    }
  };

  const handleClear = () => {
    setImageFile(null);
    setImagePreview(null);
    setPredictionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Low': return 'hsl(145, 75%, 55%)';
      case 'Moderate': return 'hsl(35, 95%, 60%)';
      case 'High': return 'hsl(0, 75%, 60%)';
      case 'Very High': return 'hsl(0, 85%, 50%)';
      default: return 'hsl(0, 0%, 45%)';
    }
  };

  const getSeverityBgColor = (severity) => {
    switch (severity) {
      case 'Low': return 'hsla(145, 75%, 55%, 0.15)';
      case 'Moderate': return 'hsla(35, 95%, 60%, 0.15)';
      case 'High': return 'hsla(0, 75%, 60%, 0.15)';
      case 'Very High': return 'hsla(0, 85%, 50%, 0.15)';
      default: return 'hsla(0, 0%, 45%, 0.15)';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'hsl(145, 75%, 45%)';
    if (confidence >= 60) return 'hsl(35, 95%, 55%)';
    return 'hsl(0, 75%, 55%)';
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.iconWrapper}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className={styles.title}>AI Disease Detection</h2>
              <p className={styles.subtitle}>Advanced cardamom plant health analysis powered by machine learning</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className={styles.contentGrid}>
          {/* Left Column - Upload Section */}
          <div className={styles.uploadSection}>
            {/* Drop Zone */}
            <div
              className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
                id="image-upload"
              />
              
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img 
                    src={imagePreview} 
                    alt="Plant Preview" 
                    className={styles.previewImage}
                  />
                  <div style={{ 
                    marginTop: '1rem', 
                    color: 'hsl(145, 60%, 35%)', 
                    fontWeight: 600,
                    fontSize: '0.9375rem'
                  }}>
                    Click to change image or drag a new one
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.uploadIcon}>
                    <svg style={{ width: 40, height: 40, color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={styles.uploadText}>
                    {isDragging ? 'Drop your image here' : 'Click to upload or drag & drop'}
                  </p>
                  <p className={styles.uploadHint}>JPG, PNG, GIF or WebP (Max 5MB)</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
              <button
                onClick={handlePredict}
                disabled={loading || !imageFile}
                className={styles.primaryButton}
              >
                {loading ? (
                  <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <span>Analyzing Plant...</span>
                  </div>
                ) : (
                  <>
                    <span style={{ fontSize: '1.125rem' }}>🔬</span>
                    <span style={{ marginLeft: '0.5rem' }}>Detect Disease</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleClear}
                className={styles.secondaryButton}
              >
                Clear
              </button>
            </div>
            
            {/* Tips Card */}
            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>
                <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tips for Best Results
              </h3>
              <ul className={styles.tipsList}>
                <li className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  <span>Use clear, well-lit photos for accurate analysis</span>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  <span>Capture affected areas closely</span>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  <span>Avoid blurry or dark images</span>
                </li>
                <li className={styles.tipItem}>
                  <span className={styles.tipBullet}>•</span>
                  <span>Include multiple symptoms if visible</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Right Column - Results Section */}
          <div className={styles.resultsSection}>
            {/* Error Display */}
            {error && (
              <div className={styles.errorAlert}>
                <svg style={{ width: 20, height: 20, color: 'hsl(0, 70%, 50%)', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={styles.errorText}>{error}</p>
              </div>
            )}
            
            {/* Prediction Results */}
            {predictionResult && (
              <div className={styles.resultsCard}>
                <h3 className={styles.resultsTitle}>
                  <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analysis Results
                </h3>
                
                <div className={styles.predictionCard}>
                  {/* Disease and Confidence */}
                  <div className={styles.predictionHeader}>
                    <div>
                      <h4 className={styles.diseaseLabel}>Detected Disease</h4>
                      <p className={styles.diseaseName} style={{ color: getConfidenceColor(predictionResult.confidence) }}>
                        {predictionResult.predictedDisease}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h4 className={styles.confidenceLabel}>Confidence</h4>
                      <p className={styles.confidenceValue} style={{ color: getConfidenceColor(predictionResult.confidence) }}>
                        {predictionResult.confidence.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Disease Details */}
                  {predictionResult.diseaseDetails && (
                    <div className={styles.detailsGrid}>
                      <div className={styles.detailItem}>
                        <h4>Severity Level</h4>
                        <span 
                          className={styles.severityBadge}
                          style={{ 
                            backgroundColor: getSeverityBgColor(predictionResult.diseaseDetails.severity),
                            color: getSeverityColor(predictionResult.diseaseDetails.severity)
                          }}
                        >
                          {predictionResult.diseaseDetails.severity}
                        </span>
                      </div>
                      
                      <div className={styles.detailItem}>
                        <h4>Recommended Treatment</h4>
                        <p className={styles.treatmentText}>{predictionResult.diseaseDetails.treatment}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Alternative Predictions */}
                  {predictionResult.allPredictions && predictionResult.allPredictions.length > 1 && (
                    <div className={styles.alternativesSection}>
                      <h4 className={styles.alternativesTitle}>Alternative Possibilities</h4>
                      <div className={styles.alternativesList}>
                        {predictionResult.allPredictions.slice(1, 3).map((pred, index) => (
                          <div key={index} className={styles.alternativeItem}>
                            <span className={styles.alternativeName}>{pred.disease}</span>
                            <span 
                              className={styles.alternativeConfidence}
                              style={{ color: getConfidenceColor(pred.confidence) }}
                            >
                              {pred.confidence.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Placeholder State */}
            {!predictionResult && !error && (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>
                  <svg style={{ width: 32, height: 32, color: 'hsl(145, 60%, 45%)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={styles.placeholderText}>Upload a cardamom plant image to begin analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* History Toggle */}
      <div className={styles.historyToggle}>
        <button
          onClick={handleViewHistory}
          className={styles.historyButton}
        >
          {showHistory ? (
            <>
              <span>Hide History</span>
              <span style={{ marginLeft: '0.5rem' }}>▲</span>
            </>
          ) : (
            <>
              <span>📜</span>
              <span style={{ marginLeft: '0.5rem' }}>View Analysis History</span>
            </>
          )}
        </button>
      </div>
      
      {/* History Section */}
      {showHistory && (
        <div className={styles.historyCard}>
          <h3 className={styles.historyTitle}>
            <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Previous Analyses
          </h3>
          
          {predictionHistory.length === 0 ? (
            <p className={styles.historyEmpty}>No prediction history available yet</p>
          ) : (
            <div className={styles.historyList}>
              {predictionHistory.map((prediction) => (
                <div key={prediction._id} className={styles.historyItem}>
                  <div className={styles.historyItemContent}>
                    <div className={styles.historyItemInfo}>
                      <h4 className={styles.historyItemTitle}>{prediction.predictedDisease}</h4>
                      <div className={styles.historyItemMeta}>
                        <span className={styles.historyConfidence}>
                          Confidence: {prediction.confidence.toFixed(1)}%
                        </span>
                        <span className={styles.historyDate}>
                          {new Date(prediction.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span 
                        className={styles.severityBadge}
                        style={{ 
                          backgroundColor: getSeverityBgColor(prediction.severity),
                          color: getSeverityColor(prediction.severity)
                        }}
                      >
                        {prediction.severity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiseasePredictor;