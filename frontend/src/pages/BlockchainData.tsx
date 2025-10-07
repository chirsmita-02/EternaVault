import { useState, useEffect } from 'react';
import api from '../api';

export default function BlockchainData() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockchainData, setBlockchainData] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Fetch registered certificates from the database
  useEffect(() => {
    fetchCertificates();
  }, []);

  async function fetchCertificates() {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/insurer/certificates');
      setCertificates(response.data.certificates);
    } catch (err: any) {
      setError('Failed to fetch certificates: ' + (err.response?.data?.error || err.message));
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Function to get detailed blockchain data for a certificate
  async function getCertificateDetails(cert: any) {
    setVerifying(true);
    setBlockchainData(null);
    setError('');
    
    try {
      const response = await api.get(`/insurer/certificate/${cert.hash}`);
      setBlockchainData(response.data);
      setVerifying(false);
    } catch (err: any) {
      setError('Failed to fetch blockchain data: ' + (err.response?.data?.error || err.message));
      console.error('Fetch error:', err);
      setVerifying(false);
    }
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Blockchain Data Viewer</h2>
        <p className="muted">View certificates stored on the blockchain</p>
        
        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}
        
        <div className="card">
          <h3 className="heading">Registered Certificates</h3>
          {loading ? (
            <p>Loading certificates...</p>
          ) : certificates.length === 0 ? (
            <p>No registered certificates found.</p>
          ) : (
            <div className="certificate-list">
              {certificates.map((cert) => (
                <div key={cert.id} className="certificate-item">
                  <div><strong>Full Name:</strong> {cert.fullName}</div>
                  <div><strong>Hash:</strong> {cert.hash.substring(0, 20)}...{cert.hash.substring(cert.hash.length - 20)}</div>
                  <div><strong>IPFS CID:</strong> {cert.ipfsCid.substring(0, 20)}...{cert.ipfsCid.substring(cert.ipfsCid.length - 10)}</div>
                  <div><strong>Registrar:</strong> {cert.registrarWallet.substring(0, 10)}...{cert.registrarWallet.substring(cert.registrarWallet.length - 8)}</div>
                  <div><strong>Created:</strong> {new Date(cert.createdAt).toLocaleDateString()}</div>
                  <button 
                    className="btn secondary"
                    onClick={() => getCertificateDetails(cert)}
                  >
                    View Blockchain Data
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Blockchain Data Display */}
        {(verifying || blockchainData) && (
          <div className="card">
            <h3 className="heading">Blockchain Data</h3>
            {verifying ? (
              <div className="loading">
                <p>Retrieving data from blockchain...</p>
                <div className="spinner"></div>
              </div>
            ) : blockchainData && (
              <div className="blockchain-data">
                <div className={blockchainData.blockchainData.exists ? "verification-success" : "verification-failure"}>
                  <h4>
                    {blockchainData.blockchainData.exists 
                      ? "✅ Certificate Found on Blockchain" 
                      : "❌ Certificate Not Found"}
                  </h4>
                </div>
                
                {blockchainData.blockchainData.exists && (
                  <div className="data-section">
                    <h4>Database Information</h4>
                    <div className="data-grid">
                      <div className="data-item">
                        <strong>Full Name:</strong>
                        <span>{blockchainData.databaseData.fullName}</span>
                      </div>
                      <div className="data-item">
                        <strong>Certificate ID:</strong>
                        <span>{blockchainData.databaseData.certificateId}</span>
                      </div>
                      <div className="data-item">
                        <strong>Hash:</strong>
                        <span className="hash-text">{blockchainData.databaseData.hash}</span>
                      </div>
                      <div className="data-item">
                        <strong>IPFS CID:</strong>
                        <span className="hash-text">{blockchainData.databaseData.ipfsCid}</span>
                      </div>
                      <div className="data-item">
                        <strong>Registrar Wallet:</strong>
                        <span className="hash-text">{blockchainData.databaseData.registrarWallet}</span>
                      </div>
                      <div className="data-item">
                        <strong>Created At:</strong>
                        <span>{new Date(blockchainData.databaseData.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <h4>Blockchain Information</h4>
                    <div className="data-grid">
                      <div className="data-item">
                        <strong>IPFS CID:</strong>
                        <span className="hash-text">{blockchainData.blockchainData.ipfsCid}</span>
                      </div>
                      <div className="data-item">
                        <strong>Registrar Wallet:</strong>
                        <span className="hash-text">{blockchainData.blockchainData.registrar}</span>
                      </div>
                      <div className="data-item">
                        <strong>Block Timestamp:</strong>
                        <span>{blockchainData.blockchainData.blockTimestamp}</span>
                      </div>
                      <div className="data-item">
                        <strong>Human Readable Date:</strong>
                        <span>{new Date(blockchainData.blockchainData.timestamp * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <h4>Data Consistency Check</h4>
                    <div className="data-grid">
                      <div className="data-item">
                        <strong>IPFS CID Match:</strong>
                        <span className={blockchainData.consistencyCheck.ipfsCidMatch ? "success" : "error"}>
                          {blockchainData.consistencyCheck.ipfsCidMatch ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                      <div className="data-item">
                        <strong>Registrar Match:</strong>
                        <span className={blockchainData.consistencyCheck.registrarMatch ? "success" : "error"}>
                          {blockchainData.consistencyCheck.registrarMatch ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        .certificate-list {
          margin-top: 20px;
        }
        
        .certificate-item {
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          margin-bottom: 15px;
          background-color: #f9f9f9;
        }
        
        .certificate-item div {
          margin-bottom: 8px;
        }
        
        .certificate-item div strong {
          display: inline-block;
          width: 120px;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #007bff;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 10px auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .blockchain-data {
          margin-top: 20px;
        }
        
        .data-section {
          margin-top: 20px;
        }
        
        .data-section h4 {
          margin-top: 25px;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        
        .data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        @media (max-width: 768px) {
          .data-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .data-item {
          display: flex;
          flex-direction: column;
        }
        
        .data-item strong {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .data-item span {
          font-size: 16px;
          font-weight: 500;
        }
        
        .hash-text {
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
        }
        
        .success {
          color: #28a745;
          font-weight: bold;
        }
        
        .error {
          color: #dc3545;
          font-weight: bold;
        }
        
        .verification-success {
          padding: 15px;
          border-radius: 8px;
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .verification-failure {
          padding: 15px;
          border-radius: 8px;
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .alert-error {
          background-color: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
}