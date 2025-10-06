import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { create as createIpfs } from 'ipfs-http-client';
import { ethers } from 'ethers';
import { Certificate } from '../models/Certificate.js';

const router = Router();
const upload = multer();

const ipfs = createIpfs({
	url: process.env.IPFS_ENDPOINT || 'https://ipfs.infura.io:5001/api/v0',
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore - allow conditional headers union
	headers: process.env.IPFS_PROJECT_ID && process.env.IPFS_PROJECT_SECRET ? {
		Authorization: 'Basic ' + Buffer.from(`${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`).toString('base64')
	} : undefined
});

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
	try {
		const { certificateId } = req.body as any;
		const file = req.file;
		const registrarWallet = (req.body as any).wallet || '';
		if (!file) return res.status(400).json({ error: 'file required' });

		const hash = sha256Hex(file.buffer);
		const ipfsRes = await ipfs.add(file.buffer as any);
		const ipfsCid = (ipfsRes as any).cid.toString();

		if (process.env.RPC_URL && process.env.REGISTRY_ADDRESS && process.env.DEPLOYER_PRIVATE_KEY) {
			const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
			const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
			const abi = [
				"function addCertificate(bytes32 certHash, string ipfsCid) public",
			];
			const contract = new ethers.Contract(process.env.REGISTRY_ADDRESS, abi, wallet) as any;
			const tx = await contract.addCertificate('0x' + hash, ipfsCid);
			await tx.wait();
		}

		const doc = await Certificate.create({ certificateId, hash, ipfsCid, registrarWallet, status: 'verified' });
		return res.json({ id: doc._id, hash, ipfsCid });
	} catch (e: any) {
		return res.status(500).json({ error: e.message });
	}
});

export default router;
