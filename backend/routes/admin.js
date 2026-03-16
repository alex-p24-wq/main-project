import express from "express";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Hub from "../models/Hub.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Feedback from "../models/Feedback.js";

const router = express.Router();

// All admin routes require admin role
router.use(requireAuth, requireRole('admin'));

// Health / summary
router.get('/', async (_req, res) => {
  try {
    const [users, products, orders, revenueResult] = await Promise.all([
      User.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({}),
      Order.aggregate([
        { $group: { _id: null, totalProfit: { $sum: "$platformFee" } } }
      ])
    ]);
    const revenue = revenueResult[0]?.totalProfit || 0;
    res.json({ message: 'Admin routes working', stats: { users, products, orders, revenue } });
  } catch (error) {
    console.error('Admin root error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users: list with optional role filter and pagination
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20, q } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ username: re }, { email: re }, { phone: re }];
    }
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).select('-password'),
      User.countDocuments(filter)
    ]);
    res.json({ items, total, page: parseInt(page, 10) || 1, limit: lim });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users: update role or basic fields
router.patch('/users/:id', async (req, res) => {
  try {
    // Prevent changing role of an admin user
    if ('role' in req.body) {
      const target = await User.findById(req.params.id).select('role');
      if (!target) return res.status(404).json({ message: 'User not found' });
      if (target.role === 'admin' && req.body.role !== 'admin') {
        return res.status(400).json({ message: 'Cannot change role of an admin user' });
      }
    }

    const allowed = ['role', 'phone', 'profileData'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products: list with search and pagination
router.get('/products', async (req, res) => {
  try {
    const { q, page = 1, limit = 20, userId } = req.query;
    const filter = {};
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { description: re }, { address: re }];
    }
    if (userId) filter.user = userId;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('user', 'username role'),
      Product.countDocuments(filter)
    ]);
    res.json({ items, total, page: parseInt(page, 10) || 1, limit: lim });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products: update fields (admin cannot change price if owner is a farmer)
router.patch('/products/:id', async (req, res) => {
  try {
    const allowed = ['name', 'price', 'stock', 'grade', 'image', 'address', 'description'];
    const incoming = {};
    for (const k of allowed) if (k in req.body) incoming[k] = req.body[k];

    // Load product + owner role to enforce price restriction
    const current = await Product.findById(req.params.id).populate('user', 'role');
    if (!current) return res.status(404).json({ message: 'Product not found' });

    const isFarmerOwner = String(current?.user?.role) === 'farmer';
    const update = { ...incoming };
    if (isFarmerOwner && 'price' in update) {
      // Block price change
      return res.status(400).json({ message: 'Admins cannot change price of farmer-owned products' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders: list with status filter
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, customerId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customerId) filter.customer = customerId;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;
    const [items, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('customer', 'username email'),
      Order.countDocuments(filter)
    ]);
    res.json({ items, total, page: parseInt(page, 10) || 1, limit: lim });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders: update status or paymentStatus (block changes if any product is deleted)
router.patch('/orders/:id', async (req, res) => {
  try {
    const allowed = ['status', 'paymentStatus', 'notes'];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];

    // Always validate product existence before any status change
    if ('status' in update) {
      const orderDoc = await Order.findById(req.params.id).select('items status');
      if (!orderDoc) return res.status(404).json({ message: 'Order not found' });

      // Block any status change if order is already Cancelled
      if (String(orderDoc.status) === 'Cancelled' && update.status !== 'Cancelled') {
        return res.status(400).json({ message: 'Cannot change status: order is cancelled' });
      }

      const productIds = (orderDoc.items || []).map(i => i.product).filter(Boolean);
      if (productIds.length) {
        const existingCount = await Product.countDocuments({ _id: { $in: productIds } });
        if (existingCount !== productIds.length) {
          return res.status(400).json({ message: 'Cannot change status: one or more products were deleted' });
        }
      }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order updated', order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users: get by id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users: create
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role = 'customer', phone, profileData } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'username, email, password are required' });
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(400).json({ message: 'User with same email or username already exists' });
    const user = await User.create({ username, email, password, role, phone, profileData });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json({ message: 'User created', user: safe });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Users: delete
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const target = await User.findById(userId).select('role');
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.role === 'admin') return res.status(400).json({ message: 'Cannot delete an admin user' });

    // Prevent delete if user has orders (to avoid orphan orders)
    const hasOrders = await Order.exists({ customer: userId });
    if (hasOrders) return res.status(400).json({ message: 'Cannot delete user with existing orders' });

    // Delete products owned by the user
    const deletedProducts = await Product.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted', deletedProducts: deletedProducts?.deletedCount || 0 });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products: get by id
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('user', 'username role');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products: create
router.post('/products', async (req, res) => {
  try {
    const { user: ownerId, name, price, stock, grade, image, address, description } = req.body;
    if (!ownerId || !name || price == null || stock == null || !grade) {
      return res.status(400).json({ message: 'user, name, price, stock, grade are required' });
    }
    const owner = await User.findById(ownerId);
    if (!owner) return res.status(400).json({ message: 'Owner user not found' });
    const product = await Product.create({ user: ownerId, name, price, stock, grade, image, address, description });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Products: delete (guard against active orders)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Block deletion if there are active (Pending/Processing) orders referencing this product
    const hasActiveOrders = await Order.exists({
      'items.product': product._id,
      status: { $in: ['Pending', 'Processing'] }
    });
    if (hasActiveOrders) {
      return res.status(400).json({
        message: 'Cannot delete product with active orders. Cancel or complete those orders first.'
      });
    }

    await Product.findByIdAndDelete(product._id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Feedback: list with filters and pagination
router.get('/feedback', async (req, res) => {
  try {
    const { role, category, minRating, maxRating, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (category) filter.category = category;
    if (minRating || maxRating) {
      filter.rating = {};
      if (minRating) filter.rating.$gte = Math.max(1, Number(minRating));
      if (maxRating) filter.rating.$lte = Math.min(5, Number(maxRating));
    }
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ subject: re }, { message: re }, { category: re }];
    }
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const [items, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(lim).populate('user', 'username email role'),
      Feedback.countDocuments(filter)
    ]);
    res.json({ items, total, page: parseInt(page, 10) || 1, limit: lim });
  } catch (error) {
    console.error('List feedback error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders: get by id
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'username email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Orders: delete
router.delete('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hub Stock Summary: Get bulk product stock summary by hub and grade
router.get('/hub-stock-summary', async (req, res) => {
  try {
    // Get all hubs
    const hubs = await Hub.find({}).sort({ district: 1, name: 1 });
    
    // Get all bulk products that are accepted
    const bulkProducts = await Product.find({
      type: 'Bulk',
      bulkProductStatus: 'accepted'
    }).populate('user', 'username role');
    
    // Group products by hub
    const productsByHub = {};
    bulkProducts.forEach(product => {
      const hubName = product.nearestHub;
      if (!hubName) return; // Skip products without a hub assignment
      if (!productsByHub[hubName]) {
        productsByHub[hubName] = [];
      }
      productsByHub[hubName].push(product);
    });
    
    // Calculate summary for each hub
    const hubSummaries = [];
    
    for (const hub of hubs) {
      const hubProducts = productsByHub[hub.name] || [];
      
      // Calculate grade-wise totals
      const gradeTotals = {
        Premium: { totalStock: 0, totalPrice: 0, count: 0 },
        Organic: { totalStock: 0, totalPrice: 0, count: 0 },
        Regular: { totalStock: 0, totalPrice: 0, count: 0 }
      };
      
      let totalStock = 0;
      let totalPrice = 0;
      
      hubProducts.forEach(product => {
        const grade = product.grade;
        if (grade && gradeTotals[grade]) {
          gradeTotals[grade].totalStock += product.stock;
          gradeTotals[grade].totalPrice += product.price * product.stock;
          gradeTotals[grade].count += 1;
        }
        totalStock += product.stock;
        totalPrice += product.price * product.stock;
      });
      
      hubSummaries.push({
        hubId: hub._id,
        hubName: hub.name,
        district: hub.district,
        state: hub.state,
        totalStock,
        totalPrice,
        productCount: hubProducts.length,
        gradeBreakdown: gradeTotals
      });
    }
    
    // Also calculate overall totals
    const overallTotals = {
      totalStock: hubSummaries.reduce((sum, h) => sum + h.totalStock, 0),
      totalPrice: hubSummaries.reduce((sum, h) => sum + h.totalPrice, 0),
      totalProducts: hubSummaries.reduce((sum, h) => sum + h.productCount, 0),
      totalHubs: hubSummaries.filter(h => h.productCount > 0).length, // Only count hubs with products
      gradeBreakdown: {
        Premium: {
          totalStock: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Premium.totalStock, 0),
          totalPrice: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Premium.totalPrice, 0),
          count: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Premium.count, 0)
        },
        Organic: {
          totalStock: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Organic.totalStock, 0),
          totalPrice: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Organic.totalPrice, 0),
          count: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Organic.count, 0)
        },
        Regular: {
          totalStock: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Regular.totalStock, 0),
          totalPrice: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Regular.totalPrice, 0),
          count: hubSummaries.reduce((sum, h) => sum + h.gradeBreakdown.Regular.count, 0)
        }
      }
    };
    
    res.json({
      hubs: hubSummaries,
      overall: overallTotals
    });
  } catch (error) {
    console.error('Hub stock summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;