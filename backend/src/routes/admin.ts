import { Router, Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = Router();

// List users, optionally filtered by role
router.get('/users', async (req: Request, res: Response) => {
  try {
    console.log('Admin users endpoint called');
    console.log('Request headers:', req.headers);
    console.log('Authorization header:', req.headers.authorization);
    console.log('Query parameters:', req.query);
    
    const { role } = req.query as { role?: string };
    const filter: any = { status: { $ne: 'removed' } }; // Exclude removed users by default
    if (role) filter.role = role;
    
    console.log('Admin users endpoint called with filter:', filter);
    
    // Return full docs; frontend will pick required fields
    const users = await User.find(filter);
    
    console.log(`Found ${users.length} users matching filter`);
    if (users.length > 0 && users[0]) {
      console.log('First user sample:', {
        id: users[0]._id,
        name: users[0].name,
        email: users[0].email,
        role: users[0].role,
        status: users[0].status
      });
    }
    
    console.log('Sending response with users:', users.length);
    return res.json({ users });
  } catch (error: any) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// Delete user by id (set status to removed instead of actual deletion)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await User.findByIdAndUpdate(id, { status: 'removed' }, { new: true });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    return res.json({ message: 'User removed successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to remove user' });
  }
});

// Test route to check database connection
router.get('/test-db', async (req: Request, res: Response) => {
  try {
    console.log('Test DB route called');
    const userCount = await User.countDocuments();
    const users = await User.find().limit(5);
    console.log(`Total users in DB: ${userCount}`);
    return res.json({ 
      message: 'Database connection successful',
      userCount,
      sampleUsers: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status
      }))
    });
  } catch (error: any) {
    console.error('Test DB error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Admin-specific authentication middleware
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Admin auth middleware called');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log('Token from header:', token ? 'present' : 'missing');

    if (!token) {
      console.log('No token provided, returning 401');
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    console.log('Token verified, decoded:', decoded);
    
    // If we have a MongoDB connection, check if user still exists and is active
    if (mongoose.connection.readyState === 1) {
      const { User } = await import('../models/User.js');
      const user = await User.findById(decoded.sub);
      
      console.log('User lookup result:', user ? 'found' : 'not found');
      
      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (user.status === 'removed') {
        console.log('User account removed');
        return res.status(401).json({ error: 'Account has been removed' });
      }
      
      // Check if user is admin
      if (decoded.role !== 'admin') {
        console.log('User is not admin, role:', decoded.role);
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
    }
    
    // Add user info to request
    (req as any).user = decoded;
    console.log('Admin auth successful');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export default router;