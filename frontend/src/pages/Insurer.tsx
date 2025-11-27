import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Insurer() {
  const [file, setFile] = useState<File | null>(null);
  const [claimantName, setClaimantName] = useState('');
  const [deceasedName, setDeceasedName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'insurer') {
      // Redirect to login if not authenticated or not insurer
      navigate('/login');
    }
  }, [navigate]);

  async function verify() {
    if (!file) {
      setError('Please select a certificate file');
      return;
    }
    
    if (!deceasedName) {
      setError('Please enter the deceased name');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('claimantName', claimantName);
      form.append('deceasedName', deceasedName);
      
      console.log('Sending verification request...');
      const response = await api.post('/insurer/verify', form, { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('Received response:', response.data);
      setResult(response.data);
    } catch (err: any) {
      console.error('Verification error:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout. The verification is taking longer than expected. Please try again.');
      } else if (err.response) {
        // Server responded with error
        setError(err.response.data.error || 'Verification failed. Please try again.');
      } else if (err.request) {
        // Request was made but no response received
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else {
        // Something else happened
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Insurance Verification</h2>
        <p className="muted">Upload the received certificate to verify it against the blockchain.</p>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        
        <div className="form">
          <div className="row">
            <label className="label">Claimant Name</label>
            <input 
              className="input" 
              placeholder="Enter claimant name" 
              value={claimantName} 
              onChange={e => setClaimantName(e.target.value)} 
            />
          </div>
          
          <div className="row">
            <label className="label">Deceased Name</label>
            <input 
              className="input" 
              placeholder="Enter deceased name" 
              value={deceasedName} 
              onChange={e => setDeceasedName(e.target.value)} 
            />
          </div>
          
          <div className="row">
            <label className="label">Death Certificate File</label>
            <input 
              className="input" 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] || null)} 
            />
          </div>
          
          <button 
            className="btn" 
            onClick={verify} 
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify Certificate'}
          </button>
        </div>
      </div>
      
      {/* Loading Indicator */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verifying certificate against blockchain...</p>
            <p className="small">This may take a few moments</p>
          </div>
        </div>
      )}
      
      {result && (
        <div className="card">
          <h3 className="heading">Verification Result</h3>
          <div className={result.verified ? "verification-success" : "verification-failure"}>
            <h4>{result.message}</h4>
            <div className="result-details">
              <p><strong>Verification Source:</strong> {result.verificationSource === 'blockchain' ? '✅ Blockchain (On-Chain)' : 'Database'}</p>
              <p><strong>Local Hash:</strong> {result.localHash}</p>
              <p><strong>Blockchain Record:</strong> {result.onchainData.exists ? 'Found' : 'Not Found'}</p>
              {result.onchainData.exists && (
                <>
                  <p><strong>IPFS CID:</strong> {result.onchainData.ipfsCid}</p>
                  <p><strong>Registrar Wallet:</strong> {result.onchainData.registrar}</p>
                  <p><strong>Timestamp:</strong> {new Date(result.onchainData.timestamp * 1000).toLocaleString()}</p>
                </>
              )}
            </div>
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
        
        .result-details {
          margin-top: 15px;
          padding: 10px;
          background-color: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }
        
        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
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
