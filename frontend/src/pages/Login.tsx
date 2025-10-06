import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Login() {
  const [role, setRole] = useState('registrar');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <div className="background-container">
      <div className="overlay">
        {/* Left branding text (content overlay) */}
        <motion.div className="left-content" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="brand-title">EternaVault</h1>
          <h2 className="brand-sub">Trust Beyond Time</h2>
          <p className="brand-desc">Secure and transparent death certificate verification powered by blockchain. Empowering insurers, registrars, and claimants with tamper-proof validation, reducing fraud and accelerating insurance claim settlements.</p>
        </motion.div>

        {/* Right glass card (form content unchanged) */}
        <motion.div className="login-form" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        <h2 className="heading" style={{ textAlign: 'center', marginBottom: 6 }}>Login to Your Account</h2>
        <p className="muted" style={{ textAlign: 'center', marginTop: 0, marginBottom: 16 }}>Select your role and enter your credentials.</p>

        <div className="form">
          <div className="row">
            <label className="label">Role</label>
            <select className="input input-neo" value={role} onChange={e => setRole(e.target.value)}>
              <option value="registrar">Registrar</option>
              <option value="insurer">Insurance</option>
              <option value="claimant">Claimant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="row">
            <label className="label">Username</label>
            <input className="input input-neo" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="row">
            <label className="label">Password</label>
            <input className="input input-neo" type="password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember Me
            </label>
            <a href="#" className="muted" style={{ fontSize: 13 }}>Forgot Password?</a>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} className="btn primary-blue" style={{ width: '100%' }}>Login</motion.button>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 13 }}>Don’t have an account? <a href="/register">Register here</a></span>
          </div>
        </div>
        </motion.div>
      </div>
    </div>
  );
}



