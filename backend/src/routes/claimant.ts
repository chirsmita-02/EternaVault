import { Router, Request, Response } from 'express';
import { Claim } from '../models/Claim.js';

const router = Router();

router.post('/submit', async (req: Request, res: Response) => {
	try {
		const { claimantId, certificateHash, policyId } = req.body as any;
		if (!claimantId || !certificateHash || !policyId) return res.status(400).json({ error: 'Missing fields' });
		// Create a claim with the new schema
		const claimData = {
			deceasedName: "Unknown", // This would need to be passed in the request
			fileHash: certificateHash,
			verified: false
		};
		const claim = await Claim.create(claimData);
		return res.json({ id: claim._id, verified: claim.verified });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

router.get('/status/:id', async (req: Request, res: Response) => {
	try {
		const claim = await Claim.findById(req.params.id);
		if (!claim) return res.status(404).json({ error: 'Not found' });
		return res.json({ verified: claim.verified, claim });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

export default router;