import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectMetaMask } from '../wallet';
import api from '../api';
import { ethers } from 'ethers';

export default function Registrar() {
  const [address, setAddress] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
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
    setBlockchainResult(null);
    
    const res = await connectMetaMask();
    if (res) {
      setAddress(res.address);
      // Automatically ensure the wallet has registrar role
      await ensureRegistrarRole(res.address);
      
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
    setBlockchainResult(null);
    // Force a new connection
    await connect();
  }

  async function ensureRegistrarRole(walletAddress: string) {
    try {
      const abi = [
        "function roles(address) view returns (uint8)",
        "function selfRegisterRegistrar()"
      ];
      const { provider } = await connectMetaMask() as any;
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        import.meta.env.VITE_REGISTRY_ADDRESS || '',
        abi,
        signer
      );
      const currentRole = await contract.roles(walletAddress);
      if (currentRole !== 1) {
        setBlockchainResult({
          success: true,
          message: 'Assigning Government Registrar role...'
        });
        // Auto-register as Government Registrar without admin approval
        const tx = await contract.selfRegisterRegistrar();
        await tx.wait();
        setBlockchainResult({
          success: true,
          message: 'Wallet automatically registered as Government Registrar.'
        });
      } else {
        setBlockchainResult({
          success: true,
          message: 'Wallet already registered as Government Registrar.'
        });
      }
    } catch (e: any) {
      console.warn('Auto role assignment failed:', e);
      setBlockchainResult({
        success: false,
        error: 'Failed to automatically register as Government Registrar. Please try again.'
      });
    }
  }

  // Admin approval flow removed per product requirement - role assignment is automatic on connect

  async function registerOnBlockchain(certificateData: any) {
    try {
      setLoading(true);
      setBlockchainResult({
        success: true,
        message: 'Preparing blockchain registration...'
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
      const { provider } = await connectMetaMask() as any;
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        certificateData.registryAddress || import.meta.env.VITE_REGISTRY_ADDRESS,
        abi,
        signer
      );
      
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
        await api.post('/registrar/register-on-chain', {
          cid: certificateData.cid,
          hash: certificateData.hash,
          fullName: certificateData.fullName,
          wallet: walletAddress
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
      console.error('Blockchain registration error:', error);
      
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
      }
      
      setBlockchainResult({
        success: false,
        error: errorMessage,
        suggestion: 'Please check MetaMask for pending transactions.'
      });
      throw error;
    } finally {
      setLoading(false);
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
    setResult(null);
    setBlockchainResult(null);
    
    try {
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
        // Set a timeout for the entire blockchain process
        const blockchainPromise = registerOnBlockchain(certificateData);
        const timeoutId = setTimeout(() => {
          setBlockchainResult({
            success: false,
            error: 'Blockchain registration is taking longer than expected. Check MetaMask for pending transactions or try again.'
          });
        }, 120000); // Increased to 120 seconds (2 minutes)
        
        await blockchainPromise;
        clearTimeout(timeoutId);
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
      `}</style>
    </div>
  );
}