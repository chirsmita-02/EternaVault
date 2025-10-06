import { useState } from 'react';
import { connectMetaMask } from '../wallet';
import api from '../api';

export default function Registrar() {
  const [address, setAddress] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [certificateId, setCertificateId] = useState('');
  const [result, setResult] = useState<any>(null);

  async function connect() {
    const res = await connectMetaMask();
    if (res) setAddress(res.address);
  }

  async function submit() {
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('certificateId', certificateId);
    form.append('wallet', address);
    const { data } = await api.post('/registrar/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setResult(data);
  }

  return (
    <div className="grid">
      <div className="hero-section">
        <h2 className="heading">Registrar</h2>
        <p className="muted">Upload the death certificate. We’ll hash it, store on IPFS, and record on chain.</p>
        <div className="spacer" />
        <div className="stack">
          <button className="btn" onClick={connect}>{address ? `Connected: ${address}` : 'Connect MetaMask'}</button>
          <div className="form">
            <div className="row">
              <label className="label">Certificate ID</label>
              <input className="input" placeholder="e.g. CERT-2025-0001" value={certificateId} onChange={e => setCertificateId(e.target.value)} />
            </div>
            <div className="row">
              <label className="label">Certificate File</label>
              <input className="file" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <button className="btn secondary" onClick={submit}>Upload & Record</button>
          </div>
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


