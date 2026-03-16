import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import OrderRequest from '../models/OrderRequest.js';
import HubRequest from '../models/HubRequest.js';
import Product from '../models/Product.js';

const router = express.Router();

// Customer: Create a new order request
router.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const {
      productType,
      grade,
      quantity,
      budgetMin,
      budgetMax,
      urgency,
      preferredHub,
      description,
      contactPhone,
      contactEmail
    } = req.body;

    // Validation
    if (!grade || !quantity || !budgetMin || !budgetMax || !preferredHub || !description) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (budgetMin > budgetMax) {
      return res.status(400).json({ message: 'Maximum budget must be greater than minimum budget' });
    }

    // Create order request
    const orderRequest = await OrderRequest.create({
      customer: req.user._id,
      customerName: req.user.username,
      customerEmail: contactEmail || req.user.email,
      customerPhone: contactPhone || req.user.phone,
      productType: productType || 'Cardamom',
      grade,
      quantity,
      budgetMin,
      budgetMax,
      urgency: urgency || 'normal',
      preferredHub,
      description,
      status: 'pending'
    });

    console.log(`✅ Order request created: ${orderRequest._id} by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Order request submitted successfully! Hub managers will review your request.',
      data: orderRequest
    });
  } catch (error) {
    console.error('Create order request error:', error);
    res.status(500).json({ message: 'Failed to create order request', error: error.message });
  }
});

// Customer: Get own order requests
router.get('/my-requests', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { customer: req.user._id };
    if (status) {
      filter.status = status;
    }

    const [requests, total] = await Promise.all([
      OrderRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OrderRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// Admin: Get all order requests (optionally filtered by hub)
router.get('/admin-requests', requireAuth, requireRole('admin'), async (req, res) => {
  console.log('🔍 Admin requests accessed by user:', req.user.username, 'Role:', req.user.role);

  try {
    const { status, preferredHub, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (preferredHub) {
      filter.preferredHub = preferredHub;
    }

    const [requests, total] = await Promise.all([
      OrderRequest.find(filter)
        .populate('customer', 'username email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OrderRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get admin requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// DEPRECATED: Hub Manager endpoint - kept for backward compatibility
// Use /admin-requests instead
router.get('/hub-requests', requireAuth, async (req, res) => {
  console.log('🔍 Hub requests accessed by user:', req.user.username, 'Role:', req.user.role);
  console.log('⚠️  WARNING: /hub-requests is deprecated. Use /admin-requests instead.');

  // Only allow admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Customer product requests are now managed by administrators only.'
    });
  }

  try {
    const { status, preferredHub, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (preferredHub) {
      filter.preferredHub = preferredHub;
    }

    const [requests, total] = await Promise.all([
      OrderRequest.find(filter)
        .populate('customer', 'username email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      OrderRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get hub requests error:', error);
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
});

// Admin: Update request status (accept/reject/complete)
router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res) => {
  console.log('🔍 Status update accessed by user:', req.user.username, 'Role:', req.user.role);
  try {
    const { id } = req.params;
    const { status, message } = req.body;

    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const orderRequest = await OrderRequest.findById(id);
    if (!orderRequest) {
      return res.status(404).json({ message: 'Order request not found' });
    }

    orderRequest.status = status;
    orderRequest.hubResponse = {
      message: message || `Request ${status}`,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    await orderRequest.save();

    await orderRequest.save();

    console.log(`✅ Order request ${id} status updated to ${status} by ${req.user.username}`);

    // If request is accepted, find suitable hubs and send requests
    if (status === 'accepted') {
      try {
        // Find products matching criteria with sufficient stock
        const matchingProducts = await Product.find({
          $or: [
            { type: orderRequest.productType },
            { name: { $regex: new RegExp(orderRequest.productType, 'i') } }
          ],
          grade: orderRequest.grade === 'Any' ? { $exists: true } : orderRequest.grade,
          stock: { $gte: orderRequest.quantity },
          hubId: { $exists: true, $ne: null }
        }).populate('hubId');

        console.log(`Found ${matchingProducts.length} suitable products/hubs`);

        const hubRequests = [];
        for (const product of matchingProducts) {
          // Check if we already sent a request to this hub for this order
          const existingRequest = await HubRequest.findOne({
            orderRequest: orderRequest._id,
            hub: product.hubId._id
          });

          if (!existingRequest) {
            const hubRequest = await HubRequest.create({
              orderRequest: orderRequest._id,
              hub: product.hubId._id,
              requestedProduct: product._id,
              quantity: orderRequest.quantity,
              status: 'pending'
            });
            hubRequests.push(hubRequest);
          }
        }

        console.log(`Created ${hubRequests.length} hub requests`);
      } catch (err) {
        console.error('Error creating hub requests:', err);
        // Don't fail the response if this background task fails, but maybe log it well
      }
    }

    res.json({
      success: true,
      message: `Order request ${status} successfully`,
      data: orderRequest
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ message: 'Failed to update request status', error: error.message });
  }
});

// Get single order request by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const orderRequest = await OrderRequest.findById(id)
      .populate('customer', 'username email phone')
      .populate('hubResponse.respondedBy', 'username email');

    if (!orderRequest) {
      return res.status(404).json({ message: 'Order request not found' });
    }

    // Check authorization
    const isCustomer = req.user.role === 'customer' && orderRequest.customer._id.toString() === req.user._id.toString();
    const isHubOrAdmin = ['hub', 'admin'].includes(req.user.role);

    if (!isCustomer && !isHubOrAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      data: orderRequest
    });
  } catch (error) {
    console.error('Get order request error:', error);
    res.status(500).json({ message: 'Failed to fetch order request', error: error.message });
  }
});

// Customer: Delete own request (only if pending)
router.delete('/:id', requireAuth, requireRole('customer'), async (req, res) => {
  try {
    const { id } = req.params;

    const orderRequest = await OrderRequest.findOne({
      _id: id,
      customer: req.user._id
    });

    if (!orderRequest) {
      return res.status(404).json({ message: 'Order request not found' });
    }

    if (orderRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete a request that has been processed' });
    }

    await orderRequest.deleteOne();

    console.log(`✅ Order request ${id} deleted by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Order request deleted successfully'
    });
  } catch (error) {
    console.error('Delete order request error:', error);
    res.status(500).json({ message: 'Failed to delete order request', error: error.message });
  }
});

// Debug endpoint to check current user info
router.get('/debug/current-user', requireAuth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
