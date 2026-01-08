import React, { useState, useEffect } from "react";
import "../../../css/FarmerDashboard.css";
import { getCardamomPrices } from "../../../services/api";

// Cardamom grading: supports manual inputs and image-based grading.
// Image grading will try an optional backend endpoint (VITE_GRADE_API),
// and if unavailable, fall back to a simple on-device heuristic.
export default function CardamomGrading() {
  // Manual form grading state
  const [form, setForm] = useState({ sizeMm: "", color: "Green", moisturePct: "" });
  const [manualGrade, setManualGrade] = useState(null);

  // Image-based grading state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageGrade, setImageGrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Market data state
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Fetch market data on component mount
  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setMarketLoading(true);
      const response = await getCardamomPrices();
      if (response.data && response.data.length > 0) {
        setMarketData(response.data[0]); // Get the most recent data
      }
    } catch (err) {
      console.error("Error fetching market data:", err);
    } finally {
      setMarketLoading(false);
    }
  };

  // Calculate price based on quality score for more nuanced pricing
  const calculateImagePrice = (imageGradeObj) => {
    if (!marketData) return 0;
    
    const maxPrice = parseInt(marketData.max_price || 0);
    const avgPrice = parseInt(marketData.avg_price || 0);
    
    // Use the quality score to determine the price more precisely
    const qualityScore = imageGradeObj.qualityScore;
    
    // Calculate price based on quality score (0-1 scale)
    if (qualityScore >= 0.70) {
      // Premium quality: closer to max price
      return Math.round(avgPrice + (maxPrice - avgPrice) * (qualityScore - 0.70) / 0.30);
    } else if (qualityScore >= 0.45) {
      // Special quality: between avg and min
      return Math.round(avgPrice - (avgPrice - maxPrice * 0.75) * (qualityScore - 0.45) / 0.25);
    } else {
      // Regular quality: closer to minimum price
      return Math.round(maxPrice * 0.5 + (maxPrice * 0.75 - maxPrice * 0.5) * qualityScore / 0.45);
    }
  };

  // ----- Manual grading -----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const computeManualGrade = (e) => {
    e.preventDefault();
    const size = Number(form.sizeMm);
    const moisture = Number(form.moisturePct);

    // Simple heuristic: prioritize larger size, lower moisture, greener color
    let g = "Regular";
    if (size >= 7 && moisture <= 12 && form.color === "Green") g = "Premium";
    else if (size >= 6 && moisture <= 14) g = "Special";
    setManualGrade(g);
  };

  // ----- Image-based grading -----
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    setImageGrade(null);
    setError(null);
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Try backend first if provided
  const analyzeWithBackendIfAvailable = async (file) => {
    const endpoint = import.meta?.env?.VITE_GRADE_API; // e.g., http://localhost:5000/api/farmer/grade-image
    if (!endpoint) return null;

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(endpoint, { method: "POST", body: formData });
    if (!res.ok) throw new Error(`Backend error: ${res.status}`);
    const data = await res.json();
    // Expecting { grade: 'Premium' | 'Special' | 'Regular', qualityScore?: number }
    if (data?.grade) {
      return data?.qualityScore ? { grade: data.grade, qualityScore: data.qualityScore } : data.grade;
    }
    return null;
  };

  // Fallback: on-device quick heuristic using average color
  const analyzeImageHeuristic = async (fileOrUrl) => {
    const img = new Image();
    const src = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });

    const maxSide = 256; // downscale for speed
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.max(1, Math.floor(img.width * scale));
    const h = Math.max(1, Math.floor(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Advanced analysis: check for multiple quality indicators
    let greenPixels = 0;
    let brownPixels = 0;
    let yellowishPixels = 0;
    let darkGreenPixels = 0;
    let totalPixels = 0;
    let brightnessSum = 0;
    let varianceSum = 0; // To measure color consistency

    // Sample pixels (not all for performance)
    const sampleRate = Math.max(1, Math.floor(data.length / 4 / 2000)); // Sample ~500 pixels
    
    // Store color values for variance calculation
    const colorValues = [];
    
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      brightnessSum += brightness;
      
      // Store color values for variance calculation
      colorValues.push([r, g, b]);
      
      totalPixels++;
      
      // Check for premium green tones (dark green, vibrant green)
      if (g > r && g > b && g > 80 && Math.abs(r - b) < 60) {
        if (g > 130 && r > 80 && b > 80 && g > r + 20 && g > b + 20) {
          greenPixels++; // Vibrant green
        } else if (g > 80 && g < 130 && r < 100 && b < 100 && Math.abs(r - b) < 30) {
          darkGreenPixels++; // Dark green
        }
      }
      
      // Check for brown tones (typical of mature cardamom pods)
      if (r > 90 && g > 60 && b > 40 && r > g && r > b && Math.abs(g - b) < 80 && r > 100) {
        brownPixels++; // Brown tones
      }
      
      // Check for yellowish tones (lower quality)
      if (r > 100 && g > 100 && b > 60 && r > b && g > b && Math.abs(r - g) < 80) {
        yellowishPixels++; // Yellowish tones
      }
      
      // Additional check for redness which indicates poor quality
      if (r > g && r > b && r > 120 && Math.abs(g - b) < 50) {
        yellowishPixels++; // More redness indicates lower quality
      }
    }
    
    // Calculate variance to measure color consistency
    if (colorValues.length > 1) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (const [r, g, b] of colorValues) {
        rSum += r;
        gSum += g;
        bSum += b;
      }
      const rMean = rSum / colorValues.length;
      const gMean = gSum / colorValues.length;
      const bMean = bSum / colorValues.length;
      
      let rVar = 0, gVar = 0, bVar = 0;
      for (const [r, g, b] of colorValues) {
        rVar += Math.pow(r - rMean, 2);
        gVar += Math.pow(g - gMean, 2);
        bVar += Math.pow(b - bMean, 2);
      }
      
      const avgVariance = (rVar + gVar + bVar) / colorValues.length;
      varianceSum = avgVariance;
    } else {
      // If we have only one color sample, set variance to a high value to indicate inconsistency
      varianceSum = 255 * 255; // Maximum possible variance
    }
    
    // Calculate percentages
    const greenPercentage = (greenPixels / totalPixels) * 100;
    const brownPercentage = (brownPixels / totalPixels) * 100;
    const darkGreenPercentage = (darkGreenPixels / totalPixels) * 100;
    const yellowishPercentage = (yellowishPixels / totalPixels) * 100;
    const avgBrightness = brightnessSum / totalPixels;
    
    // Calculate saturation (color intensity)
    let saturationSum = 0;
    let saturationCount = 0;
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      if (max !== 0) {
        saturationSum += delta / max;
        saturationCount++;
      }
    }
    const avgSaturation = saturationCount > 0 ? saturationSum / saturationCount : 0;
    
    // Determine quality based on multiple factors
    let quality = "Regular";
    
    // Quality scoring algorithm with more nuanced approach
    let qualityScore = 0;
    
    // Color quality (40% weight) - more specific thresholds
    let colorScore = 0;
    if (greenPercentage > 5 || darkGreenPercentage > 3) {
      // Good green indicators
      colorScore += Math.min(greenPercentage * 0.4, 35); // Increased weight for green
      colorScore += Math.min(darkGreenPercentage * 0.3, 25); // Increased weight for dark green
    }
    if (brownPercentage > 3) {
      // Good brown indicators
      colorScore += Math.min(brownPercentage * 0.2, 20); // Increased weight for brown
    }
    // Penalty for yellowish tones
    colorScore -= Math.min(yellowishPercentage * 0.6, 30); // Increased penalty
    
    // Normalize color score to 0-100 range
    colorScore = Math.max(0, Math.min(100, colorScore));
    
    // Brightness quality (20% weight) - optimal range for cardamom
    let brightnessScore = 0;
    if (avgBrightness >= 80 && avgBrightness <= 160) {
      // Optimal brightness range
      brightnessScore = 100 - Math.abs(avgBrightness - 120) * 1.2; // Reduced factor for more sensitivity
    } else {
      // Lower score for too dark or too bright
      brightnessScore = Math.max(0, 40 - Math.abs(avgBrightness - 120) * 0.2); // Reduced base and factor
    }
    
    // Saturation quality (20% weight) - cardamom should have good color intensity
    let saturationScore = Math.min(avgSaturation * 100, 100);
    
    // Consistency quality (20% weight) - uniform color indicates good quality
    let consistencyScore = 0;
    // Normalize variance to a 0-100 scale where lower variance is better
    // Use a logarithmic scale to make small differences more impactful
    const normalizedVariance = Math.min(100, varianceSum / 250); // Adjust scale factor as needed
    consistencyScore = Math.max(0, 100 - normalizedVariance);
    
    // Calculate overall quality score (0-1 scale)
    qualityScore = (
      (colorScore / 100) * 0.4 + 
      (brightnessScore / 100) * 0.2 + 
      (saturationScore / 100) * 0.2 + 
      (consistencyScore / 100) * 0.2
    );
    
    // Determine quality based on score with more granular thresholds
    if (qualityScore >= 0.70) {
      quality = "Premium";
    } else if (qualityScore >= 0.45) {
      quality = "Special";
    } else {
      quality = "Regular";
    }

    return { quality, qualityScore };
  };

  const handleAnalyzeImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    setImageGrade(null);

    try {
      // Try backend
      let result = await analyzeWithBackendIfAvailable(imageFile);
      if (!result) {
        // Fallback to heuristic
        const heuristicResult = await analyzeImageHeuristic(imagePreview || imageFile);
        // If heuristic returns an object with quality and qualityScore, use it; otherwise just the grade
        result = typeof heuristicResult === 'object' ? heuristicResult.quality : heuristicResult;
        // Store the quality score separately for pricing calculations
        if (typeof heuristicResult === 'object') {
          setImageGrade({ grade: heuristicResult.quality, qualityScore: heuristicResult.qualityScore });
        } else {
          setImageGrade({ grade: result, qualityScore: 0.3 }); // Default score for regular quality
        }
      } else {
        // If result is an object with grade and qualityScore, use it; otherwise create object with grade and default score
        setImageGrade(typeof result === 'object' ? result : { grade: result, qualityScore: 0.7 }); // Default high score for backend results
      }
    } catch (err) {
      // Final fallback: heuristic if backend failed unexpectedly
      try {
        const heuristicResult = await analyzeImageHeuristic(imagePreview || imageFile);
        if (typeof heuristicResult === 'object') {
          setImageGrade({ grade: heuristicResult.quality, qualityScore: heuristicResult.qualityScore });
        } else {
          setImageGrade({ grade: heuristicResult, qualityScore: 0.3 });
        }
      } catch (e2) {
        setError("Failed to analyze image. Please try another photo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Cardamom Grading</h3>
        <a href="#/farmer/prices" className="view-all-btn" style={{ textDecoration: 'none' }} onClick={() => window.location.hash = '#/farmer/prices'}>
          Market Prices
        </a>
      </div>
      <div className="card-content">
        {/* Market insights section */}
        <div className="market-insights">
          <h4>Current Market Insights</h4>
          {marketLoading ? (
            <p>Loading market data...</p>
          ) : marketData ? (
            <div className="insights-content">
              <div className="insight-card">
                <h5>Today's Average Price</h5>
                <p className="highlight">₹{marketData.avg_price}</p>
              </div>
              <div className="insight-card">
                <h5>Today's Maximum Price</h5>
                <p className="highlight">₹{marketData.max_price}</p>
              </div>
              <div className="insight-card">
                <h5>Market Activity</h5>
                <p className="highlight">{marketData.lots} lots traded</p>
              </div>
            </div>
          ) : (
            <p>Market data not available</p>
          )}
        </div>

        
        {manualGrade && (
          <div className="result" style={{ marginTop: 12 }}>
            <strong>Estimated Grade (Manual):</strong> {manualGrade}
            {marketData && (
              <div style={{ marginTop: 8, padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Price Estimate:</strong> Based on current market, {manualGrade} grade cardamom typically sells for ₹{manualGrade === 'Premium' ? marketData.max_price : manualGrade === 'Special' ? marketData.avg_price : Math.round((parseInt(marketData.avg_price || 0) + parseInt(marketData.max_price || 0)) / 2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <hr style={{ margin: "20px 0" }} />

        {/* Image-based grading */}
        <div className="form grid-3">
          <div className="form-field" style={{ gridColumn: "span 2" }}>
            <label>Upload Cardamom Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <div style={{ marginTop: 8 }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: 240, borderRadius: 8, border: "1px solid #ddd" }} />
              </div>
            )}
          </div>
          <div className="form-actions" style={{ alignSelf: "end" }}>
            <button className="view-all-btn" type="button" onClick={handleAnalyzeImage} disabled={!imageFile || loading}>
              {loading ? "Analyzing..." : "Grade from Image"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ color: "#b00020", marginTop: 12 }}>{error}</div>
        )}

        {imageGrade && (
          <div className="result" style={{ marginTop: 12 }}>
            <strong>Estimated Grade (Image):</strong> {typeof imageGrade === 'object' ? imageGrade.grade : imageGrade}
            {marketData && (
              <div style={{ marginTop: 8, padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>Price Estimate:</strong> Based on current market and quality analysis, {typeof imageGrade === 'object' ? imageGrade.grade : imageGrade} grade cardamom typically sells for ₹{calculateImagePrice(typeof imageGrade === 'object' ? imageGrade : { grade: imageGrade, qualityScore: 0.3 })}
                </p>
              </div>
            )}
          </div>
        )}

        {!import.meta?.env?.VITE_GRADE_API && (
          <p style={{ marginTop: 12, color: "#666", fontSize: 12 }}>
            Tip: Configure VITE_GRADE_API to use a server-side model. Falling back to on-device heuristic.
          </p>
        )}
        
        <div style={{ marginTop: 20, padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '4px solid #2e7d32' }}>
          <p style={{ margin: 0, color: '#333' }}>
            <strong>💡 Pro Tip:</strong> Check current market prices to make informed decisions about grading and pricing your cardamom.{' '}
            <a href="#/farmer/prices" style={{ color: '#2e7d32', fontWeight: 'bold', textDecoration: 'none' }} onClick={() => window.location.hash = '#/farmer/prices'}>
              View Market Prices
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}