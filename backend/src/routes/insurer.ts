import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Claim } from '../models/Claim.js';

const router = Router();
const upload = multer();

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

router.post('/verify', upload.single('file'), async (req: Request, res: Response) => {
	try {
		const file = req.file;
		const { claimId } = req.body as any;
		if (!file) return res.status(400).json({ error: 'file required' });

		const localHash = sha256Hex(file.buffer);
		let onchainOk = false;
		if (process.env.RPC_URL && process.env.REGISTRY_ADDRESS) {
			const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
			const abi = [
				"function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
			];
			const contract = new ethers.Contract(process.env.REGISTRY_ADDRESS, abi, provider) as any;
			const result = await contract.verifyCertificate('0x' + localHash);
			onchainOk = Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
		}

		if (claimId) {
			await Claim.findByIdAndUpdate(claimId, { status: onchainOk ? 'approved' : 'rejected' });
		}
		return res.json({ hash: localHash, valid: onchainOk });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

export default router;
