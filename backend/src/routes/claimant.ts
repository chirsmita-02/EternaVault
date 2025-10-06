import { Router, Request, Response } from 'express';
import { Claim } from '../models/Claim.js';

const router = Router();

router.post('/submit', async (req: Request, res: Response) => {
	try {
		const { claimantId, certificateHash, policyId } = req.body as any;
		if (!claimantId || !certificateHash || !policyId) return res.status(400).json({ error: 'Missing fields' });
		const claim = await Claim.create({ claimantId, certificateHash, policyId });
		return res.json({ id: claim._id, status: claim.status });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

router.get('/status/:id', async (req: Request, res: Response) => {
	try {
		const claim = await Claim.findById(req.params.id);
		if (!claim) return res.status(404).json({ error: 'Not found' });
		return res.json({ status: claim.status, claim });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

export default router;
