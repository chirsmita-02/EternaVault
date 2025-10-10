import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = Router();

console.log('Auth routes module loaded'); // Debug log

// Test endpoint to check server-side Mongoose operations
router.get('/test-mongoose', async (req: Request, res: Response) => {
  try {
    console.log('=== MONGOOSE TEST ENDPOINT CALLED ===');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    
    // Dynamically import the User model
    const { User } = await import('../models/User.js');
    
    // Check current user count
    const userCount = await User.countDocuments();
    console.log(`Current user count: ${userCount}`);
    
    // Try to create a test user
    console.log('Creating test user...');
    const timestamp = Date.now();
    const testUser = new User({
      name: 'Server Mongoose Test User',
      email: `server.mongoose.${timestamp}@example.com`,
      password: 'testpassword123',
      role: 'claimant',
      claimantInfo: {
        relationshipToDeceased: 'Self',
        phoneNumber: '1234567890',
        address: 'Test Address'
      }
    });
    
    console.log('Saving user...');
    const savedUser = await testUser.save();
    console.log('User saved:', savedUser.email);
    
    // Check updated user count
    const updatedCount = await User.countDocuments();
    console.log(`Updated user count: ${updatedCount}`);
    
    // Try to find the user
    console.log('Finding user by email...');
    const foundUser = await User.findOne({ email: testUser.email });
    console.log('Found user:', foundUser ? foundUser.email : 'NOT FOUND');
    
    // Clean up
    console.log('Cleaning up test user...');
    await User.findByIdAndDelete(savedUser._id);
    console.log('Test user removed');
    
    // Final count
    const finalCount = await User.countDocuments();
    console.log(`Final user count: ${finalCount}`);
    
    return res.json({ 
      message: 'Mongoose test completed',
      initialState: userCount,
      afterCreate: updatedCount,
      afterDelete: finalCount,
      userCreated: savedUser.email,
      userFound: !!foundUser
    });
  } catch (e: any) {
    console.error('Mongoose test error:', e);
    return res.status(500).json({ error: e.message || 'Mongoose test failed' });
  }
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    console.log('=== REGISTRATION ENDPOINT CALLED ===');
    console.log('Mongoose connection state:', mongoose.connection.readyState);
    console.log('Mongoose connection readyState:', mongoose.STATES);
    
    // Dynamically import the User model
    const { User } = await import('../models/User.js');
    
    const { fullName, name, email, password, role, department, company, orgAddress, phone, address, username } = req.body as any;
    console.log('=== REGISTRATION REQUEST RECEIVED ===');
    console.log('Registration request received:', { fullName, name, email, role, department, company, orgAddress, phone, address, username });
    
    // Use fullName if available, otherwise use name
    const displayName = fullName || name || 'User';
    
    // Validate required fields
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate role-specific required fields
    if (role === 'registrar' && (!displayName || !department || !username)) {
      console.log('Missing registrar fields:', { displayName: !!displayName, department: !!department, username: !!username });
      return res.status(400).json({ error: 'Full name, department, and username are required for registrar registration' });
    }
    
    if (role === 'insurer' && (!company || !username)) {
      console.log('Missing insurer fields:', { company: !!company, username: !!username });
      return res.status(400).json({ error: 'Company name and username are required for insurer registration' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Email already exists:', email);
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Store password without encryption
    const userData: any = { 
      name: displayName, 
      email, 
      password, // Store plain password
      role: role || 'claimant'  // default to claimant if no role specified
    };
    
    // Add role-specific information
    if (role === 'registrar') {
      userData.registrarInfo = {
        departmentName: department,
        employeeId: username,
        phoneNumber: phone
      };
      console.log('Registrar info:', userData.registrarInfo);
    } else if (role === 'insurer') {
      userData.insurerInfo = {
        companyName: company,
        licenseNumber: username,
        contactPerson: displayName,
        companyAddress: orgAddress
      };
      console.log('Insurer info:', userData.insurerInfo);
    } else if (role === 'claimant') {
      userData.claimantInfo = {
        relationshipToDeceased: "Self", // This would need to be collected in the form
        phoneNumber: phone,
        address: address
      };
    } else if (role === 'admin') {
      userData.adminInfo = {
        department: department || "Administration",
        employeeId: username,
        permissions: []
      };
    }
    
    console.log('Creating user with data:', userData);
    const user = await User.create(userData);
    console.log('User created:', user);
    
    // Verify the user was actually saved
    const savedUser = await User.findById(user._id);
    console.log('Verified saved user:', savedUser ? 'FOUND' : 'NOT FOUND');
    
    // Return user data along with success message
    return res.status(201).json({ 
      message: 'Registration successful', 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (e: any) {
    console.error('Registration error:', e);
    return res.status(500).json({ error: e.message || 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('=== LOGIN ENDPOINT CALLED ===');
    // Dynamically import the User model
    const { User } = await import('../models/User.js');
    
    const { email, password } = req.body as any;
    console.log('Login attempt for email:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is removed
    if (user.status === 'removed') {
      console.log('User account is removed:', email);
      return res.status(401).json({ error: 'Account has been removed' });
    }
    
    console.log('User found:', { email: user.email, role: user.role });
    // Compare plain passwords
    const ok = user.password === password;
    console.log('Password comparison result:', ok);
    
    if (!ok) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '1d' });
    console.log('Login successful for user:', email);
    
    return res.json({ 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return res.status(500).json({ error: e.message || 'Login failed' });
  }
});

export default router;