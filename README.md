# Death Certificate Blockchain Verification System

## Purpose of the Website

This is a decentralized death certificate verification system that leverages blockchain technology to provide secure, tamper-proof storage and verification of death certificates. The system allows government registrars to upload death certificates, which are then stored on IPFS with their cryptographic hashes recorded on the Polygon blockchain. Insurance companies and claimants can verify the authenticity of death certificates through the blockchain.

Key features:
- **Decentralized Storage**: Certificates are stored on IPFS for immutability
- **Blockchain Verification**: Cryptographic hashes are stored on Polygon blockchain for tamper-proof verification
- **Role-Based Access**: Different user roles (Registrars, Insurance Companies, Claimants, Admins) with specific permissions
- **MetaMask Integration**: Web3 authentication using MetaMask wallet
- **MongoDB Backend**: User management and certificate metadata storage

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Pinata IPFS account (or similar IPFS service)
- Alchemy RPC account for Polygon network
- MetaMask browser extension

## Resources Used

This project utilizes the following services and technologies:

### Backend Services
- **MongoDB Atlas**: Cloud database for user management and certificate metadata
- **Pinata**: IPFS service for decentralized file storage
- **Alchemy**: RPC provider for Polygon blockchain interactions

### Blockchain Networks
- **Polygon Amoy Testnet**: Primary test network for smart contract deployment
- **Polygon Mumbai Testnet**: Alternative test network
- **Ethereum Sepolia Testnet**: For cross-chain compatibility testing

### Development Tools
- **Hardhat**: Ethereum development environment for smart contract compilation and deployment
- **Node.js**: JavaScript runtime for backend services
- **React**: Frontend framework for user interface
- **Vite**: Build tool and development server for frontend
- **Express**: Web framework for backend API
- **Mongoose**: MongoDB object modeling for Node.js

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd death-certificate-blockchain
```

### 2. Set up Smart Contracts

```bash
cd contracts
npm install
```

Copy `.env.example` to `.env` and configure:
- `SEPOLIA_RPC_URL` - Your Alchemy or Infura Sepolia RPC URL
- `DEPLOYER_PRIVATE_KEY` - Private key of your deployer wallet

Deploy the contracts:
```bash
npm run deploy:sepolia
```

Note the deployed contract address for use in backend configuration.

### 3. Set up Backend

```bash
cd ../backend
npm install
```

Copy `.env.example` to `.env` and configure:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `RPC_URL` - Your Alchemy or Infura Polygon RPC URL
- `REGISTRY_ADDRESS` - Contract address from step 2
- `DEPLOYER_PRIVATE_KEY` - Private key for blockchain interactions
- `PINATA_JWT` - Your Pinata JWT token
- `IPFS_PROJECT_ID` - Your Pinata project ID
- `IPFS_PROJECT_SECRET` - Your Pinata project secret

Start the backend server:
```bash
npm run build
npm start
```

### 4. Set up Frontend

```bash
cd ../frontend
npm install
```

Create `.env.local` file and configure:
- `VITE_REGISTRY_ADDRESS` - Contract address from step 2
- `VITE_API_BASE_URL` - Backend API URL (e.g., http://localhost:4000/api)

Start the frontend development server:
```bash
npm run dev
```

## Usage

1. **Access the Application**: Open your browser and navigate to the frontend URL (typically http://localhost:5173)

2. **Register Users**: 
   - Registrars, Insurance Companies, and Claimants can register through the registration page
   - Admin users need to be created directly in the database or through backend APIs

3. **Registrar Workflow**:
   - Log in as a Registrar
   - Connect MetaMask wallet
   - Fill in death certificate details
   - Upload certificate file (PDF/JPG/PNG)
   - Submit to upload to IPFS and register on blockchain

4. **Verification Process**:
   - Insurance Companies and Claimants can log in
   - Use the verification features to check certificate authenticity
   - The system verifies certificates against blockchain records

## System Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB + Mongoose
- **Blockchain**: Solidity smart contracts deployed on Polygon
- **Storage**: IPFS (Pinata)
- **Authentication**: JWT + MetaMask Web3

## Support

For issues and questions, please check the GitHub repository issues or contact the development team.