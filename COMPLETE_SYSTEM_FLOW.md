# EternaVault Complete System Flow

## Overview

EternaVault is a blockchain-based death certificate verification system that ensures secure, transparent, and instant verification using Polygon Amoy testnet and IPFS storage.

## System Components

1. **Frontend**: React application with role-based dashboards
2. **Backend**: Node.js/Express API with MongoDB for user authentication
3. **Blockchain**: Polygon Amoy smart contract for certificate verification
4. **Storage**: IPFS (Pinata) for certificate document storage

## Complete Flow

### Phase 1: Registrar Registration Process

#### Step 1: User Authentication
- Registrar accesses the application
- Logs in using email/password (MongoDB authentication)
- No blockchain interaction during login

#### Step 2: MetaMask Connection
- Registrar clicks "Connect MetaMask" button
- MetaMask browser extension opens
- User confirms wallet connection
- Wallet address captured for blockchain registration

#### Step 3: Certificate Form Completion
- Registrar fills form with:
  - Deceased full name
  - Date of death
  - Cause of death
  - Certificate document file (PDF/JPG/PNG)

#### Step 4: IPFS Upload
- Certificate document sent to backend
- Backend uploads document to IPFS (Pinata)
- Pinata returns:
  - CID (Content Identifier)
  - SHA-256 hash of the document
- Metadata stored in MongoDB:
  - Certificate ID
  - Deceased name
  - Document hash
  - IPFS CID
  - Registrar wallet address
  - Status: "uploaded_to_ipfs"

#### Step 5: Blockchain Registration Preparation
- Backend returns data to frontend:
  - CID
  - Hash
  - Registry address
  - RPC URL
- Frontend prepares for blockchain registration

#### Step 6: Blockchain Registration
- Frontend calls smart contract function `addCertificate(bytes32 certHash, string ipfsCid)`
- MetaMask prompts user to sign transaction
- Transaction submitted to Polygon Amoy network
- If successful:
  - Certificate data stored on blockchain:
    - Hash (bytes32)
    - CID (string)
    - Registrar address (address)
    - Timestamp (uint256)
  - Transaction hash provided for verification

### Phase 2: Insurance Company Verification Process

#### Step 1: User Authentication
- Insurance company accesses the application
- Logs in using email/password (MongoDB authentication)
- No blockchain interaction during login

#### Step 2: Verification Form Completion
- Insurance company fills form with:
  - Claimant name
  - Deceased name
  - Certificate document file (PDF/JPG/PNG)

#### Step 3: Document Hashing
- Certificate document sent to backend
- Backend computes SHA-256 hash of document
- Hash formatted as bytes32 for blockchain query

#### Step 4: Blockchain Verification
- Backend calls smart contract function `verifyCertificate(bytes32 certHash)`
- Smart contract searches for hash in records mapping
- If found:
  - Returns: exists=true, IPFS CID, registrar address, timestamp
- If not found:
  - Returns: exists=false, empty values

#### Step 5: Verification Result
- Backend compares local hash with blockchain hash
- Result stored in MongoDB:
  - Deceased name
  - File hash
  - Verification status
  - Verification timestamp
  - Blockchain data (if verified)
- Result sent to frontend:
  - Verified: true/false
  - Local hash
  - Blockchain data
  - Message

## Data Storage Architecture

### MongoDB (User Authentication Only)
**Collections**:
1. Users
   - Name
   - Email
   - Password (plaintext as per requirements)
   - Role (registrar, insurer, claimant, admin)
   - Role-specific information

2. Claims (Verification Results)
   - Deceased name
   - File hash
   - Verified status
   - Verification date
   - On-chain data

**No certificate data stored in MongoDB**

### IPFS (Document Storage)
- Certificate documents stored with Pinata
- Content addressing via CID
- Permanent storage
- Accessible via IPFS gateways

### Blockchain (Metadata Storage)
- Certificate hashes (bytes32)
- IPFS CIDs (string)
- Registrar addresses (address)
- Timestamps (uint256)
- Immutable and tamper-proof

## Smart Contract Functions

### Certificate Registration
```solidity
function addCertificate(bytes32 certHash, string calldata ipfsCid) external onlyRegistrar
```
**Parameters**:
- certHash: SHA-256 hash of certificate document
- ipfsCid: IPFS Content Identifier

**Requirements**:
- Caller must have GovernmentRegistrar role
- Hash must not already exist
- Hash and CID must not be empty

**Effects**:
- Stores certificate record
- Emits CertificateAdded event

### Certificate Verification
```solidity
function verifyCertificate(bytes32 certHash) external view returns (bool exists, string memory ipfsCid, address registrar, uint256 timestamp)
```
**Parameters**:
- certHash: SHA-256 hash to search for

**Returns**:
- exists: Whether certificate exists
- ipfsCid: IPFS Content Identifier
- registrar: Registrar's wallet address
- timestamp: Block timestamp

## Security Model

### Role-Based Access Control
- **Contract Owner**: Can assign roles
- **GovernmentRegistrar**: Can register certificates
- **InsuranceCompany**: Can verify certificates (read-only)

### Wallet Management
- Each user manages their own MetaMask wallet
- Private keys never leave user's device
- Transactions signed locally in browser

### Data Privacy
- Personal information in MongoDB (access controlled)
- Documents in IPFS (can be encrypted)
- Blockchain stores only hashes (no personal data)

## Error Handling

### Common Scenarios
1. **Role Not Assigned**
   - Registrar cannot register certificates
   - Solution: Assign GovernmentRegistrar role

2. **Network Connectivity**
   - Blockchain calls timeout
   - Solution: Check RPC endpoint and network

3. **Insufficient Gas**
   - Transaction fails due to low funds
   - Solution: Ensure wallet has test MATIC

4. **Duplicate Certificates**
   - Same hash already registered
   - Solution: System prevents duplicates

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Registrar
- `POST /api/registrar/upload` - Upload certificate to IPFS
- `POST /api/registrar/register-on-chain` - Prepare blockchain registration

### Insurer
- `POST /api/insurer/verify` - Verify certificate against blockchain

## Environment Configuration

### Required Variables
```env
MONGO_URI= # MongoDB connection string
RPC_URL= # Polygon Amoy RPC endpoint
REGISTRY_ADDRESS= # Smart contract address
DEPLOYER_PRIVATE_KEY= # Contract owner private key
IPFS_ENDPOINT= # Pinata API endpoint
IPFS_PROJECT_ID= # Pinata project ID
IPFS_PROJECT_SECRET= # Pinata project secret
PINATA_JWT= # Pinata JWT token
```

## Deployment Information

### Networks
- **Blockchain**: Polygon Amoy testnet
- **Storage**: Pinata IPFS
- **Database**: MongoDB Atlas

### Smart Contract Address
- Polygon Amoy: `0x5d65a750CBc777a6e46507fd5b9a90ea1be8Ac25`

## Verification Process Details

### Hash Generation
1. SHA-256 algorithm applied to document bytes
2. Result formatted as 64-character hexadecimal string
3. Prefixed with "0x" for blockchain compatibility
4. Stored as bytes32 in smart contract

### Verification Logic
1. Upload document for verification
2. Generate hash of uploaded document
3. Query blockchain for exact hash match
4. Compare blockchain data with expectations
5. Return verification result

## User Experience

### Registrar Dashboard
- MetaMask connection
- Certificate form
- File upload
- Blockchain registration
- Transaction confirmation

### Insurance Dashboard
- Verification form
- File upload
- Verification result display
- Success/failure messaging

## Future Enhancements

### Possible Improvements
1. **Encryption**: Encrypt documents before IPFS storage
2. **Indexing**: Add name-based search capabilities
3. **Batching**: Register multiple certificates in one transaction
4. **Events**: Enhanced event logging for audit trails
5. **Roles**: Implement granular permission system