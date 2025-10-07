import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Claim } from '../models/Claim.js';
import { Certificate } from '../models/Certificate.js';

const router = Router();
const upload = multer();

console.log('Insurer route loaded'); // Debug log

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

// Enhanced verification endpoint with better error handling and timeout
router.post('/verify', upload.single('file'), async (req: Request, res: Response) => {
	try {
		console.log('Verify endpoint called'); // Debug log
		const file = req.file;
		const { claimantName, deceasedName } = req.body as any;
		
		if (!file) return res.status(400).json({ error: 'File is required' });
		if (!deceasedName) return res.status(400).json({ error: 'Deceased name is required' });

		// Compute SHA-256 hash of the uploaded file
		const localHash = sha256Hex(file.buffer);
		console.log('Computed local hash:', localHash);
		
		// Initialize blockchain verification result
		let onchainData = {
			exists: false,
			ipfsCid: "",
			registrar: "",
			timestamp: 0
		};
		
		// Fetch blockchain data using the smart contract with timeout handling
		if (process.env.RPC_URL && process.env.REGISTRY_ADDRESS) {
			try {
				console.log('Connecting to blockchain with RPC:', process.env.RPC_URL);
				console.log('Using contract address:', process.env.REGISTRY_ADDRESS);
				
				// Create provider with timeout settings
				const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, undefined, {
					polling: false,
					cacheTimeout: 5000, // 5 second cache timeout
				});
				
				const abi = [
					"function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
				];
				
				const contract = new ethers.Contract(process.env.REGISTRY_ADDRESS!, abi, provider);
				
				// Set a timeout for the blockchain call
				const blockchainCallTimeout = new Promise((resolve) => {
					setTimeout(() => {
						console.log('Blockchain call timed out after 10 seconds');
						resolve(null);
					}, 10000); // 10 second timeout
				});
				
				// Ensure the hash is properly formatted as bytes32
				const formattedHash = '0x' + localHash;
				console.log('Calling verifyCertificate with formatted hash:', formattedHash);
				
				if (typeof contract.verifyCertificate === 'function') {
					const blockchainCall = contract.verifyCertificate(formattedHash);
					
					// Add error handling for the blockchain call itself
					const wrappedBlockchainCall = blockchainCall.catch((error: any) => {
						console.error('Blockchain call failed:', error);
						return null;
					});
					
					const result = await Promise.race([wrappedBlockchainCall, blockchainCallTimeout]);
					console.log('Blockchain result:', result);
					
					if (result !== null) {
						// Parse the result from the smart contract
						const resultArray = result as any[];
						onchainData = {
							exists: Array.isArray(resultArray) ? Boolean(resultArray[0]) : Boolean(result),
							ipfsCid: Array.isArray(resultArray) ? resultArray[1] : "",
							registrar: Array.isArray(resultArray) ? resultArray[2] : "",
							timestamp: Array.isArray(resultArray) ? Number(resultArray[3]) : 0
						};
						console.log('Parsed onchain data:', onchainData);
					} else {
						// Timeout occurred
						console.warn('Blockchain verification timed out');
					}
				} else {
					console.error('verifyCertificate is not a function on contract');
				}
			} catch (blockchainError: any) {
				console.error('Blockchain verification error:', blockchainError);
				// Continue with verification but mark blockchain data as unavailable
				// Return specific error if it's a timeout
				if (blockchainError.code === 'TIMEOUT') {
					return res.status(408).json({ 
						error: 'Blockchain connection timeout. Please try again later.',
						details: 'The blockchain network is currently slow or unavailable.'
					});
				}
			}
		} else {
			console.warn('Blockchain verification skipped: Missing RPC_URL or REGISTRY_ADDRESS');
		}

		// Compare hashes and determine verification status
		const isVerified = onchainData.exists;
		console.log('Verification result - isVerified:', isVerified);
		
		// Save verification status in MongoDB
		try {
			// Create a claim record with verification status
			const claimData = {
				deceasedName: deceasedName,
				fileHash: localHash,
				verified: isVerified,
				verificationDate: new Date(),
				onchainData: isVerified ? onchainData : null
			};
			
			const claim = await Claim.create(claimData);
			console.log('Verification status saved to MongoDB:', claim._id);
		} catch (dbError) {
			console.warn('Could not save verification status to MongoDB:', dbError);
		}
		
		// Prepare response with detailed verification information
		const response = {
			verified: isVerified,
			localHash,
			onchainData,
			deceasedName,
			timestamp: Date.now(),
			message: isVerified 
				? "✅ Verified: File hash matches blockchain record." 
				: "❌ Not Verified: Mismatch or no record found. This may be because the certificate hasn't been registered on the blockchain yet."
		};

		console.log('Sending response:', response);
		return res.json(response);
	} catch (e: any) {
		console.error('Verification error:', e);
		return res.status(500).json({ error: e.message || 'Verification failed' });
	}
});

// New endpoint to fetch all registered certificates
router.get('/certificates', async (req: Request, res: Response) => {
	try {
		console.log('Certificates endpoint called'); // Debug log
		// Fetch certificates that are registered on chain
		const certificates = await Certificate.find({ status: 'registered_on_chain' }).sort({ createdAt: -1 });
		
		return res.json({
			certificates: certificates.map(cert => ({
				id: cert._id,
				certificateId: cert.certificateId,
				fullName: cert.fullName,
				hash: cert.hash,
				ipfsCid: cert.ipfsCid,
				registrarWallet: cert.registrarWallet,
				createdAt: cert.createdAt,
				status: cert.status
			}))
		});
	} catch (e: any) {
		console.error('Fetch certificates error:', e);
		return res.status(500).json({ error: e.message || 'Failed to fetch certificates' });
	}
});

// New endpoint to get detailed blockchain data for a specific certificate
router.get('/certificate/:hash', async (req: Request, res: Response) => {
	try {
		console.log('Certificate details endpoint called'); // Debug log
		const { hash } = req.params;
		
		if (!hash) {
			return res.status(400).json({ error: 'Certificate hash is required' });
		}
		
		// Get certificate from database
		const cert = await Certificate.findOne({ hash: hash });
		if (!cert) {
			return res.status(404).json({ error: 'Certificate not found in database' });
		}
		
		// Initialize blockchain data
		let blockchainData = {
			exists: false,
			ipfsCid: "",
			registrar: "",
			timestamp: 0,
			blockTimestamp: 0
		};
		
		// Fetch blockchain data
		if (process.env.RPC_URL && process.env.REGISTRY_ADDRESS) {
			try {
				const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
				const abi = [
					"function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
				];
				
				const contract = new ethers.Contract(process.env.REGISTRY_ADDRESS!, abi, provider);
				if (typeof contract.verifyCertificate === 'function') {
					// Ensure the hash is properly formatted as bytes32
					const formattedHash = '0x' + hash;
					const result = await contract.verifyCertificate(formattedHash);
					
					const resultArray = result as any[];
					blockchainData = {
						exists: resultArray[0],
						ipfsCid: resultArray[1],
						registrar: resultArray[2],
						timestamp: Number(resultArray[3]),
						blockTimestamp: Number(resultArray[3])
					};
				} else {
					console.error('verifyCertificate is not a function on contract');
				}
			} catch (blockchainError: any) {
				console.error('Blockchain fetch error:', blockchainError);
				return res.status(500).json({ 
					error: 'Failed to fetch data from blockchain',
					details: blockchainError.message
				});
			}
		}
		
		// Prepare response
		const response = {
			databaseData: {
				id: cert._id,
				certificateId: cert.certificateId,
				fullName: cert.fullName,
				hash: cert.hash,
				ipfsCid: cert.ipfsCid,
				registrarWallet: cert.registrarWallet,
				createdAt: cert.createdAt,
				status: cert.status
			},
			blockchainData,
			consistencyCheck: {
				ipfsCidMatch: cert.ipfsCid === blockchainData.ipfsCid,
				registrarMatch: cert.registrarWallet.toLowerCase() === blockchainData.registrar.toLowerCase()
			}
		};
		
		return res.json(response);
	} catch (e: any) {
		console.error('Certificate details error:', e);
		return res.status(500).json({ error: e.message || 'Failed to fetch certificate details' });
	}
});

export default router;