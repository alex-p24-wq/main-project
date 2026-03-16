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

    // Check if this is not a cardamom image
    if (imageGradeObj && imageGradeObj.isCardamom === false) {
      return 0; // Return 0 for non-cardamom images
    }

    const maxPrice = parseInt(marketData.max_price || 0);
    const avgPrice = parseInt(marketData.avg_price || 0);

    // Use the quality score to determine the price more precisely
    const qualityScore = imageGradeObj.qualityScore;

    // Calculate price based on quality score (0-1 scale) with accurate max price consideration
    // Higher quality scores get proportionally closer to max price
    const priceRange = maxPrice - avgPrice;

    // Enhanced formula to consider both max and average prices more accurately
    // For high quality cardamom, it should approach the maximum auction price
    let calculatedPrice = 0;

    if (qualityScore >= 0.85) {
      // Premium quality: Very close to max price
      const position = 0.9 + 0.1 * ((qualityScore - 0.85) / 0.15);
      calculatedPrice = Math.round(avgPrice + priceRange * position);
    } else if (qualityScore >= 0.70) {
      // Very good quality: Between avg and max
      const position = 0.6 + 0.3 * ((qualityScore - 0.70) / 0.15);
      calculatedPrice = Math.round(avgPrice + priceRange * position);
    } else if (qualityScore >= 0.50) {
      // Good quality: Closer to avg
      const position = 0.2 + 0.4 * ((qualityScore - 0.50) / 0.20);
      calculatedPrice = Math.round(avgPrice + priceRange * position);
    } else {
      // Lower quality: Below avg
      calculatedPrice = Math.round(avgPrice * (0.5 + 0.5 * qualityScore));
    }

    // Adjust based on market conditions to ensure realistic pricing
    if (qualityScore >= 0.85) {
      // For excellent quality, ensure it's competitive with max auction price
      calculatedPrice = Math.max(calculatedPrice, Math.min(maxPrice, maxPrice * 0.95));
    } else if (qualityScore >= 0.70 && qualityScore < 0.85) {
      // For very good quality, ensure it's above average
      calculatedPrice = Math.max(calculatedPrice, avgPrice * 1.15);
    } else if (qualityScore >= 0.50 && qualityScore < 0.70) {
      // For good quality, keep near average
      calculatedPrice = Math.max(calculatedPrice, avgPrice * 0.9);
    }

    return calculatedPrice;
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

  // Fallback: on-device quick heuristic using advanced image analysis
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

    // Cardamom detection: check if this is likely a cardamom image
    let cardamomPixelCount = 0;
    let totalPixels = 0;

    // Advanced analysis: check for multiple quality indicators
    let greenPixels = 0;
    let brownPixels = 0;
    let yellowishPixels = 0;
    let darkGreenPixels = 0;
    let brightnessSum = 0;
    let varianceSum = 0; // To measure color consistency
    let contrastSum = 0; // To measure contrast

    // Sample pixels (not all for performance)
    const sampleRate = Math.max(1, Math.floor(data.length / 4 / 4000)); // Sample even more pixels for better accuracy

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

      // Cardamom detection: check if pixel color is in typical cardamom range
      // Cardamom typically has green, brown, or yellow-green tones
      if ((g > r && g > b && g > 50) || // Green tones
        (r > g && r > b && r > 60 && r < 180) || // Brownish tones
        (r > 70 && g > 70 && b > 40 && Math.abs(r - g) < 60)) { // Yellowish/greenish tones
        cardamomPixelCount++;
      }

      // Check for premium green tones (dark green, vibrant green) - typical of high-quality cardamom
      if (g > r && g > b && g > 60 && Math.abs(r - b) < 100) { // Wider tolerance
        // Enhanced green detection for cardamom
        if (g > 90 && r > 50 && b > 50 && g > r + 8 && g > b + 8) { // Lowered thresholds
          greenPixels++; // Vibrant green
        } else if (g > 60 && g < 150 && r < 130 && b < 130 && Math.abs(r - b) < 60) { // Wider range
          darkGreenPixels++; // Dark green
        }
      }

      // Check for brown tones (typical of mature cardamom pods)
      if (r > 70 && g > 40 && b > 30 && r > g && r > b && Math.abs(g - b) < 120 && r > 70) { // Wider tolerance
        // Enhanced brown detection for cardamom - adjust thresholds for better accuracy
        brownPixels++; // Brown tones
      }

      // Check for yellowish tones (lower quality)
      if (r > 80 && g > 80 && b > 40 && r > b && g > b && Math.abs(r - g) < 140) { // Wider tolerance
        yellowishPixels++; // Yellowish tones
      }

      // Additional check for redness which indicates poor quality
      if (r > g && r > b && r > 90 && Math.abs(g - b) < 80) { // Lowered thresholds
        yellowishPixels++; // More redness indicates lower quality
      }

      // Additional cardamom-specific checks
      // Check for good color saturation (high chroma indicates quality)
      const hue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b);
      const chroma = Math.sqrt(Math.pow(r - g, 2) + (r - b) * (g - b));

      // For cardamom, we want moderate to high chroma
      if (chroma > 20) { // Lowered threshold
        // Good chroma indicates quality, add to green/brown if appropriate
        if (g > r && g > b && Math.abs(g - Math.max(r, b)) > 12) { // Lowered threshold
          greenPixels++; // Good green chroma
        } else if (r > g && r > b && Math.abs(r - Math.max(g, b)) > 12) { // Lowered threshold
          brownPixels++; // Good brown chroma
        }
      }

      // Check for overall brightness balance (too bright or too dark indicates lower quality)
      if (brightness > 230 || brightness < 20) { // Stricter limits
        yellowishPixels++; // Too bright or too dark
      }

      // Check for sharp edges/contrast which can indicate pod damage
      // Look for local variations in pixel values
      if (i + 4 * sampleRate < data.length) {
        const nextR = data[i + 4 * sampleRate];
        const nextG = data[i + 4 * sampleRate + 1];
        const nextB = data[i + 4 * sampleRate + 2];

        const diff = Math.sqrt(Math.pow(r - nextR, 2) + Math.pow(g - nextG, 2) + Math.pow(b - nextB, 2));
        // High local contrast can indicate damaged pods
        if (diff > 120) { // Raised threshold to be more forgiving
          yellowishPixels++; // High local contrast indicates potential damage
        }
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

    // Calculate contrast (difference between max and min brightness)
    let maxBrightness = 0;
    let minBrightness = 255;
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      maxBrightness = Math.max(maxBrightness, brightness);
      minBrightness = Math.min(minBrightness, brightness);
    }
    const contrast = maxBrightness - minBrightness;

    // Determine quality based on multiple factors
    let quality = "Regular";

    // Quality scoring algorithm with more nuanced approach
    let qualityScore = 0;

    // Color quality (50% weight) - more specific thresholds for cardamom with emphasis on green
    let colorScore = 0;
    // For cardamom, green tones are primary indicators of quality, brown is secondary
    // Increase weights for green and reduce for brown
    if (greenPercentage > 0.3 || darkGreenPercentage > 0.2) { // Lowered thresholds to be more responsive
      // Good green indicators - much higher weight
      colorScore += Math.min(greenPercentage * 2.0, 50); // Significantly higher weight for vibrant green
      colorScore += Math.min(darkGreenPercentage * 1.5, 40); // Higher weight for dark green
    }
    if (brownPercentage > 0.2) { // Lowered threshold
      // Brown indicators - reduced weight compared to green
      colorScore += Math.min(brownPercentage * 0.5, 15); // Much lower weight for brown
    }
    // Reduced penalty for yellowish tones (to be less harsh)
    colorScore -= Math.min(yellowishPercentage * 0.6, 30); // Reduced penalty for yellowish/poor quality

    // Normalize color score to 0-100 range
    colorScore = Math.max(15, Math.min(100, colorScore)); // Higher minimum score of 15

    // Brightness quality (18% weight) - optimal range for cardamom
    let brightnessScore = 0;
    if (avgBrightness >= 50 && avgBrightness <= 200) { // Wider range to be more forgiving
      // Optimal brightness range
      brightnessScore = 100 - Math.abs(avgBrightness - 125) * 0.4; // Less penalty for deviation
    } else {
      // Lower score for too dark or too bright
      brightnessScore = Math.max(10, 25 - Math.abs(avgBrightness - 125) * 0.05); // Minimum score of 10
    }

    // Saturation quality (18% weight) - cardamom should have good color intensity
    let saturationScore = Math.min(avgSaturation * 120, 100); // Higher weight

    // Consistency quality (14% weight) - uniform color indicates good quality
    let consistencyScore = 0;
    // Normalize variance to a 0-100 scale where lower variance is better
    const normalizedVariance = Math.min(100, varianceSum / 300); // Higher threshold to be more forgiving
    consistencyScore = Math.max(15, 100 - normalizedVariance); // Minimum score of 15

    // Contrast quality (10% weight) - moderate contrast indicates good quality
    let contrastScore = Math.min(contrast * 0.4, 100); // Slightly higher weight

    // Calculate overall quality score (0-1 scale)
    qualityScore = (
      (colorScore / 100) * 0.50 +
      (brightnessScore / 100) * 0.16 +
      (saturationScore / 100) * 0.16 +
      (consistencyScore / 100) * 0.12 +
      (contrastScore / 100) * 0.06
    );

    // Apply a small boost to the overall quality score
    qualityScore = Math.min(1.0, qualityScore * 1.20); // Boost by 20% for better results

    // Determine quality based on score with adjusted thresholds
    if (qualityScore >= 0.70) { // Lowered threshold for Premium
      quality = "Premium";
    } else if (qualityScore >= 0.50) { // Lowered threshold for Special
      quality = "Special";
    } else {
      quality = "Regular";
    }

    // Calculate specific feature percentages for display
    const featureAnalysis = {
      greenPercentage: parseFloat(greenPercentage.toFixed(2)),
      brownPercentage: parseFloat(brownPercentage.toFixed(2)),
      darkGreenPercentage: parseFloat(darkGreenPercentage.toFixed(2)),
      yellowishPercentage: parseFloat(yellowishPercentage.toFixed(2)),
      avgBrightness: parseFloat(avgBrightness.toFixed(2)),
      avgSaturation: parseFloat(avgSaturation.toFixed(2)),
      consistency: parseFloat(((100 - normalizedVariance) / 100).toFixed(2)),
      contrastLevel: parseFloat((contrast / 255).toFixed(2))
    };

    // Calculate cardamom likelihood
    const cardamomPercentage = (cardamomPixelCount / totalPixels) * 100;

    // If less than 30% of pixels appear to be cardamom-like, return non-cardamom result
    if (cardamomPercentage < 30) {
      return { quality: "Not Cardamom", qualityScore: 0, featureAnalysis: {}, isCardamom: false };
    }

    featureAnalysis.cardamomPercentage = parseFloat(cardamomPercentage.toFixed(2));

    return { quality, qualityScore, featureAnalysis, isCardamom: true };
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
          if (heuristicResult.isCardamom === false) {
            // If it's not cardamom, show appropriate message
            setImageGrade({
              grade: heuristicResult.quality,
              qualityScore: heuristicResult.qualityScore,
              featureAnalysis: heuristicResult.featureAnalysis,
              isCardamom: false
            });
          } else {
            setImageGrade({
              grade: heuristicResult.quality,
              qualityScore: heuristicResult.qualityScore,
              featureAnalysis: heuristicResult.featureAnalysis // Include feature analysis
            });
          }
        } else {
          setImageGrade({ grade: result, qualityScore: 0.3, featureAnalysis: {} }); // Default score for regular quality
        }
      } else {
        // If result is an object with grade and qualityScore, use it; otherwise create object with grade and default score
        setImageGrade(typeof result === 'object' ? result : { grade: result, qualityScore: 0.7, featureAnalysis: {} }); // Default high score for backend results
      }
    } catch (err) {
      // Final fallback: heuristic if backend failed unexpectedly
      try {
        const heuristicResult = await analyzeImageHeuristic(imagePreview || imageFile);
        if (typeof heuristicResult === 'object') {
          if (heuristicResult.isCardamom === false) {
            // If it's not cardamom, show appropriate message
            setImageGrade({
              grade: heuristicResult.quality,
              qualityScore: heuristicResult.qualityScore,
              featureAnalysis: heuristicResult.featureAnalysis,
              isCardamom: false
            });
          } else {
            setImageGrade({
              grade: heuristicResult.quality,
              qualityScore: heuristicResult.qualityScore,
              featureAnalysis: heuristicResult.featureAnalysis // Include feature analysis
            });
          }
        } else {
          setImageGrade({ grade: heuristicResult, qualityScore: 0.3, featureAnalysis: {} });
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
              {/* Additional market insights */}
              <div className="insight-card">
                <h5>Live Price</h5>
                <p className="highlight">₹{marketData.max_price}</p>
              </div>
              <div className="insight-card">
                <h5>Available Slots</h5>
                <p className="highlight">{Math.floor(parseInt(marketData.lots || 0) / 2)} available</p>
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
              <div style={{ marginTop: 8, padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#2e7d32' }}>
                  <strong>Price Estimate:</strong> ₹{
                    manualGrade === 'Premium' ? Math.round(parseInt(marketData.max_price || 0) * 0.95) :
                      manualGrade === 'Special' ? Math.round((parseInt(marketData.avg_price || 0) + parseInt(marketData.max_price || 0)) / 2 * 1.05) :
                        Math.round(parseInt(marketData.avg_price || 0) * 0.9)
                  }
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                  <strong>Based on:</strong> Manual grade with current market prices
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px dashed #c8e6c9', paddingTop: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Max Auction Price</div>
                    <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>₹{marketData.max_price}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Avg Auction Price</div>
                    <div style={{ fontWeight: 'bold', color: '#1976d2' }}>₹{marketData.avg_price}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>Manual Grade</div>
                    <div style={{ fontWeight: 'bold', color: '#f57c00' }}>{manualGrade}</div>
                  </div>
                </div>
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
              <div style={{ marginTop: 8, padding: '12px', backgroundColor: typeof imageGrade === 'object' && imageGrade.isCardamom === false ? '#ffebee' : '#e8f5e9', borderRadius: '8px', border: '1px solid', borderColor: typeof imageGrade === 'object' && imageGrade.isCardamom === false ? '#ffcdd2' : '#c8e6c9' }}>
                {typeof imageGrade === 'object' && imageGrade.isCardamom === false ? (
                  <>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#c62828' }}>
                      <strong>Not Cardamom:</strong> Price prediction not available
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                      <strong>Detected:</strong> {imageGrade.featureAnalysis?.cardamomPercentage ? imageGrade.featureAnalysis.cardamomPercentage.toFixed(1) + '%' : '0%'} cardamom-like content
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#777' }}>
                      Please upload an image of cardamom for grading and price prediction.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#2e7d32' }}>
                      <strong>Price Estimate:</strong> ₹{calculateImagePrice(typeof imageGrade === 'object' ? imageGrade : { grade: imageGrade, qualityScore: 0.3 })}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#555' }}>
                      <strong>Based on:</strong> Quality analysis with current market prices
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', borderTop: '1px dashed #c8e6c9', paddingTop: '8px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Max Auction Price</div>
                        <div style={{ fontWeight: 'bold', color: '#d32f2f' }}>₹{marketData.max_price}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Avg Auction Price</div>
                        <div style={{ fontWeight: 'bold', color: '#1976d2' }}>₹{marketData.avg_price}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#666' }}>Quality Score</div>
                        <div style={{ fontWeight: 'bold', color: '#f57c00' }}>{(typeof imageGrade === 'object' ? imageGrade.qualityScore : 0.3).toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Detailed Feature Analysis */}
                    {typeof imageGrade === 'object' && imageGrade.featureAnalysis && imageGrade.isCardamom !== false && (
                      <div style={{ marginTop: '12px', borderTop: '1px dashed #c8e6c9', paddingTop: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2e7d32' }}>Feature Analysis:</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px' }}>
                          <div><strong>Green:</strong> {imageGrade.featureAnalysis.greenPercentage}%</div>
                          <div><strong>Brown:</strong> {imageGrade.featureAnalysis.brownPercentage}%</div>
                          <div><strong>Dark Green:</strong> {imageGrade.featureAnalysis.darkGreenPercentage}%</div>
                          <div><strong>Yellowish:</strong> {imageGrade.featureAnalysis.yellowishPercentage}%</div>
                          <div><strong>Brightness:</strong> {imageGrade.featureAnalysis.avgBrightness}</div>
                          <div><strong>Saturation:</strong> {(imageGrade.featureAnalysis.avgSaturation * 100).toFixed(1)}%</div>
                          <div><strong>Consistency:</strong> {(imageGrade.featureAnalysis.consistency * 100).toFixed(1)}%</div>
                          <div><strong>Contrast:</strong> {(imageGrade.featureAnalysis.contrastLevel * 100).toFixed(1)}%</div>
                          <div><strong>Cardamom:</strong> {imageGrade.featureAnalysis.cardamomPercentage}%</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
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