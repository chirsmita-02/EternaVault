import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
	try {
		const { fullName, name, email, password, role, department, company, orgAddress, phone, address, username } = req.body as any;
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
		
		const hash = await bcrypt.hash(password, 10);
		
		// Create user with role-specific information
		const userData: any = { 
			name: displayName, 
			email, 
			passwordHash: hash, 
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
		const { email, password } = req.body as any;
		console.log('Login attempt for email:', email);
		
		const user = await User.findOne({ email });
		if (!user) {
			console.log('User not found for email:', email);
			return res.status(401).json({ error: 'Invalid credentials' });
		}
		
		console.log('User found:', { email: user.email, role: user.role });
		const ok = await bcrypt.compare(password, user.passwordHash);
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