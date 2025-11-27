import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Certificate } from '../models/Certificate.js';

const router = Router();
console.log('Registrar routes loaded'); // Debug log

// Set file size limit to 10MB
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

async function uploadToPinata(fileBuffer: Buffer, fullName: string, maxRetries = 3): Promise<{ cid: string, hash: string }> {
	// Use JWT token for authentication (primary method)
	// Fallback to project ID and secret if JWT is not available
	const jwt = process.env.PINATA_JWT;
	const projectId = process.env.IPFS_PROJECT_ID;
	const projectSecret = process.env.IPFS_PROJECT_SECRET;
	
	if (!jwt && (!projectId || !projectSecret)) {
		throw new Error('Pinata credentials not configured. Please set either PINATA_JWT or IPFS_PROJECT_ID and IPFS_PROJECT_SECRET');
	}
	
	// Check file size
	if (fileBuffer.length > 10 * 1024 * 1024) { // 10MB limit
		throw new Error('File size exceeds 10MB limit');
	}
	
	// Generate hash first to check if file already exists
	const hash = sha256Hex(fileBuffer);
	
	// Try to check if file already exists on Pinata to avoid re-uploading
	try {
		const authHeader = jwt 
			? { 'Authorization': `Bearer ${jwt}` }
			: { 'Authorization': 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64') };
			
		const checkRes = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${hash}`, {
			headers: authHeader
		});
		
		if (checkRes.ok) {
			const checkData = await checkRes.json();
			if (checkData.rows && checkData.rows.length > 0) {
				// File already exists, return existing CID
				console.log('File already exists on IPFS, using existing CID');
				return { cid: checkData.rows[0].ipfs_pin_hash, hash };
			}
		}
	} catch (checkError) {
		console.log('Could not check if file exists, proceeding with upload');
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
			uploadedAt: new Date().toISOString(),
			fileHash: hash // Add file hash to metadata for easier lookup
		}
	});
	form.append('pinataMetadata', pinataMetadata);
	
	const options = JSON.stringify({ cidVersion: 1 });
	form.append('pinataOptions', options);
	
	// Retry mechanism for upload
	let lastError: any;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		console.log(`Upload attempt ${attempt}/${maxRetries}`);
		
		// Set timeout for the request
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
		
		try {
			const authHeader = jwt 
				? { 'Authorization': `Bearer ${jwt}` }
				: { 'Authorization': 'Basic ' + Buffer.from(`${projectId}:${projectSecret}`).toString('base64') };
				
			const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
				method: 'POST',
				headers: authHeader,
				body: form as any,
				signal: controller.signal as any
			});
			
			clearTimeout(timeoutId);
			
			if (!res.ok) {
				const errorText = await res.text();
				console.error('Pinata API error:', res.status, errorText);
				throw new Error(`Pinata upload failed: ${res.status} - ${errorText}`);
			}
			
			const data = await res.json() as any;
			const cid = data.IpfsHash || data.cid || data.hash;
			
			return { cid, hash };
		} catch (error: any) {
			clearTimeout(timeoutId);
			lastError = error;
			
			if (error.name === 'AbortError') {
				console.log(`Upload attempt ${attempt} timed out`);
				if (attempt === maxRetries) {
					throw new Error('Upload timeout after multiple attempts - please try again with a smaller file or better internet connection');
				}
			} else {
				console.log(`Upload attempt ${attempt} failed:`, error.message);
				if (attempt === maxRetries) {
					throw error;
				}
			}
			
			// Wait before retrying (exponential backoff)
			if (attempt < maxRetries) {
				await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
			}
		}
	}
	
	// If we reach here, all retries failed
	throw lastError;
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
    return res.status(500).json({ 
      error: e.message || 'Blockchain registration preparation failed',
      suggestion: 'Check your MetaMask connection and network settings'
    });
  }
});

// New endpoint to update certificate status after successful blockchain registration
router.post('/update-certificate-status', async (req: Request, res: Response) => {
  try {
    const { cid, txHash } = req.body as any;
    
    // Validate required fields
    if (!cid || !txHash) {
      return res.status(400).json({ error: 'cid and txHash are required' });
    }
    
    // Update the certificate status to indicate it's registered on chain
    const doc = await Certificate.findOneAndUpdate(
      { ipfsCid: cid },
      { 
        status: 'registered_on_chain',
        transactionHash: txHash
      },
      { new: true }
    );
    
    if (!doc) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    return res.json({
      success: true,
      message: 'Certificate status updated successfully',
      certificate: doc
    });
  } catch (e: any) {
    console.error('Certificate status update error:', e);
    return res.status(500).json({ 
      error: e.message || 'Failed to update certificate status',
      suggestion: 'Please try again later'
    });
  }
});

// Add profile endpoint for registrars
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // Get user ID from the authenticated token
    const userId = (req as any).user.sub;
    
    // Import User model
    const { User } = await import('../models/User.js');
    
    // Fetch user information from database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user profile information
    const profile = {
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      registrarInfo: user.registrarInfo
    };
    
    return res.json(profile);
  } catch (e: any) {
    console.error('Profile fetch error:', e);
    return res.status(500).json({ error: 'Failed to fetch profile information' });
  }
});

export default router;