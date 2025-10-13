import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Log environment variables for debugging
console.log('=== SERVER STARTUP ===');
console.log('Environment variables loaded:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('RPC_URL:', process.env.RPC_URL ? 'SET' : 'NOT SET');
console.log('REGISTRY_ADDRESS:', process.env.REGISTRY_ADDRESS ? 'SET' : 'NOT SET');
console.log('PINATA_JWT:', process.env.PINATA_JWT ? 'SET' : 'NOT SET');
console.log('IPFS_PROJECT_ID:', process.env.IPFS_PROJECT_ID ? 'SET' : 'NOT SET');
console.log('IPFS_PROJECT_SECRET:', process.env.IPFS_PROJECT_SECRET ? 'SET' : 'NOT SET');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== AUTHENTICATE TOKEN MIDDLEWARE ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Full request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    console.log('Token decoded successfully:', decoded);
    
    // If we have a MongoDB connection, check if user still exists and is active
    if (mongoose.connection.readyState === 1) {
      const { User } = await import('./models/User.js');
      const user = await User.findById(decoded.sub);
      
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.status === 'removed') {
        console.log('User account removed');
        return res.status(401).json({ error: 'Account has been removed' });
      }
      
      // Check role-based access - allow all valid roles
      const validRoles = ['admin', 'claimant', 'registrar', 'insurer'];
      if (!validRoles.includes(decoded.role)) {
        console.log('Insufficient privileges, role:', decoded.role);
        return res.status(403).json({ error: 'Access denied. Insufficient privileges.' });
      }
    }
    
    // Add user info to request
    (req as any).user = decoded;
    console.log('Authentication successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Admin-specific authentication middleware
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    
    // If we have a MongoDB connection, check if user still exists and is active
    if (mongoose.connection.readyState === 1) {
      const { User } = await import('./models/User.js');
      const user = await User.findById(decoded.sub);
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.status === 'removed') {
        return res.status(401).json({ error: 'Account has been removed' });
      }
      
      // Check if user is admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
    }
    
    // Add user info to request
    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Import and apply admin routes with admin-specific authentication
import adminRouter from './routes/admin.js';
console.log('Registering admin routes'); // Debug log
app.use('/api/admin', authenticateAdmin, adminRouter);

// Import and apply claimant routes with general authentication
import claimantRouter from './routes/claimant.js';
console.log('Registering claimant routes'); // Debug log
app.use('/api/claimant', authenticateToken, claimantRouter);

// Import routes after app initialization to avoid circular dependencies
console.log('Importing main routes'); // Debug log
import router from './routes/index.js';
console.log('Applying main routes'); // Debug log
app.use('/api', router);

// Health endpoint (before debug middleware)
app.get('/health', (_req: Request, res: Response) => {
  console.log('Health endpoint called');
  res.json({ ok: true });
});

// Add debug middleware (before 404 handler)
app.use((req, res, next) => {
  console.log(`=== DEBUG MIDDLEWARE ===`);
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Params:`, req.params);
  console.log(`Query:`, req.query);
  console.log('Request headers:', req.headers);
  console.log('========================');
  next();
});

// Add 404 handler (must be last)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  console.log(`Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`Original URL: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found', method: req.method, url: req.url });
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || '';

async function start() {
  try {
    if (MONGO_URI) {
      console.log('Connecting to MongoDB Atlas...');
      await mongoose.connect(MONGO_URI);
      console.log('Connected to MongoDB Atlas successfully!');
    } else {
      console.log('No MONGO_URI provided');
      console.log('MongoDB connection is required for full functionality');
      // For testing purposes, we'll continue without MongoDB
      console.log('Continuing without MongoDB connection for testing...');
    }
  } catch (error: any) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    console.log('Continuing without MongoDB connection for testing...');
  }
  
  const server = app.listen(PORT, () => console.log(`API listening on :${PORT}`));
  console.log('Server startup completed');
}

start().catch((err: any) => {
	console.error('Startup error:', err);
	process.exit(1);
});