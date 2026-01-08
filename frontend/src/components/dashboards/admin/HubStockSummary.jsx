import React, { useState, useEffect } from "react";
import { adminGetHubStockSummary } from "../../../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function HubStockSummary() {
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHubStockSummary();
  }, []);

  const fetchHubStockSummary = async () => {
    try {
      setLoading(true);
      const response = await adminGetHubStockSummary();
      setHubData(response);
      setError("");
    } catch (err) {
      console.error("Error fetching hub stock summary:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load hub stock summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Hub Stock Summary</h3>
        </div>
        <div className="card-content">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading hub stock data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Hub Stock Summary</h3>
        </div>
        <div className="card-content">
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            {error}
          </div>
          <button 
            onClick={fetchHubStockSummary}
            className="btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!hubData) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Hub Stock Summary</h3>
        </div>
        <div className="card-content">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No data available</h3>
            <p>No hub stock data found.</p>
          </div>
        </div>
      </div>
    );
  }

  const { hubs, overall } = hubData;

  const getGradeColor = (grade) => {
    const colors = {
      Premium: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
      Organic: { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
      Regular: { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" }
    };
    return colors[grade] || colors.Regular;
  };

  const generatePDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      
      // Create a new PDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add title
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('Hub Stock Summary Report', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      const currentDate = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${currentDate}`, 15, 35);
      
      // Add a horizontal line
      pdf.setDrawColor(0, 0, 0);
      pdf.line(15, 40, 195, 40);
      
      // Add overall statistics
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Overall Statistics', 15, 55);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      
      let yPos = 65;
      if (hubData && hubData.overall) {
        const overall = hubData.overall;
        pdf.text(`Total Value: ₹${overall.totalPrice.toLocaleString()}`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Stock: ${overall.totalStock.toLocaleString()} kg`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Products: ${overall.totalProducts}`, 20, yPos);
        yPos += 10;
        pdf.text(`Total Hubs: ${overall.totalHubs}`, 20, yPos);
        yPos += 15;
      }
      
      // Add grade breakdown
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Grade Breakdown', 15, yPos);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      yPos += 10;
      
      if (hubData && hubData.overall && hubData.overall.gradeBreakdown) {
        const gradeBreakdown = hubData.overall.gradeBreakdown;
        
        for (const [grade, data] of Object.entries(gradeBreakdown)) {
          pdf.text(`${grade}:`, 20, yPos);
          pdf.text(`  • Stock: ${data.totalStock.toLocaleString()} kg`, 20, yPos + 7);
          pdf.text(`  • Value: ₹${data.totalPrice.toLocaleString()}`, 20, yPos + 14);
          pdf.text(`  • Products: ${data.count}`, 20, yPos + 21);
          yPos += 30;
        }
      }
      
      // Add hub details
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('Hub Details', 15, yPos);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      yPos += 10;
      
      if (hubData && hubData.hubs) {
        for (const hub of hubData.hubs) {
          if (hub.productCount > 0) { // Only show hubs with products
            // Hub name and location
            pdf.setFont(undefined, 'bold');
            pdf.text(`${hub.hubName} (${hub.district}, ${hub.state})`, 20, yPos);
            pdf.setFont(undefined, 'normal');
            
            yPos += 7;
            
            // Hub stats
            pdf.text(`  • Total Stock: ${hub.totalStock.toLocaleString()} kg`, 20, yPos);
            yPos += 7;
            pdf.text(`  • Total Value: ₹${hub.totalPrice.toLocaleString()}`, 20, yPos);
            yPos += 7;
            pdf.text(`  • Products: ${hub.productCount}`, 20, yPos);
            yPos += 7;
            
            // Grade breakdown for this hub
            pdf.text('  Grade Breakdown:', 20, yPos);
            yPos += 7;
            
            for (const [grade, data] of Object.entries(hub.gradeBreakdown)) {
              if (data.count > 0) {
                pdf.text(`    - ${grade}: ${data.totalStock.toLocaleString()} kg, ₹${data.totalPrice.toLocaleString()}, ${data.count} products`, 20, yPos);
                yPos += 7;
              }
            }
            
            yPos += 10; // Extra space between hubs
            
            // Check if we need a new page
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
          }
        }
      }
      
      // Add footer
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'italic');
      pdf.text('Confidential - Internal Use Only', 105, 290, { align: 'center' });
      
      pdf.save('hub-stock-summary-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF report. Please try again.');
    }
  };

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Hub Stock Summary</h3>
        <p className="card-subtitle">Overview of bulk product stocks across all hubs</p>
        <div className="card-actions">
          <button 
            onClick={generatePDF}
            className="btn btn-secondary"
            disabled={!hubData || loading}
          >
            📄 Download Report
          </button>
        </div>
      </div>
      
      <div id="hub-stock-report" className="card-content">
        {/* Overall Summary */}
        <div className="hub-stock-overview">
          <div className="overview-stats-grid">
            <div className="stat-card">
              <div className="stat-value">₹{overall.totalPrice.toLocaleString()}</div>
              <div className="stat-label">Total Value</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{overall.totalStock.toLocaleString()} kg</div>
              <div className="stat-label">Total Stock</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{overall.totalProducts}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{overall.totalHubs}</div>
              <div className="stat-label">Total Hubs</div>
            </div>
          </div>

          {/* Grade Breakdown */}
          <div className="grade-breakdown-section">
            <h4>Grade Breakdown</h4>
            <div className="grade-stats-grid">
              {Object.entries(overall.gradeBreakdown).map(([grade, data]) => {
                const color = getGradeColor(grade);
                return (
                  <div 
                    key={grade} 
                    className="grade-stat-card"
                    style={{ 
                      backgroundColor: color.bg,
                      border: `1px solid ${color.border}`
                    }}
                  >
                    <div className="grade-header">
                      <span 
                        className="grade-name"
                        style={{ color: color.text }}
                      >
                        {grade}
                      </span>
                    </div>
                    <div className="grade-stats">
                      <div className="stat-item">
                        <span className="stat-label">Stock:</span>
                        <span className="stat-value">{data.totalStock.toLocaleString()} kg</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Value:</span>
                        <span className="stat-value">₹{data.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Products:</span>
                        <span className="stat-value">{data.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Individual Hub Details */}
        <div className="hub-details-section">
          <h4>Hub Details</h4>
          <div className="hub-list">
            {hubs.map((hub) => (
              <div key={hub.hubId} className="hub-card">
                <div className="hub-header">
                  <h5>{hub.hubName}</h5>
                  <div className="hub-location">
                    <span className="district-tag">📍 {hub.district}, {hub.state}</span>
                  </div>
                </div>
                
                <div className="hub-stats">
                  <div className="hub-main-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Stock:</span>
                      <span className="stat-value">{hub.totalStock.toLocaleString()} kg</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Value:</span>
                      <span className="stat-value">₹{hub.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Products:</span>
                      <span className="stat-value">{hub.productCount}</span>
                    </div>
                  </div>
                  
                  {/* Hub Grade Breakdown */}
                  <div className="hub-grade-breakdown">
                    <h6>Grade Breakdown:</h6>
                    <div className="hub-grade-grid">
                      {Object.entries(hub.gradeBreakdown).map(([grade, data]) => {
                        if (data.count === 0) return null;
                        
                        const color = getGradeColor(grade);
                        return (
                          <div 
                            key={grade} 
                            className="hub-grade-item"
                            style={{ 
                              backgroundColor: color.bg,
                              border: `1px solid ${color.border}`
                            }}
                          >
                            <div 
                              className="grade-name-small"
                              style={{ color: color.text }}
                            >
                              {grade}
                            </div>
                            <div className="grade-stats-small">
                              <div>{data.totalStock.toLocaleString()} kg</div>
                              <div>₹{data.totalPrice.toLocaleString()}</div>
                              <div>({data.count} products)</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}