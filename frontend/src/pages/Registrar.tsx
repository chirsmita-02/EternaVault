import { useMemo, useState } from 'react';
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

  const canSubmit = useMemo(() => !!address && !!file && !!fullName && !!dateOfDeath, [address, file, fullName, dateOfDeath]);

  async function connect() {
    const res = await connectMetaMask();
    if (res) {
      setAddress(res.address);
      // Ensure the wallet has registrar role automatically
      await ensureRegistrarRole(res.address);
      // Then check role (for UI state)
      checkUserRole(res.address);
    }
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
        const tx = await contract.selfRegisterRegistrar();
        await tx.wait();
      }
    } catch (e) {
      console.warn('Auto role assignment failed:', e);
    }
  }

  async function checkUserRole(walletAddress: string) {
    try {
      // Get the contract ABI
      const abi = [
        "function roles(address) view returns (uint8)"
      ];
      
      // Connect to the contract
      const { provider } = await connectMetaMask() as any;
      const contract = new ethers.Contract(
        import.meta.env.VITE_REGISTRY_ADDRESS || '',
        abi,
        provider
      );
      
      // Check if the current wallet has the required role
      const role = await contract.roles(walletAddress);
      
      // Role 1 is GovernmentRegistrar
      if (role !== 1) {
        // Auto self-register without admin approval
        await ensureRegistrarRole(walletAddress);
        const updatedRole = await contract.roles(walletAddress);
        if (updatedRole === 1) {
          setBlockchainResult({
            success: true,
            message: 'Wallet granted GovernmentRegistrar role automatically.'
          });
        } else {
          setBlockchainResult({
            success: false,
            error: 'Unable to assign GovernmentRegistrar role automatically.'
          });
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  }

  // Admin approval flow removed per product requirement

  async function registerOnBlockchain(certificateData: any) {
    try {
      setLoading(true);
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
        const txRole = await contract.selfRegisterRegistrar();
        await txRole.wait();
        role = await contract.roles(walletAddress);
      }
      
      // Convert hash to bytes32
      const certHash = '0x' + certificateData.hash;
      
      // Send transaction
      const tx = await contract.addCertificate(certHash, certificateData.cid);
      await tx.wait();
      
      setBlockchainResult({
        success: true,
        txHash: tx.hash,
        message: 'Certificate successfully registered on blockchain'
      });
      
      return tx.hash;
    } catch (error: any) {
      console.error('Blockchain registration error:', error);
      
      setBlockchainResult({
        success: false,
        error: error.message || 'Failed to register certificate on blockchain'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!file || !address) return;
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
      
      const { data: certificateData } = await api.post('/registrar/upload', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      
      setResult({ 
        ...certificateData, 
        wallet: address, 
        timestamp: new Date().toISOString() 
      });
      
      // Step 2: Register on blockchain
      try {
        await registerOnBlockchain(certificateData);
      } catch (blockchainError) {
        // Blockchain registration failed, but IPFS upload succeeded
        console.warn('Blockchain registration failed:', blockchainError);
      }
    } catch (e: any) {
      setResult({ error: e?.response?.data?.error || e.message });
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
          <button className="btn" onClick={connect}>{address ? `Connected: ${address.slice(0,6)}...${address.slice(-4)}` : 'Connect MetaMask'}</button>
          
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
              <label className="label">Certificate File (PDF/JPG/PNG)</label>
              <input className="file" accept=".pdf,.jpg,.jpeg,.png" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <button className="btn secondary" onClick={submit} disabled={!canSubmit || loading}>{loading ? 'Submitting…' : 'Upload & Record'}</button>
            <a className="link" href="/login">Back to Login</a>
          </div>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Processing certificate registration...</p>
            <p className="small">This may take a few moments</p>
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
              <div><strong>Hash:</strong> {result.hash}</div>
              <div><strong>CID:</strong> {result.ipfsCid}</div>
              <div><strong>Wallet:</strong> {result.wallet}</div>
              <div><strong>Timestamp:</strong> {result.timestamp}</div>
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
                    Contact your system administrator to assign the GovernmentRegistrar role to your wallet.
                  </p>
                )}
              </div>
            )}
            {blockchainResult.txHash && (
              <div className="code">
                <div><strong>Transaction Hash:</strong> {blockchainResult.txHash}</div>
                <div><a className="link" href={`https://amoy.polygonscan.com/tx/${blockchainResult.txHash}`} target="_blank" rel="noreferrer">View on Polygonscan</a></div>
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