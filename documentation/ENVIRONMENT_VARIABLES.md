# Environment Variables Documentation

This document describes all the environment variables required for the Death Certificate Blockchain Verification System.

## Backend Environment Variables (.env)

Located in: `backend/.env`

### MongoDB Configuration
- `MONGO_URI`: Connection string for MongoDB Atlas. Must include the database name.
  Example: `mongodb+srv://username:password@cluster.example.mongodb.net/database_name?retryWrites=true&w=majority`

### JWT Configuration
- `JWT_SECRET`: Secret key for JWT token generation and verification.
  Example: `devsecret` (use a strong secret in production)

### Blockchain Configuration
- `RPC_URL`: RPC endpoint for the blockchain network (Polygon Amoy in this case).
  Example: `https://polygon-amoy.g.alchemy.com/v2/your_api_key`
- `REGISTRY_ADDRESS`: Address of the deployed Registry smart contract.
  Example: `0x10Ea002324439076Ba46430384E183749a145AD2`
- `DEPLOYER_PRIVATE_KEY`: Private key used for deploying smart contracts (not needed for running the application).

### IPFS Configuration (Pinata)
- `PINATA_JWT`: JWT token for authenticating with Pinata IPFS service.
  Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `IPFS_PROJECT_ID`: Project ID for Pinata (alternative authentication method).
  Example: `your_project_id_here`
- `IPFS_PROJECT_SECRET`: Project secret for Pinata (alternative authentication method).
  Example: `your_project_secret_here`

### Server Configuration
- `PORT`: Port on which the backend server will run.
  Example: `4000` (default)

## Smart Contracts Environment Variables (.env)

Located in: `contracts/.env`

### Deployment Configuration
- `DEPLOYER_PRIVATE_KEY`: Private key of the wallet used to deploy contracts.
  Example: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Network RPC URLs
- `SEPOLIA_RPC_URL`: RPC endpoint for Ethereum Sepolia testnet.
  Example: `https://sepolia.infura.io/v3/your_infura_project_id`
- `MUMBAI_RPC_URL`: RPC endpoint for Polygon Mumbai testnet.
  Example: `https://polygon-mumbai.infura.io/v3/your_infura_project_id`
- `AMOY_RPC_URL`: RPC endpoint for Polygon Amoy testnet.
  Example: `https://polygon-amoy.g.alchemy.com/v2/your_alchemy_api_key`

### Blockchain Explorer API Keys
- `ETHERSCAN_API_KEY`: API key for Etherscan (for verifying contracts on Ethereum).
  Example: `your_etherscan_api_key_here`
- `POLYGONSCAN_API_KEY`: API key for Polygonscan (for verifying contracts on Polygon).
  Example: `your_polygonscan_api_key_here`

## Frontend Environment Variables (.env)

Located in: `frontend/.env`

### Blockchain Configuration
- `VITE_REGISTRY_ADDRESS`: Address of the deployed Registry smart contract.
  Example: `0x10Ea002324439076Ba46430384E183749a145AD2`

### API Configuration
- `VITE_API_BASE_URL`: Base URL for the backend API.
  Example: `http://localhost:4000/api`

## Frontend Local Environment Variables (.env.local)

Located in: `frontend/.env.local`

### API Configuration
- `VITE_API_BASE_URL`: Base URL for the backend API (can override the .env value).
  Example: `http://localhost:4000/api`