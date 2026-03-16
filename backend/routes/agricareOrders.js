import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../utils/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// Create AgriCare order (farmer places order for AgriCare products)
router.post('/', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { productId, quantity, paymentMethod } = req.body;

    // Validate required fields
    if (!productId || !quantity || !paymentMethod) {
      return res.status(400).json({ message: 'Product ID, quantity, and payment method are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Payment method must be "cod" or "online"' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} units available` });
    }

    // Calculate total, subtotal and platform fee
    const subtotal = product.price * quantity;
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const amount = subtotal + platformFee;

    // Create order
    const order = await Order.create({
      id: `AGR-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`,
      customer: req.user._id, // Farmer is the customer in this context
      items: [{
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: quantity,
      }],
      subtotal,
      platformFee,
      amount,
      paymentMethod: paymentMethod.toUpperCase(),
      status: paymentMethod.toLowerCase() === 'cod' ? 'Pending' : 'Processing', // Capitalized status matches OrderSchema enum
      orderType: 'agricare', // Mark as AgriCare order
      agricareProvider: product.user // The AgriCare provider who created the product
    });

    let razorpayOrderId = null;
    let keyId = process.env.RAZORPAY_KEY_ID;

    if (paymentMethod === 'online') {
      try {
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const rzpOrder = await razorpay.orders.create({
          amount: Math.round(amount * 100),
          currency: 'INR',
          receipt: order._id.toString(),
        });

        razorpayOrderId = rzpOrder.id;
        order.razorpayOrderId = razorpayOrderId;
        await order.save();
      } catch (rzpErr) {
        console.error('Razorpay generation error:', rzpErr);
        return res.status(500).json({ message: 'Failed to initiate payment gateway.' });
      }
    }

    // Update product stock
    product.stock -= quantity;
    await product.save();

    // Send email notifications if payment is online
    if (paymentMethod === 'online') {
      try {
        // Get customer (farmer) details
        const customer = await User.findById(req.user._id).select('username email');
        
        // Get AgriCare provider details
        const provider = await User.findById(product.user).select('username email');
        
        // Send email to AgriCare provider (product sold notification)
        if (provider && provider.email) {
          await sendEmail(
            provider.email,
            `New AgriCare Product Sold - Order ${order.id}`,
            `
              <h2>New Product Sale - Order Confirmed</h2>
              <p>Dear ${provider.username},</p>
              <p>Your product <strong>${product.name}</strong> has been purchased.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Order ID: ${order.id}</li>
                <li>Product: ${product.name}</li>
                <li>Quantity: ${quantity}</li>
                <li>Subtotal: ₹${subtotal}</li>
                <li>Platform Fee: ₹${platformFee}</li>
                <li>Total Amount: ₹${amount}</li>
                <li>Customer: ${customer?.username || 'N/A'}</li>
                <li>Payment Method: Online</li>
                <li>Order Date: ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Please prepare the product for delivery as per agreed terms.</p>
              <p>Thank you for using E-Cardamom Connect!</p>
            `
          );
        }
        
        // Send email to customer (farmer) (product purchased notification)
        if (customer && customer.email) {
          await sendEmail(
            customer.email,
            `AgriCare Product Purchase Confirmation - Order ${order.id}`,
            `
              <h2>Order Confirmation - Order ${order.id}</h2>
              <p>Dear ${customer.username},</p>
              <p>Thank you for your purchase! Your order has been confirmed.</p>
              <p><strong>Order Details:</strong></p>
              <ul>
                <li>Product: ${product.name}</li>
                <li>Quantity: ${quantity}</li>
                <li>Subtotal: ₹${subtotal}</li>
                <li>Platform Fee: ₹${platformFee}</li>
                <li>Total Amount: ₹${amount}</li>
                <li>Payment Method: Online (Paid)</li>
                <li>Order Date: ${new Date().toLocaleDateString()}</li>
              </ul>
              <p>Your order is being processed and will be delivered soon.</p>
              <p>Thank you for choosing E-Cardamom Connect!</p>
            `
          );
        }
      } catch (emailError) {
        console.error('Error sending email notifications:', emailError);
        // Don't fail the order if emails fail to send
      }
    }

    res.status(201).json({
      success: true,
      message: 'AgriCare order created successfully',
      data: order,
      razorpayOrderId,
      keyId
    });
  } catch (error) {
    console.error('Create agricare order error:', error);
    res.status(500).json({ message: 'Failed to create AgriCare order', error: error.message });
  }
});

// Get farmer's AgriCare orders
router.get('/', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { customer: req.user._id, orderType: 'agricare' };
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get agricare orders error:', error);
    res.status(500).json({ message: 'Failed to fetch AgriCare orders', error: error.message });
  }
});

// Get AgriCare provider's orders
router.get('/provider', requireAuth, requireRole('agricare'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { agricareProvider: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'username email')
        .populate('items.product', 'name image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get provider agricare orders error:', error);
    res.status(500).json({ message: 'Failed to fetch AgriCare provider orders', error: error.message });
  }
});

// Verify AgriCare order payment
router.post('/:orderId/verify-payment', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature
    } = req.body;
    
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing required fields for payment verification' });
    }
    
    // Find the order
    const order = await Order.findOne({ 
      _id: orderId, 
      customer: req.user._id,
      paymentMethod: 'ONLINE'
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Verify the payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
    
    // Update order status to paid
    order.paymentStatus = 'Paid';
    order.status = 'Processing';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    
    await order.save();
    
    // Get the product details for notification
    const product = await Product.findById(order.items[0].product);
    const customer = await User.findById(order.customer);
    const provider = await User.findById(order.agricareProvider);
    
    // Send email notifications
    if (provider && provider.email) {
      try {
        await sendEmail(
          provider.email,
          `Payment Received for Order ${order.id}`,
          `
            <h2>Payment Received - Order ${order.id}</h2>
            <p>Dear ${provider.username},</p>
            <p>Payment has been received for your product <strong>${product?.name}</strong>.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Order ID: ${order.id}</li>
              <li>Product: ${product?.name}</li>
              <li>Quantity: ${order.items[0].quantity}</li>
              <li>Subtotal: ₹${order.subtotal}</li>
              <li>Platform Fee (Admin Profit): ₹${order.platformFee}</li>
              <li>Total Amount Received: ₹${order.amount}</li>
              <li>Customer: ${customer?.username || 'N/A'}</li>
              <li>Payment Method: Online</li>
              <li>Payment Status: Paid</li>
            </ul>
            <p>Please proceed with preparing the product for delivery.</p>
            <p>Thank you for using E-Cardamom Connect!</p>
          `
        );
      } catch (emailError) {
        console.error('Error sending payment received email to provider:', emailError);
      }
    }
    
    if (customer && customer.email) {
      try {
        await sendEmail(
          customer.email,
          `Payment Confirmed for Order ${order.id}`,
          `
            <h2>Payment Confirmed - Order ${order.id}</h2>
            <p>Dear ${customer.username},</p>
            <p>Your payment for the AgriCare product has been confirmed successfully.</p>
            <p><strong>Order Details:</strong></p>
            <ul>
              <li>Product: ${product?.name}</li>
              <li>Quantity: ${order.items[0].quantity}</li>
              <li>Subtotal: ₹${order.subtotal}</li>
              <li>Platform Fee (Service Charge): ₹${order.platformFee}</li>
              <li>Total Amount: ₹${order.amount}</li>
              <li>Order Status: Processing</li>
              <li>Payment Status: Paid</li>
            </ul>
            <p>Your order is being processed and will be delivered soon.</p>
            <p>Thank you for choosing E-Cardamom Connect!</p>
          `
        );
      } catch (emailError) {
        console.error('Error sending payment confirmation email to customer:', emailError);
      }
    }
    
    res.json({
      success: true,
      message: 'Payment verified and order updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Verify AgriCare payment error:', error);
    res.status(500).json({ message: 'Payment verification failed', error: error.message });
  }
});

export default router;