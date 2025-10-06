import { useMemo, useState } from 'react';
import { connectMetaMask } from '../wallet';
import api from '../api';

export default function Registrar() {
  const [address, setAddress] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const canSubmit = useMemo(() => !!address && !!file && !!fullName && !!dateOfDeath, [address, file, fullName, dateOfDeath]);

  async function connect() {
    const res = await connectMetaMask();
    if (res) setAddress(res.address);
  }

  async function submit() {
    if (!file || !address) return;
    setLoading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('fullName', fullName);
      form.append('dateOfDeath', dateOfDeath);
      form.append('causeOfDeath', causeOfDeath);
      form.append('wallet', address);
      const { data } = await api.post('/registrar/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult({ ...data, wallet: address, timestamp: new Date().toISOString() });
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
              {result.txHash && <div><strong>Tx Hash:</strong> {result.txHash}</div>}
              <div><a className="link" href={`https://ipfs.io/ipfs/${result.ipfsCid}`} target="_blank" rel="noreferrer">View on IPFS</a></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


