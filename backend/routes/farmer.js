import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import Product from "../models/Product.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateFarmerProductImage } from "../utils/imageValidation.js";
import { getLatestCardamomPrice } from "../utils/cardamomPriceScraper.js";

const router = express.Router();

// Configure Multer storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Basic sanity check
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Farmer routes working' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest cardamom prices (made public to prevent auth blockers)
router.get('/cardamom-prices', async (req, res) => {
  try {
    const prices = await getLatestCardamomPrice();
    
    if (!prices) {
      return res.status(500).json({ message: 'Failed to fetch cardamom prices' });
    }
    
    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Get cardamom prices error:', error);
    res.status(500).json({ message: 'Server error while fetching cardamom prices' });
  }
});

// Create product (farmer only) with optional image upload
router.post('/products', requireAuth, requireRole('farmer'), upload.single('image'), async (req, res) => {
  try {
    const { name, price, stock, grade, state, district, nearestHub, description, type } = req.body;
    if (!name || price == null || stock == null || !grade) {
      return res.status(400).json({ message: 'name, price, stock, grade are required' });
    }

    // Validate price and stock are positive numbers
    const priceNum = Number(price);
    const stockNum = Number(stock);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number greater than 0' });
    }
    
    // Different stock validation for bulk vs regular products
    const isBulkProduct = type === 'Bulk' || stockNum >= 20;
    
    if (isBulkProduct) {
      // Bulk products: minimum 20 kg
      if (isNaN(stockNum) || stockNum < 20) {
        return res.status(400).json({ message: 'Bulk products must have at least 20 kg stock' });
      }
    } else {
      // Regular products: 1-20 kg
      if (isNaN(stockNum) || stockNum < 1 || stockNum > 20) {
        return res.status(400).json({ message: 'Regular products stock must be between 1-20 kg' });
      }
    }

    // Validate grade
    if (!['Premium', 'Organic', 'Regular'].includes(grade)) {
      return res.status(400).json({ message: 'Grade must be Premium, Organic, or Regular' });
    }

    // Validate state and district if provided
    if (state && state.trim().length > 100) {
      return res.status(400).json({ message: 'State name is too long' });
    }
    if (district && district.trim().length > 100) {
      return res.status(400).json({ message: 'District name is too long' });
    }
    if (nearestHub && nearestHub.trim().length > 200) {
      return res.status(400).json({ message: 'Nearest hub name is too long' });
    }

    // Build image URL if file uploaded
    let imageUrl = undefined;
    if (req.file) {
      // Skip all validation - allow any image file
      
      // Build absolute URL so frontend can load from different origin
      const host = req.get('host');
      const protocol = req.protocol;
      imageUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      // Backward compatibility: allow URL string
      imageUrl = req.body.image.trim();
    }

    // Find hub ID by name for bulk products
    let hubId = undefined;
    if (isBulkProduct && nearestHub) {
      const { default: Hub } = await import('../models/Hub.js');
      const hub = await Hub.findOne({ name: nearestHub.trim() });
      if (hub) {
        hubId = hub._id;
      }
    }

    const product = await Product.create({
      user: req.user._id,
      name: name.trim(),
      type: type?.trim(),
      price: priceNum,
      stock: stockNum,
      grade,
      image: imageUrl,
      state: state?.trim(),
      district: district?.trim(),
      nearestHub: nearestHub?.trim(),
      hubId: hubId,
      description: description?.trim(),
    });

    res.status(201).json(product);
  } catch (error) {
    // Clean up any uploaded file if there was an error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error('Error cleaning up uploaded file after error:', unlinkErr);
      }
    }
    
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// List current farmer products
router.get('/products/mine', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('List my products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Product.findOneAndDelete({ _id: id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get farmer orders (orders containing farmer's products)
router.get('/orders', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Import Order model
    const { default: Order } = await import('../models/Order.js');
    
    // Find orders that contain products from this farmer
    const farmerProducts = await Product.find({ user: req.user._id }).select('_id');
    const productIds = farmerProducts.map(p => p._id);
    
    let query = { 'items.product': { $in: productIds } };
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .populate('customer', 'username email')
      .populate('items.product', 'name grade')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      items: orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get farmer orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get farmer stats
router.get('/stats', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { default: Order } = await import('../models/Order.js');
    
    // Get farmer's products
    const products = await Product.find({ user: req.user._id });
    const productIds = products.map(p => p._id);
    
    // Calculate stats
    const totalInventory = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalProducts = products.length;
    
    // Get orders containing farmer's products
    const orders = await Order.find({ 'items.product': { $in: productIds } });
    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
    
    // Calculate revenue (from delivered orders)
    const deliveredOrders = orders.filter(o => o.status === 'Delivered');
    const monthlyRevenue = deliveredOrders.reduce((sum, order) => {
      // Calculate revenue only from farmer's products in each order
      const farmerItems = order.items.filter(item => productIds.some(pid => pid.equals(item.product)));
      return sum + farmerItems.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
    }, 0);
    
    // Calculate average rating (mock for now)
    const averageRating = 4.8;
    
    res.json({
      totalInventory,
      totalProducts,
      pendingOrders,
      monthlyRevenue,
      averageRating,
      products: products.slice(0, 5) // Recent products
    });
  } catch (error) {
    console.error('Get farmer stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;