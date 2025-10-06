import { useState } from 'react';
import api from '../api';

export default function Claimant() {
  const [claimId, setClaimId] = useState('');
  const [certificateHash, setCertificateHash] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [result, setResult] = useState<any>(null);

  async function submit() {
    const { data } = await api.post('/claimant/submit', { claimantId: 'me', certificateHash, policyId });
    setResult(data);
  }

  async function status() {
    if (!claimId) return;
    const { data } = await api.get(`/claimant/status/${claimId}`);
    setResult(data);
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Claimant</h2>
        <p className="muted">Submit a claim with the certificate hash and your policy number. Track status below.</p>
        <div className="form">
          <div className="row">
            <label className="label">Certificate Hash (hex)</label>
            <input className="input" placeholder="0x..." value={certificateHash} onChange={e => setCertificateHash(e.target.value)} />
          </div>
          <div className="row">
            <label className="label">Policy ID</label>
            <input className="input" placeholder="POL-0001" value={policyId} onChange={e => setPolicyId(e.target.value)} />
          </div>
          <button className="btn" onClick={submit}>Submit Claim</button>
        </div>
      </div>
      <div className="card">
        <h3 className="heading">Check Claim Status</h3>
        <div className="form">
          <div className="row">
            <label className="label">Claim ID</label>
            <input className="input" placeholder="e.g. Mongo _id" value={claimId} onChange={e => setClaimId(e.target.value)} />
          </div>
          <button className="btn secondary" onClick={status}>Check Status</button>
        </div>
      </div>
      {result && (
        <div className="card">
          <h3 className="heading">Result</h3>
          <pre className="code">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


