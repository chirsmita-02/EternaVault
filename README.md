# Death Certificate Blockchain Verification

Monorepo: contracts (Hardhat), backend (Node/Express/Mongo/IPFS), frontend (React + MetaMask).

## Prereqs
- Node 18+
- Free accounts: Infura (RPC + IPFS) or Pinata for IPFS, MongoDB Atlas

## Contracts
1. cd contracts
2. copy .env.example to .env and set RPC + PRIVATE KEY
3. npm run build
4. npm run deploy:sepolia

## Backend
1. cd backend
2. copy .env.example to .env and set MONGO_URI, JWT_SECRET, RPC_URL, REGISTRY_ADDRESS, IPFS creds
3. npm run build && npm start

## Frontend
1. cd frontend
2. set VITE_API_BASE_URL in .env.local (e.g., http://localhost:4000/api)
3. npm run dev


