import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { sendBulkProductAcceptedEmail, sendBulkProductRejectedEmail } from "../utils/emailService.js";

const router = express.Router();

// Get all hub managers
router.get('/', async (req, res) => {
  try {
    res.json({ message: 'Hub Manager routes working' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hub stats
router.get('/stats', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { default: Product } = await import('../models/Product.js');
    const { default: Order } = await import('../models/Order.js');
    const { default: User } = await import('../models/User.js');
    
    // Get all products (hub manages all inventory)
    const products = await Product.find({});
    const totalInventory = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    
    // Get pending shipments (orders that are processing or shipped)
    const pendingShipments = await Order.countDocuments({ 
      status: { $in: ['Processing', 'Shipped'] } 
    });
    
    // Get registered farmers
    const registeredFarmers = await User.countDocuments({ role: 'farmer' });
    
    // Get active customers
    const activeCustomers = await User.countDocuments({ role: 'customer' });
    
    res.json({
      totalInventory,
      pendingShipments,
      registeredFarmers,
      activeCustomers
    });
  } catch (error) {
    console.error('Get hub stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hub inventory
router.get('/inventory', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;
    
    const { default: Product } = await import('../models/Product.js');
    
    let query = {
      // Exclude bulk products from general inventory - they have their own endpoint
      $or: [
        { type: { $exists: false } },
        { type: { $ne: 'Bulk' } }
      ]
    };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const products = await Product.find(query)
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      items: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get hub inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hub shipments
router.get('/shipments', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const { default: Order } = await import('../models/Order.js');
    
    let query = {};
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
    console.error('Get hub shipments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get hub farmers
router.get('/farmers', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const { default: User } = await import('../models/User.js');
    
    const farmers = await User.find({ role: 'farmer' })
      .select('username email phone profile createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments({ role: 'farmer' });
    
    res.json({
      items: farmers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get hub farmers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get bulk products assigned to hub
// Hub managers can see bulk products where nearestHub matches their hub name or hubId matches their assigned hub
router.get('/bulk-products', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;
    
    const { default: Product } = await import('../models/Product.js');
    const { default: Hub } = await import('../models/Hub.js');
    
    // Build query for bulk products
    let query = {
      type: 'Bulk'
    };
    
    // Only filter by hub if specifically requested (for individual hub manager views)
    // For general Hub Network view, don't filter by hub
    if ((req.query.hubName || req.query.forHub) && !req.query.forNetwork) {
      // Get hub name from user's profileData or query parameter
      const hubName = req.query.hubName || req.user.profileData?.assignedHub;
      
      // Find hub by name to get hubId
      let hubId = null;
      if (hubName) {
        const hub = await Hub.findOne({ name: hubName });
        hubId = hub?._id;
      }
      
      // Filter by hub - match either hubId or nearestHub name
      if (hubId) {
        query.hubId = hubId;
      } else if (hubName) {
        query.nearestHub = hubName;
      }
    }
    // If no hub filter requested or forNetwork=true, show all bulk products for network view
    
    // Filter by status if provided
    if (req.query.status) {
      query.bulkProductStatus = req.query.status;
    }
    
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { district: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    const products = await Product.find(query)
      .populate('user', 'username email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      items: products,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get bulk products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept bulk product (hub manager only)
router.post('/bulk-products/:productId/accept', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { productId } = req.params;
    
    const { default: Product } = await import('../models/Product.js');
    const { default: User } = await import('../models/User.js');
    
    const product = await Product.findById(productId).populate('user', 'username email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.type !== 'Bulk') {
      return res.status(400).json({ message: 'Only bulk products can be accepted/rejected' });
    }
    
    if (product.bulkProductStatus === 'accepted') {
      return res.status(400).json({ message: 'Product already accepted' });
    }
    
    // Update product status
    product.bulkProductStatus = 'accepted';
    product.hubReviewedAt = new Date();
    product.hubReviewedBy = req.user._id;
    
    // Calculate if advance payment is required (total value < 50000)
    const totalValue = product.price * product.stock;
    if (totalValue < 50000) {
      product.advancePayment.required = true;
      product.advancePayment.amount = totalValue * 0.1; // 10% advance
    }
    
    await product.save();
    
    // Send email notification to farmer
    if (product.user && product.user.email) {
      const productData = {
        name: product.name,
        grade: product.grade,
        stock: product.stock,
        price: product.price,
        hubName: product.nearestHub || 'Hub'
      };
      
      const emailResult = await sendBulkProductAcceptedEmail(
        product.user.email,
        product.user.username,
        productData
      );
      
      if (emailResult.success) {
        console.log(`✅ Acceptance email sent to farmer: ${product.user.email}`);
      } else {
        console.error(`❌ Failed to send acceptance email: ${emailResult.error}`);
      }
    }
    
    res.json({ 
      success: true,
      message: 'Bulk product accepted successfully',
      product,
      advancePaymentRequired: product.advancePayment.required,
      advancePaymentAmount: product.advancePayment.amount
    });
  } catch (error) {
    console.error('Accept bulk product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject bulk product (hub manager only)
router.post('/bulk-products/:productId/reject', requireAuth, requireRole('hub'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const { default: Product } = await import('../models/Product.js');
    const { default: User } = await import('../models/User.js');
    
    const product = await Product.findById(productId).populate('user', 'username email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.type !== 'Bulk') {
      return res.status(400).json({ message: 'Only bulk products can be accepted/rejected' });
    }
    
    if (product.bulkProductStatus === 'rejected') {
      return res.status(400).json({ message: 'Product already rejected' });
    }
    
    // Update product status
    product.bulkProductStatus = 'rejected';
    product.hubReviewedAt = new Date();
    product.hubReviewedBy = req.user._id;
    product.rejectionReason = reason.trim();
    
    await product.save();
    
    // Send email notification to farmer
    if (product.user && product.user.email) {
      const productData = {
        name: product.name,
        grade: product.grade,
        stock: product.stock,
        hubName: product.nearestHub || 'Hub',
        rejectionReason: reason.trim()
      };
      
      const emailResult = await sendBulkProductRejectedEmail(
        product.user.email,
        product.user.username,
        productData
      );
      
      if (emailResult.success) {
        console.log(`✅ Rejection email sent to farmer: ${product.user.email}`);
      } else {
        console.error(`❌ Failed to send rejection email: ${emailResult.error}`);
      }
    }
    
    res.json({ 
      success: true,
      message: 'Bulk product rejected successfully',
      product
    });
  } catch (error) {
    console.error('Reject bulk product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;