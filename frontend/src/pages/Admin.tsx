import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

type RoleKey = 'registrar' | 'insurer' | 'claimant';

interface UserRow {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: RoleKey | 'admin';
  status: 'active' | 'removed';
  raw?: any;
}

export default function Admin() {
  const [registrars, setRegistrars] = useState<UserRow[]>([]);
  const [insurers, setInsurers] = useState<UserRow[]>([]);
  const [claimants, setClaimants] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    console.log('Admin page component mounting...');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('Admin page auth check:', { token, userRole });
    
    if (!token || userRole !== 'admin') {
      // Redirect to login if not authenticated or not admin
      console.log('Redirecting to login - not authenticated as admin');
      navigate('/login');
    } else {
      // Load data if authenticated
      console.log('Loading admin data');
      loadAll();
    }
  }, [navigate]);

  // Function to show toast notifications
  const showToast = (type: 'success' | 'error', msg: string) => {
    console.log(`Showing toast: ${type} - ${msg}`);
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  function normalize(u: any): UserRow {
    console.log('Normalizing user:', u);
    const role = u.role as RoleKey | 'admin';
    // Get username based on role
    let username;
    if (role === 'registrar') {
      username = u?.registrarInfo?.employeeId || u.username;
    } else if (role === 'insurer') {
      username = u?.insurerInfo?.licenseNumber || u.username;
    } else {
      username = u.username;
    }
    
    const normalized = {
      id: String(u._id || u.id),
      name: u.name || u.fullName || 'User',
      email: u.email,
      role,
      username,
      // Use the user's status or default to active
      status: u.status || 'active',
      raw: u,
    };
    
    console.log('Normalized user result:', normalized);
    return normalized;
  }

  async function fetchUsersByRole(role: RoleKey): Promise<UserRow[]> {
    try {
      console.log(`Fetching users for role: ${role}`);
      // Fetch all users and filter by role on frontend to ensure we get all records
      const res = await api.get(`/admin/users`);
      console.log(`Received ${res.data?.users?.length || 0} total users from API`, res.data);
      const filteredUsers = (res.data?.users || []).filter((u: any) => u.role === role);
      const list = filteredUsers.map(normalize) as UserRow[];
      console.log(`Filtered and normalized ${list.length} ${role}s`);
      return list;
    } catch (e: any) {
      console.error(`Failed to fetch ${role}s:`, e);
      showToast('error', `Failed to fetch ${role}s: ${e?.response?.data?.error || e.message}`);
      return [];
    }
  }

  async function loadAll() {
    console.log('Loading all user data...');
    setLoading(true);
    try {
      // Fetch all users once and filter on frontend
      const res = await api.get(`/admin/users`);
      console.log(`Received ${res.data?.users?.length || 0} total users from API`, res.data);
      
      const allUsers = (res.data?.users || []).map(normalize) as UserRow[];
      
      // Filter users by role
      const registrars = allUsers.filter(u => u.role === 'registrar');
      const insurers = allUsers.filter(u => u.role === 'insurer');
      const claimants = allUsers.filter(u => u.role === 'claimant');
      
      console.log('Data loaded:', { registrars: registrars.length, insurers: insurers.length, claimants: claimants.length });
      console.log('Detailed data:', { registrars, insurers, claimants });
      setRegistrars(registrars);
      setInsurers(insurers);
      setClaimants(claimants);
    } catch (e: any) {
      console.error('Failed to load users:', e);
      showToast('error', e?.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    console.log('LoadAll useEffect triggered');
  }, []);

  async function onRemove(userId: string) {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.delete(`/admin/users/${userId}`);
      showToast('success', 'User removed successfully');
      await loadAll(); // Refresh the data
    } catch (e: any) {
      showToast('error', e?.response?.data?.error || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  }

  const filtered = (rows: UserRow[]) => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.username || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q)
    );
  };

  // Calculate summary statistics
  const summaryStats = {
    totalRegistrars: registrars.length,
    totalInsurers: insurers.length,
    totalClaimants: claimants.length,
    activeRegistrars: registrars.filter(u => u.status === 'active').length,
    activeInsurers: insurers.filter(u => u.status === 'active').length,
    activeClaimants: claimants.filter(u => u.status === 'active').length,
  };

  function Table({ title, rows }: { title: string; rows: UserRow[] }) {
    const data = useMemo(() => filtered(rows), [rows, query]);
    return (
      <div className="card">
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="heading" style={{ margin: 0 }}>{title}</h3>
          <div className="small muted">Total: {rows.length} | Showing: {data.length}</div>
        </div>
        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="muted">No users found</td>
                </tr>
              ) : data.map(u => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.username || '-'}</td>
                  <td>
                    <span className={u.status === 'removed' ? 'status-removed' : 'status-active'}>
                      {u.status === 'removed' ? 'Removed' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <button className="btn small" onClick={() => setViewing(u)}>View</button>
                    <button 
                      className="btn small secondary" 
                      style={{ marginLeft: 8 }} 
                      onClick={() => onRemove(u.id)} 
                      disabled={loading}
                    >
                      {loading ? 'Removing...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Admin Dashboard</h2>
        <p className="muted">Manage Government Registrars, Insurance Companies, and Claimants.</p>
        <div className="row" style={{ gap: 12, marginTop: 8 }}>
          <input 
            className="input" 
            placeholder="Search name / username / email" 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
          />
          <button className="btn secondary" onClick={loadAll} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card summary-card">
          <div className="heading">Government Registrars</div>
          <div className="stats">
            <div className="stat-number">{summaryStats.totalRegistrars}</div>
            <div className="stat-detail">{summaryStats.activeRegistrars} Active</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="heading">Insurance Companies</div>
          <div className="stats">
            <div className="stat-number">{summaryStats.totalInsurers}</div>
            <div className="stat-detail">{summaryStats.activeInsurers} Active</div>
          </div>
        </div>
        <div className="card summary-card">
          <div className="heading">Claimants</div>
          <div className="stats">
            <div className="stat-number">{summaryStats.totalClaimants}</div>
            <div className="stat-detail">{summaryStats.activeClaimants} Active</div>
          </div>
        </div>
      </div>

      {/* User Tables */}
      <Table title="Government Registrars" rows={registrars} />
      <Table title="Insurance Companies" rows={insurers} />
      <Table title="Claimants" rows={claimants} />

      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* User Detail Modal */}
      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="heading" style={{ marginTop: 0 }}>User Details</h3>
            <pre className="code" style={{ maxHeight: 300, overflow: 'auto' }}>
              {JSON.stringify(viewing.raw, null, 2)}
            </pre>
            <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn secondary" onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
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
        .btn.small { padding: 6px 12px; font-size: 14px; }
        .toast { 
          position: fixed; 
          right: 20px; 
          bottom: 20px; 
          padding: 12px 16px; 
          border-radius: 8px; 
          color: #fff; 
          z-index: 1000;
          animation: fadeIn 0.3s;
        }
        .toast.success { background: #28a745; }
        .toast.error { background: #dc3545; }
        .modal-overlay { 
          position: fixed; 
          inset: 0; 
          background: rgba(0,0,0,0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 1000; 
        }
        .modal { 
          background: #fff; 
          padding: 20px; 
          border-radius: 10px; 
          width: min(720px, 90vw); 
          max-height: 80vh; 
          overflow: auto; 
        }
        .summary-card {
          padding: 20px;
          text-align: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-card .heading {
          font-size: 16px;
          margin-bottom: 10px;
        }
        .stats {
          margin-top: 10px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
        }
        .stat-detail {
          font-size: 14px;
          color: #666;
        }
        .status-active {
          color: #28a745;
          font-weight: bold;
        }
        .status-removed {
          color: #dc3545;
          font-weight: bold;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}