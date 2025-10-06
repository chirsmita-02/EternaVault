import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { Claim } from '../models/Claim.js';

const router = Router();

router.post('/approve/:id', async (req: Request, res: Response) => {
	try {
		const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
		return res.json(user);
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

router.get('/users', async (_req: Request, res: Response) => {
	const users = await User.find().lean();
	return res.json(users);
});

router.get('/claims', async (_req: Request, res: Response) => {
	const claims = await Claim.find().lean();
	return res.json(claims);
});

export default router;
