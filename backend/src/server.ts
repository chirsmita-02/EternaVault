import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'SET' : 'NOT SET');
console.log('RPC_URL:', process.env.RPC_URL ? 'SET' : 'NOT SET');
console.log('REGISTRY_ADDRESS:', process.env.REGISTRY_ADDRESS ? 'SET' : 'NOT SET');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Import routes after app initialization to avoid circular dependencies
import router from './routes/index.js';
app.use('/api', router);

// Health endpoint (before 404 handler)
app.get('/health', (_req: Request, res: Response) => {
  console.log('Health endpoint called');
  res.json({ ok: true });
});

// Add debug middleware (only for unmatched routes)
app.use((req, res, next) => {
  console.log(`=== DEBUG MIDDLEWARE ===`);
  console.log(`Received ${req.method} request to ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('========================');
  next();
});

// Add 404 handler (must be last)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
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
  
  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

start().catch((err: any) => {
	console.error('Startup error:', err);
	process.exit(1);
});