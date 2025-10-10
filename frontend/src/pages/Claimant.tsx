import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Claimant() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchClaimantName, setSearchClaimantName] = useState('');
  const [searchDeceasedName, setSearchDeceasedName] = useState('');
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Claimant page auth check:', { token, userRole });
    
    if (!token || userRole !== 'claimant') {
      // Redirect to login if not authenticated or not claimant
      console.log('Redirecting to login - not authenticated as claimant');
      navigate('/login');
    } else {
      // Load user info if authenticated
      console.log('Loading claimant data');
      loadUserInfo();
    }
  }, [navigate]);

  const loadUserInfo = async () => {
    try {
      const response = await api.get('/claimant/profile');
      setUserInfo(response.data);
      // Pre-fill the claimant name with the logged-in user's name
      setSearchClaimantName(response.data.name);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user information');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchClaimantName || !searchDeceasedName) {
      setError('Both claimant name and deceased name are required');
      return;
    }
    
    setLoading(true);
    setError('');
    setSearchResults([]);
    
    try {
      // This will fetch verification status from MongoDB Atlas as requested
      const response = await api.get('/claimant/search', {
        params: {
          claimantName: searchClaimantName,
          deceasedName: searchDeceasedName
        }
      });
      setSearchResults(response.data.claims);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search claims');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Claim Verification Status</h2>
        <p className="muted">Search for claim verification status by entering claimant and deceased names</p>
      </div>

      {userInfo && (
        <div className="card">
          <h3 className="heading">User Information</h3>
          <div className="row">
            <div className="col">
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>Username/Email:</strong> {userInfo.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="heading">Search Verification Status</h3>
        <form className="form" onSubmit={handleSearch}>
          <div className="row">
            <label className="label">Claimant Name</label>
            <input 
              className="input" 
              placeholder="Enter claimant name" 
              value={searchClaimantName} 
              onChange={e => setSearchClaimantName(e.target.value)} 
            />
          </div>
          <div className="row">
            <label className="label">Deceased Name</label>
            <input 
              className="input" 
              placeholder="Enter deceased name" 
              value={searchDeceasedName} 
              onChange={e => setSearchDeceasedName(e.target.value)} 
            />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button 
            className="btn secondary" 
            type="button" 
            onClick={() => {
              setSearchClaimantName(userInfo?.name || '');
              setSearchDeceasedName('');
              setSearchResults([]);
              setError('');
            }}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Clear
          </button>
        </form>
      </div>

      {error && (
        <div className="card">
          <div className="error-message" style={{ color: 'red' }}>
            {error}
          </div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="card">
          <h3 className="heading">Search Results</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Claimant Name</th>
                  <th>Deceased Name</th>
                  <th>Certificate Hash</th>
                  <th>Verification Status</th>
                  <th>Verification Date</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(claim => (
                  <tr key={claim._id}>
                    <td>{claim.claimantName}</td>
                    <td>{claim.deceasedName}</td>
                    <td>{claim.certificateHash ? claim.certificateHash.substring(0, 10) + '...' : 'N/A'}</td>
                    <td>
                      <span className={
                        claim.verificationStatus === 'Approved' ? 'status-claimed' : 
                        claim.verificationStatus === 'Rejected' ? 'status-rejected' : 
                        'status-pending'
                      }>
                        {claim.verificationStatus}
                      </span>
                    </td>
                    <td>{claim.verifiedAt ? new Date(claim.verifiedAt).toLocaleDateString() : 'Not verified'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {searchResults.length === 0 && !loading && !error && (
        <div className="card">
          <p className="muted">Enter claimant and deceased names above to search for verification status</p>
        </div>
      )}

      <style>{`
        .table-container { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
          color: #333;
          border-bottom: 2px solid #dee2e6;
        }
        .status-claimed {
          color: #28a745;
          font-weight: bold;
        }
        .status-pending {
          color: #ffc107;
          font-weight: bold;
        }
        .status-rejected {
          color: #dc3545;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}