# GitHub Deployment Guide

This guide explains how to push the Death Certificate Blockchain Verification System to GitHub.

## Prerequisites

1. Git installed on your system
2. GitHub account
3. Repository created on GitHub

## Steps to Push to GitHub

1. **Check current Git status:**
   ```bash
   cd /path/to/your/project
   git status
   ```

2. **Add all files to Git:**
   ```bash
   git add .
   ```

3. **Commit the changes:**
   ```bash
   git commit -m "Initial commit: Death Certificate Blockchain Verification System"
   ```

4. **Add your GitHub repository as remote (replace with your actual repository URL):**
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   ```

5. **Push to GitHub:**
   ```bash
   git push -u origin main
   ```

## What's Included in the Repository

The repository includes:

- **Backend**: Node.js/Express server with MongoDB integration
- **Frontend**: React/Vite application with Web3 integration
- **Smart Contracts**: Solidity contracts for death certificate verification
- **Documentation**: 
  - Main README.md with installation and usage instructions
  - Environment variables documentation
  - Example environment files for all services

## Environment Variables Setup

After cloning the repository, you'll need to set up environment variables for each service:

1. **Backend** (`backend/.env`):
   - Copy `documentation/backend.env.example` to `backend/.env`
   - Configure with your MongoDB, JWT, blockchain, and IPFS credentials

2. **Smart Contracts** (`contracts/.env`):
   - Copy `documentation/contracts.env.example` to `contracts/.env`
   - Configure with your deployment keys and RPC URLs

3. **Frontend** (`frontend/.env`):
   - Copy `documentation/frontend.env.example` to `frontend/.env`
   - Configure with your contract address and API URL

## Deployment Notes

- Never commit actual credentials to GitHub
- Use the provided `.gitignore` files to exclude sensitive files
- The example environment files are safe to commit as they don't contain real credentials