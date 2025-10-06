import { useState } from 'react';
import api from '../api';

export default function Insurer() {
  const [file, setFile] = useState<File | null>(null);
  const [claimId, setClaimId] = useState('');
  const [result, setResult] = useState<any>(null);

  async function verify() {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('claimId', claimId);
    const { data } = await api.post('/insurer/verify', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setResult(data);
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Insurance Verification</h2>
        <p className="muted">Upload the received certificate to verify it against the blockchain.</p>
        <div className="form">
          <div className="row">
            <label className="label">Claim ID (optional)</label>
            <input className="input" placeholder="e.g. CLM-1293" value={claimId} onChange={e => setClaimId(e.target.value)} />
          </div>
          <div className="row">
            <label className="label">Certificate File</label>
            <input className="file" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <button className="btn" onClick={verify}>Verify</button>
        </div>
      </div>
      {result && (
        <div className="card">
          <h3 className="heading">Verification Result</h3>
          <pre className="code">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


