import { useEffect, useState } from 'react';
import api from '../api';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [roleRequests, setRoleRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [u, c, r] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/claims'),
      api.get('/admin/role-requests')
    ]);
    setUsers(u.data);
    setClaims(c.data);
    setRoleRequests(r.data.requests);
  }

  useEffect(() => { load(); }, []);

  async function processRoleRequest(walletAddress: string, action: 'approve' | 'reject') {
    try {
      setLoading(true);
      await api.post('/admin/process-role-request', { walletAddress, action });
      // Refresh the data
      load();
    } catch (error) {
      console.error('Error processing role request:', error);
      alert('Failed to process role request');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Admin Dashboard</h2>
        <p className="muted">Overview of users, claims, and role requests.</p>
      </div>
      
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="heading">Users</h3>
          <pre className="code">{JSON.stringify(users, null, 2)}</pre>
        </div>
        <div className="card">
          <h3 className="heading">Claims</h3>
          <pre className="code">{JSON.stringify(claims, null, 2)}</pre>
        </div>
      </div>
      
      <div className="card">
        <h3 className="heading">Role Requests</h3>
        {roleRequests.length === 0 ? (
          <p className="muted">No pending role requests</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Wallet Address</th>
                  <th>Role Requested</th>
                  <th>Requested At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roleRequests.map((request) => (
                  <tr key={request.walletAddress}>
                    <td>{request.walletAddress}</td>
                    <td>{request.role}</td>
                    <td>{new Date(request.requestedAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="btn small"
                        onClick={() => processRoleRequest(request.walletAddress, 'approve')}
                        disabled={loading}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn small secondary"
                        onClick={() => processRoleRequest(request.walletAddress, 'reject')}
                        disabled={loading}
                        style={{ marginLeft: '10px' }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style>{`
        .table-container {
          overflow-x: auto;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .table th,
        .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .btn.small {
          padding: 6px 12px;
          font-size: 14px;
        }
        
        .muted {
          color: #666;
        }
      `}</style>
    </div>
  );
}