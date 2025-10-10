# How to Push This Project to GitHub

This document provides step-by-step instructions on how to push this cleaned-up project to your GitHub repository.

## Prerequisites

1. Git must be installed on your system
2. You must have a GitHub account
3. You should have created a new repository on GitHub

## Steps to Push to GitHub

1. **Check your current Git status:**
   ```bash
   git status
   ```
   You should see that all changes have been committed.

2. **Add your GitHub repository as a remote (if not already done):**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```
   Replace `YOUR_USERNAME` with your GitHub username and `YOUR_REPOSITORY_NAME` with your repository name.

3. **Verify the remote has been added:**
   ```bash
   git remote -v
   ```

4. **Push the code to GitHub:**
   ```bash
   git push -u origin main
   ```
   If your default branch is named differently (e.g., master), use that instead of main.

## What's Included in This Repository

After pushing, your GitHub repository will contain:

### Core Application
- **Backend**: Node.js/Express server with MongoDB integration
- **Frontend**: React/Vite application with Web3 integration
- **Smart Contracts**: Solidity contracts for death certificate verification

### Documentation
- **README.md**: Main documentation with installation and usage instructions
- **ENVIRONMENT_VARIABLES.md**: Comprehensive guide to all environment variables
- **GITHUB_DEPLOYMENT.md**: This deployment guide
- **Example Environment Files**: 
  - `backend.env.example`
  - `contracts.env.example`
  - `frontend.env.example`

## Setting Up Environment Variables After Cloning

When someone clones your repository, they'll need to set up environment variables:

1. **Backend Setup**:
   ```bash
   cp documentation/backend.env.example backend/.env
   # Edit backend/.env with actual values
   ```

2. **Contracts Setup**:
   ```bash
   cp documentation/contracts.env.example contracts/.env
   # Edit contracts/.env with actual values
   ```

3. **Frontend Setup**:
   ```bash
   cp documentation/frontend.env.example frontend/.env
   # Edit frontend/.env with actual values
   ```

## Important Security Notes

- Never commit actual credentials to GitHub
- The `.gitignore` files are configured to exclude sensitive files
- Always use the example files as templates, not actual configuration files
- Rotate any accidentally committed credentials immediately

## Post-Push Verification

After pushing, verify your repository on GitHub by:
1. Visiting your repository URL
2. Checking that all files are present
3. Verifying that the README.md renders correctly
4. Ensuring that sensitive files are not included