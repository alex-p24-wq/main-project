import mongoose from 'mongoose';

const diseasePredictionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: {
    type: String,
    required: true
  },
  predictedDisease: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  symptoms: [{
    type: String
  }],
  treatment: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Very High'],
    required: true
  },
  allPredictions: [{
    disease: String,
    confidence: Number
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
diseasePredictionSchema.index({ userId: 1, createdAt: -1 });
diseasePredictionSchema.index({ predictedDisease: 1 });
diseasePredictionSchema.index({ createdAt: -1 });

export default mongoose.model('DiseasePrediction', diseasePredictionSchema);