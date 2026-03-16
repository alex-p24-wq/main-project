import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getProductById, createCustomerOrder, createPaymentOrder, verifyPayment, handlePaymentFailure } from "../services/api";
import { useNavigationBlock } from "../hooks/useNavigationBlock";
import { logout } from "../services/auth";
import { loadRazorpayScript, initializeRazorpayPayment, formatAmount } from "../utils/razorpay";
import { useNotifications } from "../contexts/NotificationContext";
import { notificationTemplates } from "../utils/notifications";
import { useToast } from "../components/notifications/ToastContainer";
import "../css/CheckoutPage.css";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { addNotification } = useNotifications();
  const { showSuccess, showError, showWarning } = useToast();

  // Enable navigation blocking for checkout page
  useNavigationBlock(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [showSaveAddressModal, setShowSaveAddressModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Handle force logout from navigation blocking
  useEffect(() => {
    const handleForceLogout = async () => {
      await logout();
      navigate("/login", { replace: true });
    };

    window.addEventListener('forceLogout', handleForceLogout);

    return () => {
      window.removeEventListener('forceLogout', handleForceLogout);
    };
  }, [navigate]);

  // Auth gate: redirect to login if not authenticated, and preserve return URL
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const redirect = encodeURIComponent(`/checkout/${productId}`);
      navigate(`/login?redirect=${redirect}`, { replace: true });
    }
  }, [navigate, productId]);

  // Load saved addresses from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("customerAddresses");
      if (saved) {
        const addresses = JSON.parse(saved);
        setSavedAddresses(Array.isArray(addresses) ? addresses : []);

        // Auto-select the first address if available
        if (addresses.length > 0) {
          setShippingAddress(addresses[0]);
          setSelectedAddressIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
    }
  }, []);

  // Load product to show summary and price
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getProductById(productId);
        if (mounted) setProduct(data);
      } catch (e) {
        if (mounted) setError(e?.message || "Failed to load product");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (productId) load();
    return () => { mounted = false; };
  }, [productId]);

  const PLATFORM_FEE_PERCENT = 5; // 5% platform rent fee

  const maxQty = useMemo(() => Math.max(0, Number(product?.stock) || 0), [product]);
  const unitPrice = useMemo(() => Number(product?.price) || 0, [product]);
  const totalAmount = useMemo(() => Math.max(1, quantity) * unitPrice, [quantity, unitPrice]);
  const platformFee = useMemo(() => Math.round(totalAmount * PLATFORM_FEE_PERCENT) / 100, [totalAmount]);
  const finalTotal = useMemo(() => totalAmount + platformFee, [totalAmount, platformFee]);

  const updateAddr = (k, v) => {
    setShippingAddress(prev => ({ ...prev, [k]: v }));
    setSelectedAddressIndex(-1); // Deselect saved address when manually editing
  };

  const selectSavedAddress = (index) => {
    if (index >= 0 && index < savedAddresses.length) {
      setShippingAddress(savedAddresses[index]);
      setSelectedAddressIndex(index);
    }
  };

  const saveCurrentAddress = () => {
    try {
      const newAddress = { ...shippingAddress };
      const updatedAddresses = [...savedAddresses];

      // Check if address already exists
      const existingIndex = updatedAddresses.findIndex(addr =>
        addr.line1 === newAddress.line1 &&
        addr.city === newAddress.city &&
        addr.postalCode === newAddress.postalCode
      );

      if (existingIndex === -1) {
        updatedAddresses.unshift(newAddress); // Add to beginning
        // Keep only last 3 addresses
        if (updatedAddresses.length > 3) {
          updatedAddresses.pop();
        }

        localStorage.setItem("customerAddresses", JSON.stringify(updatedAddresses));
        setSavedAddresses(updatedAddresses);
        setSelectedAddressIndex(0);
      }

      setShowSaveAddressModal(false);
    } catch (error) {
      console.error('Failed to save address:', error);
    }
  };

  const checkAndPromptSaveAddress = () => {
    // Check if current address is different from saved ones
    const isNewAddress = !savedAddresses.some(addr =>
      addr.line1 === shippingAddress.line1 &&
      addr.city === shippingAddress.city &&
      addr.postalCode === shippingAddress.postalCode
    );

    if (isNewAddress && shippingAddress.line1 && shippingAddress.city) {
      setShowSaveAddressModal(true);
      return true;
    }
    return false;
  };

  const handleCODOrder = async () => {
    try {
      setPlacing(true);
      const orderResponse = await createCustomerOrder({
        productId: product._id || product.id,
        quantity: Math.min(Math.max(1, Number(quantity) || 1), maxQty || 1),
        shippingAddress,
        notes: notes?.trim() ? notes.trim() : undefined,
        paymentMethod: "COD",
      });

      const orderId = orderResponse.order._id?.slice(-6).toUpperCase() || 'N/A';
      const amount = finalTotal.toLocaleString("en-IN");

      // Add success notification to bell icon
      addNotification(notificationTemplates.codOrderPlaced(orderId, amount));

      // Show beautiful toast notification
      showSuccess(
        "Order Placed Successfully!",
        `Your COD order #${orderId} for ₹${amount} has been confirmed. You will pay on delivery.`,
        {
          icon: "💰",
          duration: 6000
        }
      );

      // Navigate after a short delay to let user see the toast
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (e2) {
      // Add error notification to bell icon
      addNotification(notificationTemplates.paymentFailed(e2?.message || "Failed to place order"));

      // Show beautiful error toast
      showError(
        "Order Failed",
        e2?.message || "Failed to place order. Please try again.",
        {
          icon: "❌",
          duration: 7000
        }
      );
    } finally {
      setPlacing(false);
    }
  };

  const handleOnlinePayment = async () => {
    let orderResponse;
    try {
      setPlacing(true);

      // First create the order
      orderResponse = await createCustomerOrder({
        productId: product._id || product.id,
        quantity: Math.min(Math.max(1, Number(quantity) || 1), maxQty || 1),
        shippingAddress,
        notes: notes?.trim() ? notes.trim() : undefined,
        paymentMethod: "ONLINE",
      });

      const orderId = orderResponse.order._id;

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load payment gateway. Please try again.");
      }

      // Create Razorpay order
      setProcessingPayment(true);
      const paymentOrder = await createPaymentOrder(orderId);

      // Initialize Razorpay payment
      const paymentResult = await initializeRazorpayPayment({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        order_id: paymentOrder.razorpayOrderId,
        name: "E-Cardamom Connect",
        description: `Payment for ${product.name}`,
        prefill: {
          name: shippingAddress.fullName,
          email: "", // Add email if available
          contact: shippingAddress.phone,
        },
        notes: {
          orderId: orderId,
          productName: product.name,
        },
      });

      // Verify payment
      await verifyPayment({
        ...paymentResult,
        orderId: orderId,
      });

      const orderIdShort = orderId?.slice(-6).toUpperCase() || 'N/A';
      const amount = finalTotal.toLocaleString("en-IN");

      // Add success notifications to bell icon
      addNotification(notificationTemplates.paymentSuccess(amount, orderIdShort));
      addNotification(notificationTemplates.orderConfirmed(orderIdShort, amount));

      // Show beautiful success toast
      showSuccess(
        "Payment Successful!",
        `Your payment of ₹${amount} has been processed successfully. Order #${orderIdShort} is confirmed and will be processed soon.`,
        {
          icon: "🎉",
          duration: 7000
        }
      );

      // Navigate after a short delay to let user see the toast
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (error) {
      console.error("Payment error:", error);

      if (error.message === "Payment cancelled by user") {
        // Add cancellation notification to bell icon
        addNotification(notificationTemplates.paymentCancelled());

        // Show warning toast
        showWarning(
          "Payment Cancelled",
          "Payment was cancelled. Your order is saved and you can retry payment later.",
          {
            icon: "⏸️",
            duration: 6000
          }
        );
      } else if (error.error) {
        // Razorpay payment failed
        if (orderResponse?.order?._id) {
          await handlePaymentFailure(orderResponse.order._id, error);
        }
        const failureReason = error.description || error.reason || "Unknown error";

        // Add failure notification to bell icon
        addNotification(notificationTemplates.paymentFailed(failureReason));

        // Show error toast
        showError(
          "Payment Failed",
          `Payment could not be processed: ${failureReason}`,
          {
            icon: "💳",
            duration: 8000
          }
        );
      } else {
        // General error
        const errorMessage = error?.message || "Payment failed. Please try again.";
        addNotification(notificationTemplates.paymentFailed(errorMessage));

        // Show error toast
        showError(
          "Payment Error",
          errorMessage,
          {
            icon: "❌",
            duration: 7000
          }
        );
      }
    } finally {
      setPlacing(false);
      setProcessingPayment(false);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!product?._id && !product?.id) return;
    if (maxQty < 1) return alert("Out of stock");

    // Basic field checks
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      return alert("Please complete the shipping address");
    }

    // Check if we should save the address
    const shouldPromptSave = checkAndPromptSaveAddress();
    if (shouldPromptSave) {
      return; // Wait for user to decide on saving address
    }

    if (paymentMethod === "COD") {
      // Handle COD orders
      await handleCODOrder();
    } else {
      // Handle online payment
      await handleOnlinePayment();
    }
  };

  const proceedWithOrder = async () => {
    if (paymentMethod === "COD") {
      await handleCODOrder();
    } else {
      await handleOnlinePayment();
    }
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <Link to="/dashboard" className="back-link">← Back</Link>
        <h2 className="checkout-title">Checkout</h2>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : !product ? (
        <div className="empty">Product not found.</div>
      ) : (
        <div className="checkout-grid">
          {/* Left: Address + Payment */}
          <form onSubmit={placeOrder}>
            <div className="checkout-card">
              <div className="section-header">
                <h3 className="section-title">📍 Delivery Address</h3>
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => setSelectedAddressIndex(-1)}
                  >
                    + Add New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="saved-addresses">
                  <h4 className="saved-title">Saved Addresses</h4>
                  <div className="address-grid">
                    {savedAddresses.map((addr, index) => (
                      <div
                        key={index}
                        className={`address-card ${selectedAddressIndex === index ? 'selected' : ''}`}
                        onClick={() => selectSavedAddress(index)}
                      >
                        <div className="address-header">
                          <span className="address-name">{addr.fullName}</span>
                          <span className="address-phone">{addr.phone}</span>
                        </div>
                        <div className="address-text">
                          {addr.line1}, {addr.line2 && `${addr.line2}, `}
                          {addr.city}, {addr.state} - {addr.postalCode}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Form */}
              <div className={`address-form ${savedAddresses.length > 0 && selectedAddressIndex >= 0 ? 'hidden' : ''}`}>
                <div className="form-grid">
                  <div className="field">
                    <label>Full Name *</label>
                    <input
                      value={shippingAddress.fullName}
                      onChange={e => updateAddr("fullName", e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Phone Number *</label>
                    <input
                      value={shippingAddress.phone}
                      onChange={e => updateAddr("phone", e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                  <div className="field full">
                    <label>Address Line 1 *</label>
                    <input
                      value={shippingAddress.line1}
                      onChange={e => updateAddr("line1", e.target.value)}
                      placeholder="House/Flat/Block No., Street Name"
                      required
                    />
                  </div>
                  <div className="field full">
                    <label>Address Line 2 (Optional)</label>
                    <input
                      value={shippingAddress.line2}
                      onChange={e => updateAddr("line2", e.target.value)}
                      placeholder="Landmark, Area, Colony"
                    />
                  </div>
                  <div className="field">
                    <label>City *</label>
                    <input
                      value={shippingAddress.city}
                      onChange={e => updateAddr("city", e.target.value)}
                      placeholder="City"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>State *</label>
                    <input
                      value={shippingAddress.state}
                      onChange={e => updateAddr("state", e.target.value)}
                      placeholder="State"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>PIN Code *</label>
                    <input
                      value={shippingAddress.postalCode}
                      onChange={e => updateAddr("postalCode", e.target.value)}
                      placeholder="6-digit PIN code"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Country</label>
                    <select value={shippingAddress.country} onChange={e => updateAddr("country", e.target.value)}>
                      <option value="IN">India</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout-card modern-payment">
              <div className="section-header">
                <h3 className="section-title">💳 Payment Method</h3>
                <div className="secure-badge">🔒 100% Secure</div>
              </div>
              <div className="pm-options">
                <div
                  className={`pm-tile ${paymentMethod === "ONLINE" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("ONLINE")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === "ONLINE"}
                    readOnly
                  />
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>💳 Pay Online</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>UPI, Cards, Net Banking</div>
                  </div>
                </div>
                <div
                  className={`pm-tile ${paymentMethod === "COD" ? "active" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    readOnly
                  />
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px" }}>💰 Cash on Delivery</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Pay when you receive</div>
                  </div>
                </div>
              </div>
              {paymentMethod === "ONLINE" && (
                <div className="payment-info" style={{ marginTop: "16px" }}>
                  <div className="payment-method">
                    <div className="payment-icon">🔒</div>
                    <div className="payment-details">
                      <div className="payment-title">Secure Payment by Razorpay</div>
                      <div className="payment-subtitle">Your payment information is encrypted and secure</div>
                    </div>
                    <div className="payment-badges">
                      <span className="badge">UPI</span>
                      <span className="badge">Cards</span>
                      <span className="badge">NetBanking</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="checkout-card" style={{ marginTop: 16 }}>
              <h3 className="section-title">Notes</h3>
              <div className="field">
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any delivery instructions?" />
              </div>
            </div>

            <div className="modern-actions">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost">
                ← Go Back
              </button>
              <button disabled={placing || processingPayment || maxQty < 1} type="submit" className="btn btn-pay-now">
                {placing || processingPayment ? (
                  <>
                    <span className="spinner"></span>
                    {processingPayment ? "Processing Payment..." : "Placing Order..."}
                  </>
                ) : (
                  <>
                    {paymentMethod === "COD" ? "🛒" : "💳"} {paymentMethod === "COD" ? "Place Order" : "Pay Now"} - ₹{finalTotal.toLocaleString("en-IN")}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Right: Order Summary */}
          <div className="checkout-card summary-card">
            <h3 className="section-title">Order Summary</h3>
            <div className="product-line">
              <div className="thumb">
                {product?.image ? (
                  <img src={product.image} alt={product?.name} />
                ) : (
                  <span>📦</span>
                )}
              </div>
              <div className="p-meta">
                <div className="p-name">{product?.name}</div>
                <div className="p-sub">Grade: {product?.grade || "-"}</div>
                <div className="p-price">₹{unitPrice}/kg</div>
              </div>
            </div>

            <div className="qty-row">
              <span>Quantity</span>
              <div className="qty-control">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, (q || 1) - 1))} disabled={quantity <= 1}>-</button>
                <input type="number" min={1} max={maxQty || 1} value={quantity} onChange={(e) => setQuantity(Math.min(Math.max(1, Number(e.target.value) || 1), maxQty || 1))} />
                <button type="button" onClick={() => setQuantity(q => Math.min((q || 1) + 1, maxQty || 1))} disabled={quantity >= (maxQty || 1)}>+</button>
              </div>
            </div>

            <div className={`stock ${maxQty > 0 ? "ok" : "bad"}`}>
              {maxQty > 0 ? `${maxQty} kg in stock` : "Out of stock"}
            </div>

            <div className="hr" />
            <div className="totals" style={{ color: "#6b7280", fontWeight: 400, fontSize: "14px" }}>
              <span>Item Total</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="totals" style={{ color: "#f59e0b", fontWeight: 500, fontSize: "13px", marginTop: 6 }}>
              <span>🏷️ Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
              <span>+ ₹{platformFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="hr" style={{ margin: "10px 0" }} />
            <div className="totals" style={{ fontWeight: 700, fontSize: "16px" }}>
              <span>Total Payable</span>
              <span style={{ color: "#10b981" }}>₹{finalTotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="p-sub" style={{ marginTop: 6 }}>
              Inclusive of 5% platform fee
            </div>
          </div>
        </div>
      )}

      {/* Save Address Modal */}
      {showSaveAddressModal && (
        <div className="modal-overlay" onClick={() => setShowSaveAddressModal(false)}>
          <div className="save-address-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💾 Save Address</h3>
              <button className="modal-close" onClick={() => setShowSaveAddressModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <p>Would you like to save this address for future orders?</p>
              <div className="address-preview">
                <strong>{shippingAddress.fullName}</strong><br />
                {shippingAddress.line1}, {shippingAddress.line2 && `${shippingAddress.line2}, `}
                {shippingAddress.city}, {shippingAddress.state} - {shippingAddress.postalCode}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowSaveAddressModal(false);
                  proceedWithOrder();
                }}
              >
                Skip & Continue
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  saveCurrentAddress();
                  proceedWithOrder();
                }}
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
