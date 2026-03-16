import React, { useEffect, useState } from "react";
import styles from "./ConnectAgriCare.module.css";
import { getAgricareCatalog, createAgricareOrder, verifyAgricarePayment } from "../../../services/api";
import { Search, ShoppingBag, Leaf, AlertCircle, PackageOpen, Minus, Plus, CreditCard, Banknote, X, IndianRupee, Loader2 } from "lucide-react";

// Show AgriCare product catalog for farmers
export default function ConnectAgriCare() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod or online
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAgricareCatalog({ page: 1, limit: 24 });
        setItems(res.items || []);
      } catch (e) {
        setError(e?.message || "Failed to load AgriCare catalog");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = items.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  const handleOrder = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowOrderModal(true);
  };

  const confirmOrder = async () => {
    if (!selectedProduct || quantity <= 0) return;
    if (quantity > selectedProduct.stock) {
      setError(`Only ${selectedProduct.stock} units available`);
      return;
    }

    const subtotal = selectedProduct.price * quantity;
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = subtotal + platformFee;

    // Handle COD orders directly
    if (paymentMethod === 'cod') {
      setOrderLoading(true);
      setError("");
      
      try {
        const orderData = {
          productId: selectedProduct._id || selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          price: selectedProduct.price,
          total: totalAmount,
          paymentMethod
        };

        await createAgricareOrder(orderData);
        alert('Order placed successfully! Payment will be collected at delivery.');
        setShowOrderModal(false);
        setSelectedProduct(null);
      } catch (err) {
        setError(err?.message || "Failed to place order");
      } finally {
        setOrderLoading(false);
      }
    } else {
      // For online payment, we redirect to the handleOnlinePayment function
      handleOnlinePayment();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);
  };

  const handleOnlinePayment = async () => {
    if (!selectedProduct || quantity <= 0) return;
    if (quantity > selectedProduct.stock) {
      setError(`Only ${selectedProduct.stock} units available`);
      return;
    }

    setOrderLoading(true);
    setError("");
    
    const subtotal = selectedProduct.price * quantity;
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const totalAmount = subtotal + platformFee;
    
    try {
      const orderData = {
        productId: selectedProduct._id || selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        price: selectedProduct.price,
        total: totalAmount,
        paymentMethod: "online"
      };

      // Create the order first
      const orderResponse = await createAgricareOrder(orderData);
      
      if (!orderResponse.razorpayOrderId) {
        throw new Error('Failed to generate Razorpay order ID');
      }

      // Now initiate Razorpay payment
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: orderResponse.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID, 
          amount: Math.round(totalAmount * 100).toString(), 
          currency: 'INR',
          name: 'E-Cardamom Connect',
          description: `Payment for ${selectedProduct.name}`,
          order_id: orderResponse.razorpayOrderId, 
          handler: async function (response) {
            try {
              // Verify payment with backend
              const paymentData = {
                orderId: orderResponse.data._id, // Must use Mongo ObjectID
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              };
              
              // Verify AgriCare payment
              await verifyAgricarePayment(paymentData);
              alert('Payment successful! Your order has been confirmed.');
              setShowOrderModal(false);
              setSelectedProduct(null);
            } catch (err) {
              setError(err?.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: '',
          },
          theme: {
            color: '#10b981',
          },
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        setError('Failed to load payment gateway');
        setOrderLoading(false);
      };
      document.body.appendChild(script);
    } catch (err) {
      setError(err?.message || "Failed to initiate payment");
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.dashboardCard}>
        <div className={styles.cardHeader}>
          <div className={styles.titleWrapper}>
            <div className={styles.titleIcon}>
              <Leaf size={28} />
            </div>
            <div className={styles.titleText}>
              <h3>AgriCare Products</h3>
              <p>Browse quality agricultural products for your farm</p>
            </div>
          </div>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search products, seeds, fertilizers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.cardContent}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={48} className="animate-spin" style={{ animation: "spin 2s linear infinite" }} />
              <p style={{ fontSize: '18px', fontWeight: '500' }}>Loading catalog...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <PackageOpen size={40} />
              </div>
              <h4>No Products Found</h4>
              <p>Try adjusting your search criteria or check back later.</p>
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {filtered.map((p) => (
                <div className={styles.productCard} key={p._id || p.id}>
                  <div className={styles.productImage}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} />
                    ) : (
                      <div className={styles.noImage}>
                        <Leaf size={48} strokeWidth={1} />
                        <span>No Image</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.productDetails}>
                    <div className={styles.productHeader}>
                      <h3 className={styles.productName}>{p.name}</h3>
                      <span className={styles.productType}>{p.type}</span>
                    </div>
                    
                    <div className={styles.productStats}>
                      <div className={styles.productPrice}>
                        {formatCurrency(p.price)}
                      </div>
                      <div className={`${styles.productStock} ${p.stock < 10 ? styles.lowStock : ''}`}>
                        <PackageOpen size={14} />
                        {p.stock} left
                      </div>
                    </div>
                    
                    {p.description && (
                      <p className={styles.productDesc}>{p.description}</p>
                    )}
                    
                    <button 
                      className={styles.orderBtn} 
                      onClick={() => handleOrder(p)}
                    >
                      <ShoppingBag size={18} />
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Modal */}
        {showOrderModal && selectedProduct && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>
                  <ShoppingBag size={22} color="#10b981" />
                  Order Summary
                </h3>
                <button className={styles.closeBtn} onClick={() => setShowOrderModal(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                {error && (
                  <div className={styles.errorState} style={{ marginBottom: 20 }}>
                    <AlertCircle size={20} /> {error}
                  </div>
                )}
                
                <div className={styles.orderSummaryCard}>
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className={styles.summaryImage} />
                  ) : (
                    <div className={styles.summaryNoImage}>
                      <Leaf size={32} />
                    </div>
                  )}
                  <div className={styles.summaryDetails}>
                    <h4>{selectedProduct.name}</h4>
                    <p>{formatCurrency(selectedProduct.price)} per unit</p>
                    <p style={{ color: '#3b82f6' }}>{selectedProduct.type}</p>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Quantity</label>
                  <div className={styles.quantityControl}>
                    <button 
                      type="button" 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct.stock}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), selectedProduct.stock))}
                      className={styles.qtyInput}
                    />
                    <button 
                      type="button" 
                      className={styles.qtyBtn}
                      onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                      disabled={quantity >= selectedProduct.stock}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className={styles.stockInfo}>
                    Maximum available: {selectedProduct.stock} units
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Total Amount</label>
                  <div className={styles.totalAmountBox}>
                    <div className={styles.totalAmountRow}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(selectedProduct.price * quantity)}</span>
                    </div>
                    <div className={styles.totalAmountRow}>
                      <span>Platform Fee (5%)</span>
                      <span>{formatCurrency(selectedProduct.price * quantity * 0.05)}</span>
                    </div>
                    <div className={styles.totalAmountDivider}></div>
                    <div className={styles.totalAmountFinal}>
                      <span className={styles.label}>Total exactly</span>
                      <div className={styles.totalAmountValue}>
                        {formatCurrency((selectedProduct.price * quantity) + Number((selectedProduct.price * quantity * 0.05).toFixed(2)))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Payment Method</label>
                  <div className={styles.paymentOptions}>
                    <label className={`${styles.paymentOption} ${paymentMethod === 'cod' ? styles.selected : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={styles.paymentRadio}
                      />
                      <div>
                        <div className={styles.paymentLabel}>Cash on Delivery</div>
                        <div className={styles.paymentDesc}>Pay securely at doorstep</div>
                      </div>
                    </label>
                    
                    <label className={`${styles.paymentOption} ${paymentMethod === 'online' ? styles.selected : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="online"
                        checked={paymentMethod === 'online'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={styles.paymentRadio}
                      />
                      <div>
                        <div className={styles.paymentLabel}>Online Payment</div>
                        <div className={styles.paymentDesc}>Credit/Debit/UPI via Razorpay</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    className={`${styles.modalBtn} ${styles.cancelBtn}`}
                    type="button"
                    onClick={() => setShowOrderModal(false)}
                    disabled={orderLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.modalBtn} ${paymentMethod === 'online' ? styles.payBtnOnline : styles.payBtnCod}`}
                    onClick={paymentMethod === 'online' ? () => handleOnlinePayment() : confirmOrder}
                    disabled={orderLoading}
                  >
                    {orderLoading ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    ) : paymentMethod === 'online' ? (
                      <><CreditCard size={18} /> Pay Online</>
                    ) : (
                      <><Banknote size={18} /> Place Order</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}