# EternaVault Blockchain Flow Documentation

## Overview

EternaVault is a blockchain-based system for death certificate verification that ensures secure, transparent, and instant verification using Polygon Amoy testnet and IPFS storage.

## System Architecture

### Components
1. **Frontend**: React application with role-based dashboards
2. **Backend**: Node.js/Express API with MongoDB for user authentication
3. **Blockchain**: Polygon Amoy smart contract for certificate verification
4. **Storage**: IPFS (Pinata) for certificate document storage

## Blockchain Flow

### 1. Registrar Flow

#### Step 1: Authentication
- Registrar logs in using email/password (MongoDB authentication only)
- No blockchain interaction during login

#### Step 2: MetaMask Connection
- Registrar connects MetaMask wallet
- Wallet address captured for blockchain registration

#### Step 3: Certificate Upload
- Registrar fills form with:
  - Deceased full name
  - Date of death
  - Reason of death
  - Certificate document upload
- Document uploaded to IPFS (Pinata)
- IPFS returns:
  - CID (Content Identifier)
  - SHA-256 hash of the document

#### Step 4: Blockchain Registration
- Smart contract function `addCertificate(bytes32 certHash, string ipfsCid)` called
- Parameters stored on blockchain:
  - Certificate hash (bytes32)
  - IPFS CID (string)
  - Registrar's wallet address (address)
  - Timestamp (uint256)
- Only users with GovernmentRegistrar role can call this function

### 2. Insurance Company Flow

#### Step 1: Authentication
- Insurance company logs in using email/password (MongoDB authentication only)
- No blockchain interaction during login

#### Step 2: Certificate Verification
- Insurance company uploads certificate document for verification
- System computes SHA-256 hash of uploaded document
- Smart contract function `verifyCertificate(bytes32 certHash)` called
- Parameters searched on blockchain:
  - Certificate hash (bytes32)

#### Step 3: Verification Result
- If hash found:
  - Returns: exists=true, IPFS CID, registrar address, timestamp
  - Status: "Verified: File hash matches blockchain record"
- If hash not found:
  - Returns: exists=false, empty values
  - Status: "Not Verified: Mismatch or no record found"

## Smart Contract Details

### Contract: DeathCertificateRegistry.sol

#### Data Structures
```solidity
enum Role { None, GovernmentRegistrar, InsuranceCompany }

struct CertificateRecord {
    bytes32 certHash;     // SHA-256 hash of certificate
    string ipfsCid;       // IPFS CID of certificate document
    address registrar;    // Registrar's wallet address
    uint256 timestamp;    // Block timestamp
}

mapping(address => Role) public roles;           // Wallet address -> Role
mapping(bytes32 => CertificateRecord) private records; // Hash -> CertificateRecord
```

#### Events
```solidity
event AuthorityUpdated(address indexed authority, Role role);
event CertificateAdded(bytes32 indexed certHash, string ipfsCid, address indexed registrar);
```

#### Functions

##### Constructor
```solidity
constructor(address initialOwner) Ownable(initialOwner)
```
- Sets contract owner who can assign roles

##### Role Management
```solidity
function addAuthority(address authority, Role role) external onlyOwner
```
- Assigns role to wallet address
- Only contract owner can call

```solidity
function removeAuthority(address authority) external onlyOwner
```
- Removes role from wallet address
- Only contract owner can call

##### Certificate Registration
```solidity
function addCertificate(bytes32 certHash, string calldata ipfsCid) external onlyRegistrar
```
- Stores certificate data on blockchain
- Only GovernmentRegistrar role can call
- Emits CertificateAdded event

##### Certificate Verification
```solidity
function verifyCertificate(bytes32 certHash) external view returns (bool exists, string memory ipfsCid, address registrar, uint256 timestamp)
```
- Public function to verify certificate existence
- Returns certificate details if found

## Data Storage

### MongoDB (Backend)
- **User authentication data only**
- Registration form data (name, email, password, role-specific info)
- No certificate data stored

### IPFS (Pinata)
- **Certificate documents**
- Returns CID and document hash
- Permanent storage with content addressing

### Blockchain (Polygon Amoy)
- **Certificate metadata only**
- Hash, CID, registrar address, timestamp
- Immutable and tamper-proof verification

## Security Considerations

### Role-Based Access Control
- Only contract owner can assign roles
- Only GovernmentRegistrar can register certificates
- InsuranceCompany role exists but currently unused

### Data Privacy
- Personal details stored in MongoDB (access controlled)
- Certificate documents stored on IPFS (encrypted if needed)
- Blockchain stores only hashes (no personal data)

### Wallet Security
- Each user manages their own MetaMask wallet
- Private keys never shared with the application
- Transactions signed locally in user's browser

## Error Handling

### Common Issues
1. **Role Not Assigned**: Registrar cannot register certificates
   - Solution: Assign GovernmentRegistrar role via owner wallet

2. **Network Connection**: Blockchain calls timeout
   - Solution: Check RPC endpoint and network connectivity

3. **Insufficient Funds**: Gas fees for transactions
   - Solution: Ensure wallet has test MATIC

4. **Duplicate Certificates**: Same hash already registered
   - Solution: System prevents duplicate registration

## Verification Process

### Hash Generation
- SHA-256 hashing algorithm used
- Applied to exact certificate document bytes
- Hash format: 32-byte bytes32 in smart contract

### Verification Logic
1. Upload document to verify
2. Generate hash of uploaded document
3. Query blockchain for hash
4. Compare blockchain data with uploaded document
5. Return verification result

## API Endpoints

### Registrar Endpoints
- `POST /api/registrar/upload` - Upload certificate to IPFS
- `POST /api/registrar/register-on-chain` - Prepare for blockchain registration

### Insurer Endpoints
- `POST /api/insurer/verify` - Verify certificate against blockchain

### Auth Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

## Environment Configuration

### Required Variables
```env
MONGO_URI=mongodb+srv://...
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/...
REGISTRY_ADDRESS=0x... (smart contract address)
DEPLOYER_PRIVATE_KEY=0x... (contract owner)
IPFS_ENDPOINT=https://api.pinata.cloud
IPFS_PROJECT_ID=...
IPFS_PROJECT_SECRET=...
PINATA_JWT=...
```

## Deployment Information

### Networks
- **Development**: Local MongoDB, Ganache/Polygon Amoy
- **Production**: MongoDB Atlas, Polygon Amoy

### Smart Contract Address
- Polygon Amoy: `0x5d65a750CBc777a6e46507fd5b9a90ea1be8Ac25`

### IPFS Gateway
- Pinata: `https://api.pinata.cloud`

## Future Enhancements

### Possible Improvements
1. **Encryption**: Encrypt certificate documents before IPFS storage
2. **Indexing**: Add indexing for deceased names for faster search
3. **Events**: Enhanced event logging for audit trails
4. **Roles**: Implement InsuranceCompany role for specific permissions
5. **Batching**: Batch certificate registration for efficiency