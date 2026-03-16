import mongoose from 'mongoose';

const HubRequestSchema = new mongoose.Schema({
    orderRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrderRequest',
        required: true
    },
    hub: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hub',
        required: true
    },
    // The specific product batch requested from this hub
    requestedProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    respondedAt: {
        type: Date
    },
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for efficient queries
HubRequestSchema.index({ hub: 1, status: 1 });
HubRequestSchema.index({ orderRequest: 1 });

const HubRequest = mongoose.model('HubRequest', HubRequestSchema);

export default HubRequest;
