import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import DiseasePrediction from '../models/DiseasePrediction.js';

const router = express.Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/disease-predictions';
    fs.mkdir(uploadDir, { recursive: true }).then(() => {
      cb(null, uploadDir);
    }).catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uuidv4()}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only!'));
    }
  }
});

// Disease database - Common cardamom diseases with symptoms
const DISEASE_DATABASE = {
  'healthy_cardamom': {
    name: 'Healthy Cardamom',
    description: 'Plant is healthy with no visible signs of disease',
    symptoms: ['Normal green leaves', 'No spots or lesions', 'Healthy growth'],
    treatment: 'Maintain current care practices',
    severity: 'None'
  },
  'leaf_spot_disease': {
    name: 'Leaf Spot Disease',
    description: 'Fungal infection causing brown/black spots on leaves',
    symptoms: ['Brown/black spots on leaves', 'Yellowing around spots', 'Leaf drop'],
    treatment: 'Apply fungicides like copper oxychloride, improve air circulation',
    severity: 'Moderate'
  },
  'rhizome_rot': {
    name: 'Rhizome Rot',
    description: 'Root and rhizome decay caused by fungal pathogens',
    symptoms: ['Wilting plants', 'Brown, mushy roots', 'Stunted growth'],
    treatment: 'Remove infected plants, apply fungicides, improve drainage',
    severity: 'High'
  },
  'chocolate_blight': {
    name: 'Chocolate Blight',
    description: 'Serious fungal disease affecting flowers and fruits',
    symptoms: ['Brown spots on leaves', 'Flower blight', 'Fruit rot'],
    treatment: 'Prune affected parts, apply systemic fungicides',
    severity: 'High'
  },
  'capsule_rot': {
    name: 'Capsule Rot',
    description: 'Disease affecting the fruit capsules of cardamom',
    symptoms: ['Water-soaked lesions on capsules', 'Premature fruit drop', 'Black fungal growth'],
    treatment: 'Remove affected fruits, apply fungicides, maintain hygiene',
    severity: 'High'
  },
  'root_wilt': {
    name: 'Root Wilt Disease',
    description: 'Vascular wilt caused by Fusarium and other pathogens',
    symptoms: ['Gradual wilting', 'Yellowing and drying of leaves', 'Brown streaks in stem'],
    treatment: 'Crop rotation, soil solarization, resistant varieties',
    severity: 'Very High'
  },
  'phylloplane_disease': {
    name: 'Phylloplane Disease',
    description: 'Algae growth on leaves reducing photosynthesis',
    symptoms: ['Gray-green patches on leaves', 'Reduced leaf shine', 'Premature leaf fall'],
    treatment: 'Improve ventilation, apply copper-based fungicides',
    severity: 'Low'
  }
};

// Mock AI prediction function (in real implementation, this would connect to ML model)
const predictDiseaseFromImage = async (imagePath) => {
  // In a real implementation, this would:
  // 1. Preprocess the image
  // 2. Call a trained ML model API
  // 3. Return confidence scores for each disease
  
  // For now, simulate AI prediction based on image characteristics
  // In a real system, you'd use TensorFlow.js, Python ML API, or cloud ML service
  
  // Simulate different disease probabilities based on common visual cues
  const diseases = Object.keys(DISEASE_DATABASE);
  const predictions = diseases.map(disease => ({
    disease: disease,
    confidence: Math.random() * 100 // Random confidence for simulation
  }));
  
  // Sort by confidence and return top prediction
  predictions.sort((a, b) => b.confidence - a.confidence);
  const topPrediction = predictions[0];
  
  // For demo purposes, let's make it more realistic by basing prediction on some image analysis
  // In real implementation, you'd use actual computer vision techniques
  const simulatedDisease = diseases[Math.floor(Math.random() * diseases.length)];
  
  return {
    predictedDisease: simulatedDisease,
    confidence: Math.random() * 40 + 60, // 60-100% confidence
    allPredictions: predictions.slice(0, 3) // Top 3 predictions
  };
};

// Upload and predict disease
router.post('/predict', requireAuth, requireRole('farmer'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imagePath = req.file.path;

    // Perform disease prediction
    const predictionResult = await predictDiseaseFromImage(imagePath);

    const diseaseInfo = DISEASE_DATABASE[predictionResult.predictedDisease];

    // Save prediction record to database
    const predictionRecord = await DiseasePrediction.create({
      userId: req.user._id,
      image: `/uploads/disease-predictions/${req.file.filename}`, // Serve from static route
      predictedDisease: diseaseInfo.name,
      confidence: predictionResult.confidence,
      symptoms: diseaseInfo.symptoms,
      treatment: diseaseInfo.treatment,
      severity: diseaseInfo.severity,
      allPredictions: predictionResult.allPredictions.map(pred => ({
        disease: DISEASE_DATABASE[pred.disease]?.name || pred.disease,
        confidence: pred.confidence
      }))
    });

    res.json({
      success: true,
      data: {
        id: predictionRecord._id,
        predictedDisease: diseaseInfo.name,
        confidence: predictionResult.confidence,
        diseaseDetails: diseaseInfo,
        allPredictions: predictionResult.allPredictions.map(pred => ({
          disease: DISEASE_DATABASE[pred.disease]?.name || pred.disease,
          confidence: pred.confidence
        })),
        image: predictionRecord.image
      }
    });

  } catch (error) {
    console.error('Disease prediction error:', error);
    
    // Clean up uploaded file if prediction failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error cleaning up file:', unlinkErr);
      }
    }

    res.status(500).json({ 
      message: 'Disease prediction failed', 
      error: error.message 
    });
  }
});

// Get user's disease prediction history
router.get('/history', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [predictions, total] = await Promise.all([
      DiseasePrediction.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      DiseasePrediction.countDocuments({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      data: predictions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get prediction history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch prediction history', 
      error: error.message 
    });
  }
});

// Get specific prediction by ID
router.get('/:predictionId', requireAuth, requireRole('farmer'), async (req, res) => {
  try {
    const prediction = await DiseasePrediction.findOne({
      _id: req.params.predictionId,
      userId: req.user._id
    });

    if (!prediction) {
      return res.status(404).json({ message: 'Prediction not found' });
    }

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch prediction', 
      error: error.message 
    });
  }
});

export default router;