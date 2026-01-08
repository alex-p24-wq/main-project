import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

const app = express();

// Resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'https://your-app.vercel.app',
      'http://localhost:5173', // Allow local development
      'http://localhost:5174', // Alternative local port
      'http://localhost:5175', // Alternative local port
      'http://localhost:5176', // Alternative local port
      'http://localhost:5177', // Alternative local port
      'http://localhost:3000'
    ]
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Check']
};
app.use(cors(corsOptions));
// Handle CORS preflight for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
import authRoutes from "./routes/auth.js";
import farmerRoutes from "./routes/farmer.js";
import customerRoutes from "./routes/customer.js";
import agriCareRoutes from "./routes/agricare.js";
import hubManagerRoutes from "./routes/hubmanager.js";
import adminRoutes from "./routes/admin.js";
import feedbackRoutes from "./routes/feedback.js";
import paymentRoutes from "./routes/payment.js";
import notificationRoutes from "./routes/notifications.js";
import hubRoutes from "./routes/hub.js";
import orderRequestRoutes from "./routes/orderRequest.js";
import Feedback from "./models/Feedback.js";
import { verifyEmailConfig } from "./utils/emailService.js";

app.use("/api/auth", authRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/agricare", agriCareRoutes);
app.use("/api/hubmanager", hubManagerRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/order-requests", orderRequestRoutes);

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'E-Cardamom Connect API',
    version: '1.0.0',
    status: 'running',
    message: 'Welcome to E-Cardamom Connect Backend API',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      farmer: '/api/farmer/*',
      customer: '/api/customer/*',
      admin: '/api/admin/*',
      hubs: '/api/hubs/*',
      feedback: '/api/feedback/*'
    },
    documentation: 'https://github.com/alex-p24-wq/E-Cardamom_connect',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Database connection initialization
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing database connection');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');

    // Ensure indexes for Feedback and OrderRequest are created
    try {
      await Feedback.init();
      console.log('✅ Feedback indexes ensured');
    } catch (e) {
      console.warn('⚠️ Could not ensure Feedback indexes:', e?.message || e);
    }

    try {
      const OrderRequest = (await import('./models/OrderRequest.js')).default;
      await OrderRequest.init();
      console.log('✅ OrderRequest indexes ensured');
    } catch (e) {
      console.warn('⚠️ Could not ensure OrderRequest indexes:', e?.message || e);
    }

    // Verify email configuration
    try {
      await verifyEmailConfig();
    } catch (e) {
      console.warn('⚠️ Email service verification failed:', e?.message || e);
    }
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

// Initialize database connection for serverless
connectDB().catch(err => console.error('DB connection error:', err));

// Traditional server startup (for local development or traditional hosting)
const startServer = async () => {
  try {
    await connectDB();
    
    const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

    const startListening = (port, attempt = 0) => {
      const server = app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
        console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🖼️ Serving uploads at /uploads`);
      });

      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE' && attempt < 5) {
          const nextPort = port + 1;
          console.warn(`⚠️ Port ${port} in use. Trying ${nextPort}...`);
          startListening(nextPort, attempt + 1);
        } else {
          console.error('❌ Failed to start server:', err);
          process.exit(1);
        }
      });
    };

    startListening(DEFAULT_PORT);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if not running in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  startServer();
}

// Export for Vercel serverless
export default app;
