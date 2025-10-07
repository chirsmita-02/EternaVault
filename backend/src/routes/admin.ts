import { Router, Request, Response } from 'express';
import { ethers } from 'ethers';

const router = Router();

// In-memory store for role requests (in production, use a proper database)
const roleRequests: { 
  [address: string]: { 
    role: string; 
    requestedAt: Date; 
    status: 'pending' | 'approved' | 'rejected' 
  } 
} = {};

// Endpoint for users to request a role
router.post('/request-role', async (req: Request, res: Response) => {
  try {
    const { walletAddress, role } = req.body;
    
    // Validate inputs
    if (!walletAddress || !role) {
      return res.status(400).json({ error: 'walletAddress and role are required' });
    }
    
    // Validate Ethereum address
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    
    // Validate role
    const validRoles = ['GovernmentRegistrar', 'InsuranceCompany'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }
    
    // Store the request
    roleRequests[walletAddress] = {
      role,
      requestedAt: new Date(),
      status: 'pending'
    };
    
    return res.json({ 
      message: 'Role request submitted successfully', 
      walletAddress,
      role,
      requestId: walletAddress // Using wallet address as request ID for simplicity
    });
  } catch (error: any) {
    console.error('Role request error:', error);
    return res.status(500).json({ error: 'Failed to submit role request' });
  }
});

// Endpoint for admin to get pending role requests
router.get('/role-requests', (req: Request, res: Response) => {
  try {
    // Filter only pending requests
    const pendingRequests = Object.entries(roleRequests)
      .filter(([_, request]) => request.status === 'pending')
      .map(([walletAddress, request]) => ({
        walletAddress,
        role: request.role,
        requestedAt: request.requestedAt,
        status: request.status
      }));
    
    return res.json({ requests: pendingRequests });
  } catch (error: any) {
    console.error('Get role requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch role requests' });
  }
});

// Endpoint for admin to approve/reject role requests
router.post('/process-role-request', async (req: Request, res: Response) => {
  try {
    const { walletAddress, action } = req.body; // action: 'approve' or 'reject'
    
    // Validate inputs
    if (!walletAddress || !action) {
      return res.status(400).json({ error: 'walletAddress and action are required' });
    }
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }
    
    // Check if request exists
    if (!roleRequests[walletAddress]) {
      return res.status(404).json({ error: 'Role request not found' });
    }
    
    // Check if request is still pending
    if (roleRequests[walletAddress].status !== 'pending') {
      return res.status(400).json({ error: 'Role request has already been processed' });
    }
    
    // Update request status
    roleRequests[walletAddress].status = action === 'approve' ? 'approved' : 'rejected';
    
    // If approved, actually assign the role on the blockchain
    if (action === 'approve') {
      try {
        // Get environment variables
        const CONTRACT_ADDRESS = process.env.REGISTRY_ADDRESS;
        const RPC_URL = process.env.RPC_URL;
        const OWNER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
        
        if (!CONTRACT_ADDRESS || !RPC_URL || !OWNER_PRIVATE_KEY) {
          throw new Error('Missing environment variables for blockchain connection');
        }
        
        // Connect to the network
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
        
        // Contract ABI
        const abi = [
          "function addAuthority(address authority, uint8 role) external",
          "function roles(address) view returns (uint8)"
        ];
        
        // Connect to the contract
        const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);
        
        // Map role name to enum value
        const roleEnum = roleRequests[walletAddress].role === 'GovernmentRegistrar' ? 1 : 2;
        
        // Type assertion to tell TypeScript that addAuthority exists
        const addAuthorityFunction = contract.addAuthority as (address: string, role: number) => Promise<any>;
        
        // Assign the role
        const tx = await addAuthorityFunction(walletAddress, roleEnum);
        const receipt = await tx.wait();
        
        return res.json({ 
          message: 'Role request approved and role assigned successfully',
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          walletAddress,
          role: roleRequests[walletAddress].role
        });
      } catch (blockchainError: any) {
        console.error('Blockchain error:', blockchainError);
        // Revert status change if blockchain operation failed
        roleRequests[walletAddress].status = 'pending';
        return res.status(500).json({ 
          error: 'Failed to assign role on blockchain',
          details: blockchainError.message
        });
      }
    } else {
      // Rejected
      return res.json({ 
        message: 'Role request rejected',
        walletAddress,
        role: roleRequests[walletAddress].role
      });
    }
  } catch (error: any) {
    console.error('Process role request error:', error);
    return res.status(500).json({ error: 'Failed to process role request' });
  }
});

export default router;