import { Router, Request, Response } from 'express';
import { Claim } from '../models/Claim.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

const router = Router();

console.log('Claimant routes loaded'); // Debug log

// Move the search route to the beginning to avoid potential conflicts
// Search claims by claimant name and deceased name
router.get('/search', async (req: Request, res: Response) => {
  try {
    console.log('=== SEARCH ENDPOINT CALLED ==='); // Debug log
    const { claimantName, deceasedName } = req.query as { claimantName?: string; deceasedName?: string };
    
    console.log('Query parameters:', { claimantName, deceasedName }); // Debug log
    
    // Validate required parameters
    if (!claimantName || !deceasedName) {
      console.log('Missing required parameters'); // Debug log
      return res.status(400).json({ error: 'Both claimantName and deceasedName are required' });
    }
    
    console.log('Searching for claims:', { claimantName, deceasedName });
    
    // Fetch claimant data from the ClaimantData collection
    const { ClaimantData } = await import('../models/ClaimantData.js');
    
    // Build filter object with case-insensitive partial matching
    const filter = {
      claimantName: { $regex: claimantName, $options: 'i' },
      deceasedName: { $regex: deceasedName, $options: 'i' }
    };
    
    console.log('Search filter:', filter);
    
    // Find matching claims
    const claims = await ClaimantData.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found ${claims.length} matching claims`);
    console.log('Claims data:', claims.map(c => ({
      id: c._id,
      claimantName: c.claimantName,
      deceasedName: c.deceasedName,
      verificationStatus: c.verificationStatus
    })));
    
    return res.json({ claims });
  } catch (e: any) {
    console.error('Claims search error:', e);
    // Log more detailed error information
    if (e instanceof Error) {
      console.error('Error details:', {
        name: e.name,
        message: e.message,
        stack: e.stack
      });
    }
    return res.status(500).json({ error: 'Failed to search claims', details: e.message });
  }
});

// Test endpoint to verify database connection and data
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    console.log('Testing claimant database connection');
    
    // Fetch claimant data from the ClaimantData collection
    const { ClaimantData } = await import('../models/ClaimantData.js');
    
    // Check if collection exists
    let collectionExists = false;
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        collectionExists = collections.some((c: any) => c.name === 'claimantdatas');
      } catch (err) {
        console.log('Could not list collections:', err);
      }
    }
    
    // Count documents
    const count = await ClaimantData.countDocuments();
    
    // Get sample data
    const sample = await ClaimantData.find().limit(3).sort({ createdAt: -1 });
    
    console.log('Database test results:', { collectionExists, count });
    
    return res.json({ 
      message: 'Database connection successful',
      collectionExists,
      count,
      sample: sample.map(s => ({
        id: s._id,
        claimantName: s.claimantName,
        deceasedName: s.deceasedName,
        verificationStatus: s.verificationStatus,
        createdAt: s.createdAt
      }))
    });
  } catch (e: any) {
    console.error('Test connection error:', e);
    return res.status(500).json({ error: 'Database connection failed', details: e.message });
  }
});

// Get claimant profile information
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Get user ID from the authenticated token
    const userId = (req as any).user.sub;
    
    // Fetch user information from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user profile information
    const profile = {
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return res.json(profile);
  } catch (e: any) {
    console.error('Profile fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch profile information' });
  }
});

// Get all claims for the authenticated claimant with optional filtering
router.get('/claims', async (req: Request, res: Response) => {
  try {
    // Get user ID from the authenticated token
    const userId = (req as any).user.sub;
    
    // Fetch user information from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get query parameters for filtering
    const { deceasedName } = req.query as { deceasedName?: string };
    
    // Fetch claimant data from the new ClaimantData collection
    const { ClaimantData } = await import('../models/ClaimantData.js');
    
    // Build filter object
    const filter: any = {
      claimantName: user.name
    };
    
    // Add deceased name filter if provided
    if (deceasedName) {
      filter.deceasedName = { $regex: deceasedName, $options: 'i' }; // Case-insensitive partial match
    }
    
    // Find all claims for this claimant with optional filtering
    const claimantClaims = await ClaimantData.find(filter).sort({ createdAt: -1 });
    
    return res.json({ claims: claimantClaims });
  } catch (e: any) {
    console.error('Claims fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// Get a specific claim by ID
router.get('/claims/:id', async (req: Request, res: Response) => {
  try {
    const claimId = req.params.id;
    
    // Fetch claimant data from the new ClaimantData collection
    const { ClaimantData } = await import('../models/ClaimantData.js');
    
    // Find the specific claim
    const claim = await ClaimantData.findById(claimId);
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    return res.json({ claim });
  } catch (e: any) {
    console.error('Claim fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { claimantId, certificateHash, policyId } = req.body as any;
    if (!claimantId || !certificateHash || !policyId) return res.status(400).json({ error: 'Missing fields' });
    // Create a claim with the new schema
    const claimData = {
      deceasedName: "Unknown", // This would need to be passed in the request
      fileHash: certificateHash,
      verified: false,
      status: 'Pending'
    };
    const claim = await Claim.create(claimData);
    return res.json({ id: claim._id, verified: claim.verified, status: claim.status });
  } catch (e: any) {
    console.error('Claim submission error:', e);
    return res.status(500).json({ error: 'Failed to submit claim' });
  }
});

router.get('/status/:id', async (req: Request, res: Response) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    return res.json({ verified: claim.verified, status: claim.status, claim });
  } catch (e: any) {
    console.error('Claim status error:', e);
    return res.status(500).json({ error: 'Failed to fetch claim status' });
  }
});

export default router;