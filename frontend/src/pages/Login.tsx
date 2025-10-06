import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [role, setRole] = useState('registrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      const { token } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      
      // Redirect based on role
      switch (role) {
        case 'registrar':
          navigate('/registrar');
          break;
        case 'insurer':
          navigate('/insurer');
          break;
        case 'claimant':
          navigate('/claimant');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

        <form className="form" onSubmit={handleSubmit}>
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
            <label className="label">Email</label>
            <input 
              className="input input-neo" 
              placeholder="Enter your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email"
              required
            />
          </div>
          <div className="row">
            <label className="label">Password</label>
            <input 
              className="input input-neo" 
              type="password" 
              placeholder="Enter your password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <div className="row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 13 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember Me
            </label>
            <a href="#" className="muted" style={{ fontSize: 13 }}>Forgot Password?</a>
          </div>
          {error && (
            <div className="error-message" style={{ color: 'red', fontSize: 14, marginBottom: 10, textAlign: 'center' }}>
              {error}
            </div>
          )}
          <motion.button 
            whileTap={{ scale: 0.98 }} 
            className="btn primary-blue" 
            style={{ width: '100%' }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </motion.button>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span className="muted" style={{ fontSize: 13 }}>Don’t have an account? <a href="/register">Register here</a></span>
          </div>
        </form>
        </motion.div>
      </div>
    </div>
  );
}