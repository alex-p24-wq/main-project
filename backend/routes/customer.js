import express from "express";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { notifyProductSold, notifyLowStock } from "../utils/notifications.js";
import HubActivity from "../models/HubActivity.js";

const router = express.Router();

// Sanity check
router.get('/', async (_req, res) => {
  try {
    res.json({ message: 'Customer routes working' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: list products added by farmers (exclude bulk products)
// Optional query params: grade=Premium|Organic|Regular, q=search, limit, page
router.get('/products', async (req, res) => {
  try {
    const { grade, q, limit = 50, page = 1 } = req.query;

    const filter = {
      // Exclude bulk products - only show regular/domestic products to customers
      $or: [
        { type: { $exists: false } },
        { type: { $ne: 'Bulk' } }
      ]
    };
    if (grade && ["Premium", "Organic", "Regular"].includes(grade)) {
      filter.grade = grade;
    }
    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$and = [
        { $or: [
          { type: { $exists: false } },
          { type: { $ne: 'Bulk' } }
        ]},
        { $or: [
          { name: regex },
          { description: regex },
          { address: regex },
        ]}
      ];
      // Remove the top-level $or since we're using $and now
      delete filter.$or;
    }

    const lim = Math.min(parseInt(limit, 10) || 50, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim),
      Product.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: parseInt(page, 10) || 1,
      limit: lim,
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public: get a product by id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: list customer's own orders
// Query: status (optional), page, limit
router.get('/orders', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { customer: req.user._id };
    if (status) {
      const allowed = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });
      filter.status = status;
    }

    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const [orders, total, counts] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(lim),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { customer: req.user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const statusCounts = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

    res.json({
      items: orders,
      total,
      page: parseInt(page, 10) || 1,
      limit: lim,
      counts: {
        All: total,
        Pending: statusCounts['Pending'] || 0,
        Processing: statusCounts['Processing'] || 0,
        Shipped: statusCounts['Shipped'] || 0,
        Delivered: statusCounts['Delivered'] || 0,
        Cancelled: statusCounts['Cancelled'] || 0,
      }
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: get a single order by id (must belong to customer)
router.get('/orders/:id', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: create an order for a single product (Buy Now)
// body: { productId, quantity, shippingAddress?, notes?, paymentMethod? }
router.post('/orders', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { productId, quantity = 1, shippingAddress, notes, paymentMethod } = req.body || {};
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const qty = Math.max(1, Number(quantity) || 1);

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if ((product.stock || 0) < qty) return res.status(400).json({ message: 'Insufficient stock' });

    const subtotal = qty * (product.price || 0);
    // 5% platform fee calculation
    const platformFee = Number((subtotal * 0.05).toFixed(2));
    const amount = subtotal + platformFee;

    const order = await Order.create({
      customer: req.user._id,
      items: [{
        product: product._id,
        name: product.name,
        image: product.image,
        grade: product.grade,
        price: product.price,
        quantity: qty,
      }],
      subtotal,
      platformFee,
      amount,
      currency: 'INR',
      status: 'Pending',
      shippingAddress: shippingAddress || undefined,
      notes: notes || undefined,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'Pending',
    });

    // Decrement stock immediately to lock inventory and avoid shipping of deleted products
    const newStock = Math.max(0, (product.stock || 0) - qty);
    try {
      product.stock = newStock;
      await product.save();
    } catch (_) {}

    // Send notification to farmer about product sale
    try {
      const customer = await User.findById(req.user._id);
      await notifyProductSold(product.user, {
        orderId: order._id,
        productId: product._id,
        customerId: req.user._id,
        amount: amount,
        quantity: qty,
        productName: product.name,
        customerName: customer?.username || 'Customer'
      });

      // Record HubActivity for this sale so hubs can show sold product IDs per district
      try {
        await HubActivity.create({
          type: 'sold',
          state: product.state || 'Unknown',
          district: product.district || 'Unknown',
          nearestHub: product.nearestHub,
          product: product._id,
          order: order._id,
          farmer: product.user,
          customer: req.user._id,
          quantity: qty,
          amount: amount
        });
      } catch (e) {
        console.warn('Failed to record HubActivity:', e?.message || e);
      }

      // Check if stock is low and send low stock notification
      if (newStock <= 10 && newStock > 0) {
        await notifyLowStock(product.user, {
          productId: product._id,
          productName: product.name,
          stock: newStock
        });
      }
    } catch (notificationError) {
      console.error('Error sending farmer notifications:', notificationError);
      // Don't fail the order creation if notification fails
    }

    return res.status(201).json({ message: 'Order created', order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wishlist: get items
router.get('/wishlist', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ items: user?.wishlist || [] });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wishlist: add
router.post('/wishlist/:productId', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await User.updateOne(
      { _id: req.user._id },
      { $addToSet: { wishlist: product._id } }
    );

    const user = await User.findById(req.user._id).populate('wishlist');
    res.status(201).json({ message: 'Added to wishlist', items: user.wishlist });
  } catch (error) {
    console.error('Add wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wishlist: remove
router.delete('/wishlist/:productId', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { productId } = req.params;
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { wishlist: productId } }
    );
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ message: 'Removed from wishlist', items: user.wishlist });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Authenticated: cancel an order (only if Pending or Processing)
router.patch('/orders/:id/cancel', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['Pending', 'Processing'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }
    order.status = 'Cancelled';
    order.tracking = order.tracking || [];
    order.tracking.push({ status: 'Cancelled', message: 'Order cancelled by customer' });
    await order.save();
    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;