import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { ethers } from 'ethers';
import { Claim } from '../models/Claim.js';
import { Certificate } from '../models/Certificate.js';
import mongoose from 'mongoose';

const router = Router();
const upload = multer();

console.log('Insurer route loaded'); // Debug log

function sha256Hex(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

function normalizeHash(hash: string) {
	return hash.toLowerCase().replace(/^0x/, '');
}

function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Enhanced verification endpoint with better error handling and timeout
router.post('/verify', upload.single('file'), async (req: Request, res: Response) => {
	try {
		console.log('Verify endpoint called'); // Debug log
		const file = req.file;
		const { claimantName, deceasedName } = req.body as any;
		
		if (!file) return res.status(400).json({ error: 'File is required' });
		if (!deceasedName) return res.status(400).json({ error: 'Deceased name is required' });
		if (!claimantName) return res.status(400).json({ error: 'Claimant name is required' });

		// Compute SHA-256 hash of the uploaded file
		const localHash = sha256Hex(file.buffer);
		console.log('Computed local hash:', localHash);
		
		// Build candidate hashes (uploaded hash + database hints)
		type CandidateSource = 'uploaded_file' | 'database_hash' | 'database_name' | 'database_ipfs' | 'manual_input';
		type CandidateInfo = {
			hash: string;
			sources: CandidateSource[];
			reasons: string[];
			dbDocs: any[];
		};
		
		const candidateMap = new Map<string, CandidateInfo>();
		const addCandidate = (rawHash: string, source: CandidateSource, reason: string, doc?: any) => {
			const normalized = normalizeHash(rawHash);
			if (!/^[0-9a-f]{64}$/.test(normalized)) return;
			if (!candidateMap.has(normalized)) {
				candidateMap.set(normalized, {
					hash: normalized,
					sources: [source],
					reasons: [reason],
					dbDocs: doc ? [doc] : []
				});
			} else {
				const entry = candidateMap.get(normalized)!;
				if (!entry.sources.includes(source)) entry.sources.push(source);
				entry.reasons.push(reason);
				if (doc) entry.dbDocs.push(doc);
			}
		};
		
		addCandidate(localHash, 'uploaded_file', 'Hash computed from uploaded file');
		
		// Query MongoDB for potential matches to speed up lookup
		let dbCertificates: any[] = [];
		try {
			const queryFilters: any[] = [{ hash: normalizeHash(localHash) }];
			if (deceasedName) {
				queryFilters.push({ fullName: { $regex: escapeRegex(deceasedName), $options: 'i' } });
			}
			if (req.body.certificateId) {
				queryFilters.push({ certificateId: req.body.certificateId });
			}
			if (req.body.ipfsCid) {
				queryFilters.push({ ipfsCid: req.body.ipfsCid });
			}
			
			if (queryFilters.length) {
				dbCertificates = await Certificate.find({ $or: queryFilters })
					.limit(25)
					.lean();
				
				for (const doc of dbCertificates) {
					const reasonParts = [];
					if (doc.hash === localHash) reasonParts.push('hash matches uploaded hash');
					if (doc.fullName?.toLowerCase() === deceasedName.toLowerCase()) reasonParts.push('full name match');
					if (req.body.ipfsCid && doc.ipfsCid === req.body.ipfsCid) reasonParts.push('IPFS CID match');
					if (req.body.certificateId && doc.certificateId === req.body.certificateId) reasonParts.push('certificateId match');
					
					const reason = reasonParts.length
						? `Certificate match (${reasonParts.join(', ')})`
						: 'Certificate match (fuzzy search)';
					
					addCandidate(doc.hash, 'database_hash', reason, doc);
				}
				console.log(`MongoDB candidate count: ${dbCertificates.length}`);
			}
		} catch (mongoLookupError) {
			console.warn('MongoDB lookup failed:', mongoLookupError);
		}
		
		const candidateList = Array.from(candidateMap.values());
		console.log('Candidate hashes to verify:', candidateList.map(c => c.hash));
		
		// Prepare blockchain provider/contract once
		let provider: ethers.JsonRpcProvider | null = null;
		let contract: ethers.Contract | null = null;
		if (process.env.RPC_URL && process.env.REGISTRY_ADDRESS) {
			try {
				provider = new ethers.JsonRpcProvider(process.env.RPC_URL, undefined, {
					polling: false,
					cacheTimeout: 5000
				});
				
				const abi = [
					"function verifyCertificate(bytes32 certHash) view returns (bool,string,address,uint256)"
				];
				contract = new ethers.Contract(process.env.REGISTRY_ADDRESS!, abi, provider);
			} catch (providerError) {
				console.error('Failed to initialise blockchain provider:', providerError);
			}
		} else {
			console.warn('Blockchain verification skipped: Missing RPC_URL or REGISTRY_ADDRESS');
		}
		
		const candidateResults: Array<{
			hash: string;
			formattedHash: string;
			exists: boolean;
			ipfsCid: string;
			registrar: string;
			timestamp: number;
			blockchainError?: string;
			sources: CandidateSource[];
			reasons: string[];
			dbDocs: any[];
		}> = [];
		
		if (provider && contract && typeof contract.verifyCertificate === 'function') {
			for (const candidate of candidateList) {
				const formattedHash = '0x' + candidate.hash;
				console.log('Checking candidate hash:', formattedHash, candidate.reasons.join('; '));
				
				const blockchainCall = contract.verifyCertificate(formattedHash);
				const timeoutPromise = new Promise((_resolve, reject) =>
					setTimeout(() => reject(new Error('Blockchain call timed out after 10 seconds')), 10000)
				);
				
				try {
					const result = await Promise.race([blockchainCall, timeoutPromise]);
					const resultArray = result as any[];
					candidateResults.push({
						hash: candidate.hash,
						formattedHash,
						exists: Boolean(resultArray?.[0]),
						ipfsCid: resultArray?.[1] || "",
						registrar: resultArray?.[2] || "",
						timestamp: Number(resultArray?.[3] || 0),
						sources: candidate.sources,
						reasons: candidate.reasons,
						dbDocs: candidate.dbDocs
					});
				} catch (candidateError: any) {
					console.error(`Blockchain verification failed for ${formattedHash}:`, candidateError);
					candidateResults.push({
						hash: candidate.hash,
						formattedHash,
						exists: false,
						ipfsCid: "",
						registrar: "",
						timestamp: 0,
						blockchainError: candidateError.message || candidateError.toString(),
						sources: candidate.sources,
						reasons: candidate.reasons,
						dbDocs: candidate.dbDocs
					});
				}
			}
		} else {
			for (const candidate of candidateList) {
				candidateResults.push({
					hash: candidate.hash,
					formattedHash: '0x' + candidate.hash,
					exists: false,
					ipfsCid: "",
					registrar: "",
					timestamp: 0,
					blockchainError: 'Blockchain provider not configured',
					sources: candidate.sources,
					reasons: candidate.reasons,
					dbDocs: candidate.dbDocs
				});
			}
		}
		
		// Determine final verification result
		const localCandidateResult = candidateResults.find(result => result.hash === normalizeHash(localHash));
		let primaryResult = localCandidateResult?.exists ? localCandidateResult : null;
		if (!primaryResult) {
			primaryResult = candidateResults.find(result => result.exists) || null;
		}
		
		const isVerified = Boolean(primaryResult && primaryResult.exists);
		const matchedHash = primaryResult?.hash || normalizeHash(localHash);
		const verificationPath: 'uploaded_file' | 'database_match' | 'none' = isVerified
			? (localCandidateResult?.exists ? 'uploaded_file' : 'database_match')
			: 'none';
		const onchainData = primaryResult
			? {
				exists: primaryResult.exists,
				ipfsCid: primaryResult.ipfsCid,
				registrar: primaryResult.registrar,
				timestamp: primaryResult.timestamp
			}
			: {
				exists: false,
				ipfsCid: "",
				registrar: "",
				timestamp: 0
			};
		
		console.log('Verification path:', verificationPath, 'Verified:', isVerified);
		const message = isVerified
			? (verificationPath === 'uploaded_file'
				? "✅ Verified: Uploaded file hash matches the on-chain record."
				: "✅ Verified using blockchain record found via database lookup. (Uploaded file differs from the registered document)")
			: "❌ Not Verified: Certificate hash not found on blockchain. This may mean the certificate is not registered or the file differs from the registered document.";
		
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
		
		// Save claimant data for tracking verification status
		try {
			const { ClaimantData } = await import('../models/ClaimantData.js');
			
			// Determine verification status
			const verificationStatus = isVerified ? 'Approved' : 'Pending';
			
			const claimantData = {
				claimantName: claimantName,
				deceasedName: deceasedName,
				verificationStatus: verificationStatus,
				certificateHash: matchedHash,
				ipfsCid: onchainData.ipfsCid,
				verifiedAt: isVerified ? new Date() : null,
				verifiedBy: onchainData.registrar || null
			};
			
			console.log('Saving claimant data:', claimantData);
			
			// Check if claimant data already exists
			const existingData = await ClaimantData.findOne({
				claimantName: claimantName,
				deceasedName: deceasedName,
				certificateHash: matchedHash
			});
			
			if (existingData) {
				// Update existing record
				const updatedData = await ClaimantData.findByIdAndUpdate(
					existingData._id,
					claimantData,
					{ new: true }
				);
				console.log('Updated claimant data:', updatedData?._id);
			} else {
				// Create new record
				const newData = await ClaimantData.create(claimantData);
				console.log('Created new claimant data:', newData._id);
				
				// Verify the collection was created
				let collectionExists = false;
				if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
				  try {
					const collections = await mongoose.connection.db.listCollections().toArray();
					collectionExists = collections.some((c: any) => c.name === 'claimantdatas');
				  } catch (err) {
					console.log('Could not list collections:', err);
				  }
				}
				console.log('Collection exists:', collectionExists);
			}
			
			// Verify the data was saved
			const savedCount = await ClaimantData.countDocuments();
			console.log(`Total claimant data records in database: ${savedCount}`);
		} catch (claimantError) {
			console.error('Could not save claimant data:', claimantError);
			// Log more detailed error information
			if (claimantError instanceof Error) {
				console.error('Error details:', {
					name: claimantError.name,
					message: claimantError.message,
					stack: claimantError.stack
				});
			}
		}
		
		// Prepare response with detailed verification information
		const response = {
			verified: isVerified,
			localHash,
			matchedHash,
			onchainData,
			candidateResults,
			dbMatches: dbCertificates.length,
			claimantName,
			deceasedName,
			timestamp: Date.now(),
			verificationSource: 'hybrid',
			verificationPath,
			message
		};

		console.log('Sending response:', response);
		return res.json(response);
	} catch (e: any) {
		console.error('Verification error:', e);
		return res.status(500).json({ 
			error: e.message || 'Verification failed',
			verificationSource: 'blockchain' // Added for consistency
		});
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
