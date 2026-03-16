import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  image: { type: String },
  grade: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
  id: { type: String }, // Custom friendly ID
  orderType: { type: String, enum: ['cardamom', 'agricare', 'regular'], default: 'regular' },
  agricareProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subtotal: { type: Number },
  platformFee: { type: Number, default: 0 },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Pending' 
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: { type: String, default: 'IN' },
  },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'CARD', 'ONLINE'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  notes: String,
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  // Optional tracking history
  tracking: [{
    status: { type: String },
    message: { type: String },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);