import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectMetaMask } from '../wallet';
import api from '../api';
import { ethers } from 'ethers';

export default function Registrar() {
  const [address, setAddress] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [fullName, setFullName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1 = uploading, 2 = blockchain prep, 3 = blockchain registration, 4 = completed
  const [result, setResult] = useState<any>(null);
  const [blockchainResult, setBlockchainResult] = useState<any>(null);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'registrar') {
      // Redirect to login if not authenticated or not registrar
      navigate('/login');
    }
  }, [navigate]);

  // Clear address on component mount to ensure fresh connection
  useEffect(() => {
    setAddress('');
  }, []);

  // Check if MetaMask is installed
  useEffect(() => {
    if (!(window as any).ethereum) {
      setBlockchainResult({
        success: false,
        error: 'MetaMask is not installed. Please install MetaMask to continue.'
      });
    }
  }, []);

  const canSubmit = useMemo(() => !!address && !!file && !!fullName && !!dateOfDeath, [address, file, fullName, dateOfDeath]);

  async function connect() {
    // Clear previous state
    setAddress('');
    setProvider(null);
    setBlockchainResult(null);
    
    const res = await connectMetaMask();
    if (res) {
      setAddress(res.address);
      setProvider(res.provider);
      // Automatically ensure the wallet has registrar role
      await ensureRegistrarRole(res.provider, res.address);
      
      // Show network information
      try {
        const network = await res.provider.getNetwork();
        setBlockchainResult({
          success: true,
          message: `Connected to ${network.name} (Chain ID: ${network.chainId})`
        });
      } catch (error) {
        console.error('Failed to get network info:', error);
      }
    }
  }

  async function refreshConnection() {
    // Clear all state
    setAddress('');
    setProvider(null);
    setBlockchainResult(null);
    // Force a new connection
    await connect();
  }

  async function ensureRegistrarRole(currentProvider: ethers.BrowserProvider, walletAddress: string) {
    try {
      console.log('🔍 [ensureRegistrarRole] Starting for address:', walletAddress);
      const registryAddress = import.meta.env.VITE_REGISTRY_ADDRESS || '';
      console.log('📋 Environment VITE_REGISTRY_ADDRESS:', import.meta.env.VITE_REGISTRY_ADDRESS);
      console.log('📋 Using registry address:', registryAddress);

      // Validate registry address
      if (!registryAddress || !ethers.isAddress(registryAddress)) {
        console.error('❌ Invalid registry address configured:', registryAddress);
        setBlockchainResult({
          success: false,
          error: 'Registry contract address is not configured correctly. Please contact the administrator.',
        });
        return;
      }
      console.log('✅ Registry address valid:', registryAddress);

      const abi = [
        "function roles(address) view returns (uint8)",
        "function selfRegisterRegistrar()"
      ];
      const signer = await currentProvider.getSigner();
      const signerAddress = await signer.getAddress();
      console.log('✅ Signer address:', signerAddress);

      // Ensure there is contract code at the configured address on the current network
      const network = await currentProvider.getNetwork();
      console.log('🌐 Current network:', network.name, 'Chain ID:', network.chainId.toString());
      const code = await currentProvider.send('eth_getCode', [registryAddress, 'latest']);
      if (code === '0x') {
        console.error(`❌ No contract code at ${registryAddress} on chain ${network.chainId}`);
        const networkName = network.chainId === 80002n ? 'Polygon Amoy' : `Chain ID ${network.chainId}`;
        setBlockchainResult({
          success: false,
          error: `No registry contract found at address ${registryAddress} on ${networkName} (chainId ${network.chainId}). Please ensure: 1) MetaMask is connected to Polygon Amoy (chainId 80002), 2) The contract address in frontend/.env is correct.`,
        });
        return;
      }
      console.log('✅ Contract code found at registry address');

      const contract = new ethers.Contract(registryAddress, abi, signer);
      console.log('🔍 Checking role for address:', walletAddress, 'Signer address:', signerAddress);
      
      let currentRole;
      try {
        currentRole = await contract.roles(walletAddress);
        console.log('✅ Current role:', currentRole.toString());
      } catch (roleError: any) {
        console.error('❌ Error checking role:', roleError);
        setBlockchainResult({
          success: false,
          error: `Failed to check role: ${roleError.message || roleError.toString()}. Please check the browser console (F12) for details.`,
        });
        return;
      }

      if (currentRole !== 1) {
        console.log('⚠️ User does not have registrar role. Calling selfRegisterRegistrar()...');
        setBlockchainResult({
          success: true,
          message: 'Assigning Government Registrar role... Please approve the transaction in MetaMask.'
        });
        
        try {
          // This should trigger MetaMask transaction popup
          console.log('📝 Sending selfRegisterRegistrar() transaction...');
          const tx = await contract.selfRegisterRegistrar();
          console.log('✅ Transaction sent! Hash:', tx.hash);
          console.log('⏳ Waiting for transaction confirmation...');
          
          setBlockchainResult({
            success: true,
            message: `Transaction sent! Hash: ${tx.hash}. Waiting for confirmation...`,
            txHash: tx.hash
          });
          
          await tx.wait();
          console.log('✅ Transaction confirmed!');
          
          setBlockchainResult({
            success: true,
            message: 'Wallet automatically registered as Government Registrar.',
            txHash: tx.hash
          });
        } catch (txError: any) {
          console.error('❌ Transaction failed:', txError);
          if (txError.code === 'ACTION_REJECTED' || txError.code === 4001) {
            setBlockchainResult({
              success: false,
              error: 'Transaction rejected in MetaMask. Please try again and approve the transaction.',
            });
          } else {
            setBlockchainResult({
              success: false,
              error: `Transaction failed: ${txError.message || txError.toString()}. Please check the browser console (F12) for details.`,
            });
          }
          throw txError;
        }
      } else {
        console.log('✅ User already has registrar role');
        setBlockchainResult({
          success: true,
          message: 'Wallet already registered as Government Registrar.'
        });
      }
    } catch (e: any) {
      console.error('❌ Auto role assignment failed:', e);
      const errorMessage = e.message || e.toString() || 'Unknown error';
      setBlockchainResult({
        success: false,
        error: `Failed to automatically register as Government Registrar: ${errorMessage}. Please check the browser console (F12) for details and try again.`,
      });
    }
  }

  // Admin approval flow removed per product requirement - role assignment is automatic on connect

  async function registerOnBlockchain(certificateData: any, blockchainProvider: ethers.BrowserProvider, maxRetries = 3) {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      
      try {
        setLoading(true);
        setCurrentStep(2); // Blockchain preparation step
        setBlockchainResult({
          success: true,
          message: `Preparing blockchain registration (Attempt ${attempt}/${maxRetries})...`
        });
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the contract ABI
        const abi = [
          "function addCertificate(bytes32 certHash, string ipfsCid) external",
          "function roles(address) view returns (uint8)",
          "function selfRegisterRegistrar()"
        ];
        
        // Connect to the contract
        const signer = await blockchainProvider.getSigner();
        const registryAddress = certificateData.registryAddress || import.meta.env.VITE_REGISTRY_ADDRESS;

        if (!registryAddress || !ethers.isAddress(registryAddress)) {
          throw new Error('Registry contract address is not configured correctly.');
        }

        const network = await blockchainProvider.getNetwork();
        const code = await blockchainProvider.send('eth_getCode', [registryAddress, 'latest']);
        if (code === '0x') {
          const networkName = network.chainId === 80002n ? 'Polygon Amoy' : `Chain ID ${network.chainId}`;
          throw new Error(`No registry contract found at ${registryAddress} on ${networkName} (chainId ${network.chainId}). Please ensure MetaMask is on Polygon Amoy (chainId 80002) and the contract address is correct.`);
        }

        const contract = new ethers.Contract(registryAddress, abi, signer);
        
        // Ensure the current wallet has the required role; auto self-register if missing
        const walletAddress = await signer.getAddress();
        let role = await contract.roles(walletAddress);
        if (role !== 1) {
          setBlockchainResult({
            success: true,
            message: 'Assigning Government Registrar role...'
          });
          // Small delay to allow UI to update
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const txRole = await contract.selfRegisterRegistrar();
          await txRole.wait();
          role = await contract.roles(walletAddress);
        }
        
        // Convert hash to bytes32
        const certHash = '0x' + certificateData.hash;
        
        setBlockchainResult({
          success: true,
          message: 'Preparing blockchain transaction...'
        });
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Estimate gas first to avoid issues
        let gasEstimate;
        try {
          gasEstimate = await contract.addCertificate.estimateGas(certHash, certificateData.cid);
        } catch (estimateError) {
          console.log('Gas estimation failed, using default gas limit');
          gasEstimate = 300000n; // Default gas limit
        }
        
        setBlockchainResult({
          success: true,
          message: 'Sending blockchain transaction...'
        });
        
        // Send transaction with optimized settings
        const tx = await contract.addCertificate(certHash, certificateData.cid, {
          gasLimit: gasEstimate + 100000n, // Add larger buffer to estimate
          // Remove gasPrice as it's not needed and causing issues
        });
        
        setBlockchainResult({
          success: true,
          message: 'Transaction sent. Waiting for confirmation...',
          txHash: tx.hash
        });
        
        console.log('Transaction sent with hash:', tx.hash);
        
        // Wait for transaction with timeout
        const receiptPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction confirmation timeout')), 90000) // Increased to 90 seconds
        );
        
        // Use the receipt properly
        const receipt = await Promise.race([receiptPromise, timeoutPromise]);
        console.log('Transaction receipt:', receipt);
        
        // Update certificate status in database
        try {
          await api.post('/registrar/update-certificate-status', {
            cid: certificateData.cid,
            txHash: tx.hash
          });
        } catch (dbError) {
          console.warn('Failed to update certificate status in database:', dbError);
        }
        
        setBlockchainResult({
          success: true,
          txHash: tx.hash,
          message: 'Certificate successfully registered on blockchain!'
        });
        
        return tx.hash;
      } catch (error: any) {
        console.error(`Blockchain registration attempt ${attempt} failed:`, error);
        
        // If this is the last attempt, show the error
        if (attempt >= maxRetries) {
          let errorMessage = error.message || 'Failed to register certificate on blockchain';
          
          // Handle common blockchain errors
          if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
            errorMessage = 'Certificate may already exist on blockchain';
          } else if (error.code === 'ACTION_REJECTED') {
            errorMessage = 'Transaction rejected by user in MetaMask';
          } else if (error.message?.includes('insufficient funds')) {
            errorMessage = 'Insufficient MATIC tokens for gas fees';
          } else if (error.message?.includes('timeout')) {
            errorMessage = 'Transaction taking longer than expected. Check MetaMask for pending transactions.';
          } else if (error.message?.includes('already known')) {
            errorMessage = 'Transaction already submitted. Check MetaMask for pending transactions.';
          } else if (error.message?.includes('replacement transaction underpriced')) {
            errorMessage = 'Gas price too low. Try again or check MetaMask for pending transactions.';
          } else if (error.message?.includes('nonce too low')) {
            errorMessage = 'Transaction nonce too low. This may happen if you have pending transactions. Check MetaMask for pending transactions.';
          } else if (error.message?.includes('replacement transaction underpriced')) {
            errorMessage = 'Gas price too low. Try again or check MetaMask for pending transactions.';
          }
          
          setBlockchainResult({
            success: false,
            error: errorMessage,
            suggestion: 'Please check MetaMask for pending transactions.'
          });
          throw error;
        }
        
        // If not the last attempt, show retry message and continue
        setBlockchainResult({
          success: true,
          message: `Attempt ${attempt} failed. Retrying in 3 seconds... (${maxRetries - attempt} attempts left)`
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 3000));
      } finally {
        if (attempt >= maxRetries) {
          setLoading(false);
        }
      }
    }
  }

  async function submit() {
    if (!file || !address) return;
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setResult({ error: 'File size exceeds 10MB limit. Please select a smaller file.' });
      return;
    }
    
    setLoading(true);
    setCurrentStep(1); // Start with uploading step
    setResult(null);
    setBlockchainResult(null);
    
    try {
      // Ensure we have a connected provider (in case user refreshed mid-flow)
      let activeProvider = provider;
      if (!activeProvider) {
        const res = await connectMetaMask();
        if (!res) {
          setBlockchainResult({
            success: false,
            error: 'MetaMask connection is required to register on blockchain.'
          });
          return;
        }
        setAddress(res.address);
        setProvider(res.provider);
        activeProvider = res.provider;
      }

      // Step 1: Upload to IPFS and get certificate data
      const form = new FormData();
      form.append('file', file);
      form.append('fullName', fullName);
      form.append('dateOfDeath', dateOfDeath);
      form.append('causeOfDeath', causeOfDeath);
      form.append('wallet', address);
      
      // Add upload progress tracking
      const { data: certificateData } = await api.post('/registrar/upload', form, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000 // 45 second timeout
      });
      
      setResult({ 
        ...certificateData, 
        wallet: address, 
        timestamp: new Date().toISOString() 
      });
      
      // Step 2: Register on blockchain with timeout
      try {
        setCurrentStep(3); // Move to blockchain registration step
        // Set a timeout for the entire blockchain process
        const blockchainPromise = registerOnBlockchain(certificateData, activeProvider);
        const timeoutId = setTimeout(() => {
          setBlockchainResult({
            success: false,
            error: 'Blockchain registration is taking longer than expected. Check MetaMask for pending transactions or try again.'
          });
        }, 120000); // Increased to 120 seconds (2 minutes)
        
        await blockchainPromise;
        clearTimeout(timeoutId);
        setCurrentStep(4); // Completed
      } catch (blockchainError) {
        // Blockchain registration failed, but IPFS upload succeeded
        console.warn('Blockchain registration failed:', blockchainError);
        // Don't throw the error to allow the UI to show the result
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      setResult({ 
        error: e?.response?.data?.error || 
               (e.code === 'ECONNABORTED' ? 'Upload timeout - please try again with a smaller file' : e.message) ||
               'Certificate upload failed. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Death Certificate Registration – Registrar Dashboard</h2>
        <p className="muted">Fill details, upload certificate, connect MetaMask on Polygon Mumbai, and submit.</p>
        <div className="spacer" />
        <div className="stack">
          <div className="row" style={{ gap: '10px' }}>
            <button className="btn" onClick={connect}>
              {address ? `Connected: ${address.slice(0,6)}...${address.slice(-4)}` : 'Connect to MetaMask'}
            </button>
            {address && (
              <button className="btn secondary" onClick={refreshConnection}>
                Change Account
              </button>
            )}
          </div>
          
          {/* Show current network information */}
          {address && (
            <div className="card">
              <h4>Connected Wallet</h4>
              <p>Address: {address}</p>
              <p className="muted">Make sure you're connected to the Polygon Amoy network</p>
            </div>
          )}
          
          {/* Admin approval UI removed; role assignment is automatic on connect */}
          
          {/* Progress Indicator */}
          {loading && (
            <div className="progress-indicator">
              <div className="progress-steps">
                <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                  <div className="step-icon">1</div>
                  <div className="step-label">Upload to IPFS</div>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                  <div className="step-icon">2</div>
                  <div className="step-label">Prepare Blockchain</div>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                  <div className="step-icon">3</div>
                  <div className="step-label">Register on Chain</div>
                </div>
                <div className="step-divider"></div>
                <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                  <div className="step-icon">✓</div>
                  <div className="step-label">Completed</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="form card">
            <div className="row">
              <label className="label">Deceased Full Name</label>
              <input className="input" placeholder="e.g. Chirsmita Thakur" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Date of Death</label>
              <input className="input" type="date" value={dateOfDeath} onChange={e => setDateOfDeath(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Cause of Death</label>
              <input className="input" placeholder="e.g. Natural causes" value={causeOfDeath} onChange={e => setCauseOfDeath(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Certificate File (PDF/JPG/PNG) - Max 10MB</label>
              <input className="file" accept=".pdf,.jpg,.jpeg,.png" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file && (
                <div className="muted small">
                  File size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
            <div className="row" style={{ gap: '10px' }}>
              <button className="btn secondary" onClick={submit} disabled={!canSubmit || loading}>
                {loading ? 'Submitting…' : 'Upload & Record'}
              </button>
            </div>
            <a className="link" href="/login">Back to Login</a>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <h3>Processing Registration</h3>
            <p className="small">Uploading to IPFS and registering on blockchain...</p>
            <p className="small">This may take 5-15 seconds</p>
            <button className="btn secondary small" onClick={() => {
              setLoading(false);
              setBlockchainResult({
                success: false,
                error: 'Process cancelled by user',
                suggestion: 'Check MetaMask for pending transactions before trying again.'
              });
            }} style={{ marginTop: '15px' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card fade-in">
          <h3 className="heading">{result.error ? 'Submission Failed' : 'Submission Success'}</h3>
          {result.error ? (
            <p className="error">{result.error}</p>
          ) : (
            <div className="code">
              <div><strong>File Hash:</strong> {result.hash}</div>
              <div><strong>IPFS CID:</strong> {result.ipfsCid}</div>
              <div><strong>Wallet:</strong> {result.wallet}</div>
              <div><strong>Timestamp:</strong> {result.timestamp}</div>
              <div><strong>What's stored on blockchain:</strong> Only the hash above and IPFS reference</div>
              <div><a className="link" href={`https://ipfs.io/ipfs/${result.ipfsCid}`} target="_blank" rel="noreferrer">View on IPFS</a></div>
            </div>
          )}
        </div>
      )}
      
      {blockchainResult && (
        <div className="card fade-in">
          <h3 className="heading">Blockchain Registration</h3>
          <div className={blockchainResult.success ? "verification-success" : "verification-failure"}>
            <h4>{blockchainResult.message || blockchainResult.error}</h4>
            {!blockchainResult.success && blockchainResult.error && (
              <div>
                {blockchainResult.error.includes('role') && (
                  <p className="muted">
                    Please connect your MetaMask wallet to automatically register as a Government Registrar.
                  </p>
                )}
                <p className="muted">
                  {blockchainResult.suggestion || 'Please check MetaMask for pending transactions.'}
                </p>
              </div>
            )}
            {blockchainResult.txHash && (
              <div className="code">
                <div><strong>Transaction Hash:</strong> {blockchainResult.txHash}</div>
                <div><strong>What's stored on blockchain:</strong> Only a small hash of the certificate and IPFS reference</div>
                <div><a className="link" href={`https://amoy.polygonscan.com/tx/${blockchainResult.txHash}`} target="_blank" rel="noreferrer">View on Polygonscan</a></div>
              </div>
            )}
            {blockchainResult.success && !blockchainResult.txHash && (
              <div className="muted">
                <p>Only a small cryptographic hash and IPFS reference are stored on the blockchain.</p>
                <p>This is a very lightweight operation that typically takes 5-15 seconds.</p>
                <p>If it's taking longer, please check your MetaMask for pending transactions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .verification-success {
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }
        
        .verification-failure {
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }
        
        .warning {
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Loading Overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .loading-spinner {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 300px;
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #007bff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .loading-spinner p {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #333;
        }
        
        .small {
          font-size: 14px;
          color: #666;
        }
        
        /* Progress Indicator */
        .progress-indicator {
          margin: 20px 0;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .progress-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          flex: 1;
        }
        
        .step.active .step-icon {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .step-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: white;
          border: 2px solid #dee2e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .step-label {
          font-size: 12px;
          color: #6c757d;
        }
        
        .step.active .step-label {
          color: #007bff;
          font-weight: 500;
        }
        
        .step-divider {
          height: 2px;
          background-color: #dee2e6;
          flex: 1;
          margin: 0 10px;
        }
        
        .step:last-child .step-divider {
          display: none;
        }
      `}</style>
    </div>
  );
}