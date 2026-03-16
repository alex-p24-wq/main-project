import React, { useState, useEffect } from "react";
import "../../../css/FarmerDashboard.css";
import { getCardamomPrices } from "../../../services/api";
import { analyzeImageHeuristic, calculateImagePrice } from "../../../utils/imageGrading";

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

  // Market data state

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
                      <strong>Price Estimate:</strong> ₹{calculateImagePrice(typeof imageGrade === 'object' ? imageGrade : { grade: imageGrade, qualityScore: 0.3 }, marketData)}
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