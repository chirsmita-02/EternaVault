import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
	try {
		const { name, email, password, role } = req.body as any;
		if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(409).json({ error: 'Email exists' });
		const hash = await bcrypt.hash(password, 10);
		const user = await User.create({ name, email, passwordHash: hash, role });
		return res.json({ id: user._id });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

router.post('/login', async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body as any;
		const user = await User.findOne({ email });
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });
		const ok = await bcrypt.compare(password, user.passwordHash);
		if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
		const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET || 'dev', { expiresIn: '1d' });
		return res.json({ token });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

export default router;
