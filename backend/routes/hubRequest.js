import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, requireRole } from '../middleware/auth.js';
import HubRequest from '../models/HubRequest.js';
import Product from '../models/Product.js';
import Hub from '../models/Hub.js';
import User from '../models/User.js';

const router = express.Router();

// Get requests for the current hub user
router.get('/my-requests', requireAuth, requireRole('hub'), async (req, res) => {
    try {
        // Find the hub managed by this user
        const hub = await Hub.findOne({ registeredBy: req.user._id });
        if (!hub) {
            return res.status(404).json({ message: 'No hub associated with this account' });
        }

        const requests = await HubRequest.find({ hub: hub._id })
            .populate({
                path: 'orderRequest',
                populate: { path: 'customer', select: 'username email' }
            })
            .populate('requestedProduct')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Get hub requests error:', error);
        res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
    }
});

// Accept a request
router.post('/:id/accept', requireAuth, requireRole('hub'), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const hubRequest = await HubRequest.findById(id).session(session);

        if (!hubRequest) {
            throw new Error('Request not found');
        }

        if (hubRequest.status !== 'pending') {
            throw new Error('Request is not pending');
        }

        // Verify user owns the hub
        const hub = await Hub.findById(hubRequest.hub).session(session);
        if (!hub || hub.registeredBy.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized for this hub');
        }

        // Update HubRequest
        hubRequest.status = 'accepted';
        hubRequest.respondedBy = req.user._id;
        hubRequest.respondedAt = new Date();
        await hubRequest.save({ session });

        // Decrement Hub Stock
        const hubProduct = await Product.findById(hubRequest.requestedProduct).session(session);
        if (!hubProduct) {
            throw new Error('Product not found in hub');
        }

        if (hubProduct.stock < hubRequest.quantity) {
            throw new Error(`Insufficient stock. Available: ${hubProduct.stock}, Requested: ${hubRequest.quantity}`);
        }

        hubProduct.stock -= hubRequest.quantity;
        await hubProduct.save({ session });

        // Move to Admin Stock
        // Find an admin (system admin or specific one)
        // We'll pick the first admin found
        const admin = await User.findOne({ role: 'admin' }).session(session);
        if (!admin) {
            throw new Error('No admin account found to transfer stock to');
        }

        // Check if admin already has this product (same name, type, grade)
        // We treat existing products with null hubId or assigned to admin as admin stock
        let adminProduct = await Product.findOne({
            user: admin._id,
            name: hubProduct.name,
            grade: hubProduct.grade,
            type: hubProduct.type,
            hubId: null
        }).session(session);

        if (adminProduct) {
            adminProduct.stock += hubRequest.quantity;
            await adminProduct.save({ session });
        } else {
            // Create new product entry for admin
            await Product.create([{
                user: admin._id,
                name: hubProduct.name,
                type: hubProduct.type,
                grade: hubProduct.grade,
                price: hubProduct.price,
                stock: hubRequest.quantity,
                image: hubProduct.image,
                description: hubProduct.description,
                state: hubProduct.state,
                district: hubProduct.district,
                nearestHub: 'Admin Stock', // Indicator
                hubId: null
            }], { session });
        }

        await session.commitTransaction();

        res.json({
            success: true,
            message: 'Request accepted and stock transferred to Admin'
        });

    } catch (error) {
        await session.abortTransaction();
        console.error('Accept request error:', error);
        const status = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(status).json({ message: error.message });
    } finally {
        session.endSession();
    }
});

// Reject a request
router.post('/:id/reject', requireAuth, requireRole('hub'), async (req, res) => {
    try {
        const { id } = req.params;
        const hubRequest = await HubRequest.findById(id);

        if (!hubRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Verify user owns the hub
        const hub = await Hub.findById(hubRequest.hub);
        if (!hub || hub.registeredBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this hub' });
        }

        if (hubRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request is not pending' });
        }

        hubRequest.status = 'rejected';
        hubRequest.respondedBy = req.user._id;
        hubRequest.respondedAt = new Date();
        await hubRequest.save();

        res.json({ success: true, message: 'Request rejected' });
    } catch (error) {
        console.error('Reject request error:', error);
        res.status(500).json({ message: 'Failed to reject request', error: error.message });
    }
});

export default router;
