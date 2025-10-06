import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Certificate } from '../models/Certificate.js';

const router = Router();
const upload = multer();

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

async function uploadToPinata(fileBuffer: Buffer, fullName: string): Promise<{ cid: string, hash: string }> {
	// Use JWT token for authentication (primary method)
	const jwt = process.env.PINATA_JWT;
	
	if (!jwt) {
		throw new Error('Pinata JWT token not configured');
	}
	
	// Create metadata with full name
	const metadata = {
		fullName: fullName,
		uploadedAt: new Date().toISOString(),
	};
	
	// Combine file and metadata
	const form = new (await import('form-data')).default();
	form.append('file', fileBuffer, { filename: `${fullName.replace(/\s+/g, '_')}_certificate.pdf` });
	
	const pinataMetadata = JSON.stringify({ 
		name: `${fullName.replace(/\s+/g, '_')}_certificate.pdf`,
		keyvalues: {
			fullName: fullName,
			uploadedAt: new Date().toISOString()
		}
	});
	form.append('pinataMetadata', pinataMetadata);
	
	const options = JSON.stringify({ cidVersion: 1 });
	form.append('pinataOptions', options);
	
	const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
		method: 'POST',
		headers: { 
			'Authorization': `Bearer ${jwt}`
		},
		body: form as any,
	});
	
	if (!res.ok) {
		const errorText = await res.text();
		console.error('Pinata API error:', res.status, errorText);
		throw new Error(`Pinata upload failed: ${res.status} - ${errorText}`);
	}
	
	const data = await res.json() as any;
	const cid = data.IpfsHash || data.cid || data.hash;
	
	// Generate hash of the file for blockchain storage
	const hash = sha256Hex(fileBuffer);
	
	return { cid, hash };
}

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
	try {
		const { fullName, wallet } = req.body as any;
		const file = req.file;
		
		// Validate required fields
		if (!fullName || !wallet || !file) {
			return res.status(400).json({ error: 'fullName, wallet, and certificate file are required' });
		}

		// Upload certificate to IPFS
		const { cid, hash } = await uploadToPinata(file.buffer, fullName);
		
		// Store certificate metadata in MongoDB for tracking
		const doc = await Certificate.create({
			certificateId: `CERT-${Date.now()}`, // Generate a unique certificate ID
			fullName,
			hash,
			ipfsCid: cid,
			registrarWallet: wallet,
			status: 'uploaded_to_ipfs'
		});
		
		// Return data needed for frontend to handle blockchain registration
		return res.json({ 
			id: doc._id, 
			cid,
			hash,
			fullName,
			wallet,
			timestamp: Date.now(),
			message: 'Certificate uploaded to IPFS successfully. Ready for blockchain registration.',
			nextStep: 'Connect your Metamask wallet to register this certificate on the blockchain'
		});
	} catch (e: any) {
		console.error('Upload error:', e);
		return res.status(500).json({ error: e.message || 'Certificate upload failed' });
	}
});

// New endpoint for blockchain registration (to be called by frontend after Metamask connection)
router.post('/register-on-chain', async (req: Request, res: Response) => {
	try {
		const { cid, hash, fullName, wallet } = req.body as any;
		
		// Validate required fields
		if (!cid || !hash || !fullName || !wallet) {
			return res.status(400).json({ error: 'cid, hash, fullName, and wallet are required' });
		}
		
		// Update the certificate status to indicate it's ready for blockchain registration
		const doc = await Certificate.findOneAndUpdate(
			{ ipfsCid: cid },
			{ 
				status: 'ready_for_blockchain',
				registrarWallet: wallet
			},
			{ new: true }
		);
		
		if (!doc) {
			// If not found by CID, create a new record
			const newDoc = await Certificate.create({
				certificateId: `CERT-${Date.now()}`,
				fullName,
				hash,
				ipfsCid: cid,
				registrarWallet: wallet,
				status: 'ready_for_blockchain'
			});
			// Return the newly created document data
			return res.json({
				cid,
				hash,
				fullName,
				wallet,
				registryAddress: process.env.REGISTRY_ADDRESS,
				rpcUrl: process.env.RPC_URL,
				timestamp: Math.floor(Date.now() / 1000),
				message: 'Certificate ready for blockchain registration. Please connect your Metamask wallet to complete the process.'
			});
		}
		
		// Return data needed for frontend blockchain interaction
		return res.json({
			cid,
			hash,
			fullName,
			wallet,
			registryAddress: process.env.REGISTRY_ADDRESS,
			rpcUrl: process.env.RPC_URL,
			timestamp: Math.floor(Date.now() / 1000),
			message: 'Certificate ready for blockchain registration. Please connect your Metamask wallet to complete the process.'
		});
	} catch (e: any) {
		console.error('Blockchain registration preparation error:', e);
		return res.status(500).json({ error: e.message || 'Blockchain registration preparation failed' });
	}
});

export default router;