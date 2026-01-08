import React, { useState, useEffect } from "react";
import "../../../css/FarmerDashboard.css";
import { getCardamomPrices } from "../../../services/api";

export default function CardamomPriceTracker() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCardamomPrices();
  }, []);

  const fetchCardamomPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCardamomPrices();
      setPrices(response.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching cardamom prices:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Cardamom Market Prices</h3>
        </div>
        <div className="card-content">
          <p>Loading market prices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="card-header">
          <h3>Cardamom Market Prices</h3>
        </div>
        <div className="card-content">
          <p className="error-message">Error loading market prices: {error}</p>
          <button className="view-all-btn" onClick={fetchCardamomPrices}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h3>Cardamom Market Prices</h3>
        <button className="view-all-btn" onClick={fetchCardamomPrices}>
          Refresh Prices
        </button>
      </div>
      <div className="card-content">
        {prices.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Auctioneer</th>
                  <th>Lots</th>
                  <th>Total Qty</th>
                  <th>Qty Sold</th>
                  <th>Max Price (₹)</th>
                  <th>Avg Price (₹)</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((price, index) => (
                  <tr key={index}>
                    <td>{price.date}</td>
                    <td>{price.auctioneer}</td>
                    <td>{price.lots}</td>
                    <td>{price.total_qty}</td>
                    <td>{price.qty_sold}</td>
                    <td>{price.max_price}</td>
                    <td>{price.avg_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No market price data available at the moment.</p>
        )}
        
        <div className="market-insights">
          <h4>Market Insights</h4>
          {prices.length > 0 && (
            <div className="insights-content">
              <div className="insight-card">
                <h5>Today's Average Price</h5>
                <p className="highlight">
                  ₹{prices[0]?.avg_price || 'N/A'}
                </p>
              </div>
              <div className="insight-card">
                <h5>Today's Maximum Price</h5>
                <p className="highlight">
                  ₹{prices[0]?.max_price || 'N/A'}
                </p>
              </div>
              <div className="insight-card">
                <h5>Market Activity</h5>
                <p className="highlight">
                  {prices[0]?.lots || 'N/A'} lots traded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}