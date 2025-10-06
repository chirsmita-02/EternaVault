import { useEffect, useState } from 'react';
import api from '../api';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);

  async function load() {
    const [u, c] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/claims')
    ]);
    setUsers(u.data);
    setClaims(c.data);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Admin</h2>
        <p className="muted">Overview of users and claims.</p>
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
    </div>
  );
}


