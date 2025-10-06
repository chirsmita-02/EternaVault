import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type RoleKey = 'registrar' | 'insurer' | 'claimant' | 'admin';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10,15}$/;
const usernameRegex = /^[A-Za-z0-9._-]{3,30}$/;

export default function Register() {
  const [role, setRole] = useState<RoleKey>('registrar');
  const [values, setValues] = useState<Record<string, string>>({});
  const [agree, setAgree] = useState(false);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  const config = useMemo(() => getRoleConfig(role), [role]);

  const validators: Record<string, (v: string) => boolean> = {
    email: v => emailRegex.test(v),
    phone: v => phoneRegex.test(v),
    password: v => v.length >= 8,
    username: v => usernameRegex.test(v),
    text: v => v.trim().length > 0,
  };

  const fields = config.fields;

  const validUpToIndex = fields.findIndex(f => !validateField(f, values[f.name] || '', validators));
  const revealCount = validUpToIndex === -1 ? fields.length : Math.max(1, validUpToIndex + 1);

  const allValid = fields.every(f => validateField(f, values[f.name] || '', validators)) && agree;

  function onChange(name: string, v: string) {
    setValues(prev => ({ ...prev, [name]: v }));
  }

  function onSubmit(e: any) {
    e.preventDefault();
    if (!allValid) return;
    setSubmittedMsg('Registration successful — you can now log in.');
    setTimeout(() => setSubmittedMsg(null), 3000);
  }

  return (
    <div className="login-wrap">
      {/* Left: form card */}
      <div className="login-card">
        <h2 className="heading" style={{ textAlign: 'center', marginBottom: 6 }}>{config.title}</h2>
      

        {/* Role selector */}
        <div className="row">
          <label className="label">Register as</label>
          <div className="role-row">
            {(['registrar','insurer','claimant','admin'] as RoleKey[]).map(r => (
              <label key={r} className={`role-pill ${role===r ? 'active' : ''}`}>
                <input type="radio" name="role" value={r} checked={role===r} onChange={() => { setRole(r); setValues({}); setAgree(false); }} />
                <span className="role-text">{roleLabel(r)}</span>
              </label>
            ))}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Choose the role that best describes you. The form below will change according to the selected role.</div>
        </div>

        {/* Dynamic form */}
        <form className="form" onSubmit={onSubmit}>
          {fields.slice(0, revealCount).map((f, idx) => (
            <motion.div key={f.name} className="row" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: idx * 0.03 }}>
              <label className="label">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea className="input input-neo" rows={4} placeholder={f.placeholder || ''} value={values[f.name] || ''} onChange={e => onChange(f.name, e.target.value)} />
              ) : (
                <input className="input input-neo" type={f.type} placeholder={f.placeholder || ''} value={values[f.name] || ''} onChange={e => onChange(f.name, e.target.value)} />
              )}
              {f.helper && <div className="muted" style={{ fontSize: 12 }}>{f.helper}</div>}
            </motion.div>
          ))}

          {/* Terms */}
          <div className="row" style={{ marginTop: 4 }}>
            <label className="label" style={{ display: 'none' }}>Terms</label>
            <label className="terms-line">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
              <span>{config.terms}</span>
            </label>
          </div>

          {/* Submit */}
          <button className={`btn neon-submit ${allValid ? '' : 'btn-disabled'}`} style={{ width: '100%' }} disabled={!allValid}>
            Submit
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="/login" className="muted">Already registered? Log in.</a>
        </div>

        {submittedMsg && (
          <motion.div className="sent-toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginTop: 12 }}>
            {submittedMsg}
          </motion.div>
        )}
      </div>

      {/* Right: decorative art with appear-from-top-right & scale-in animation */}
      <motion.div
        className="login-art"
        initial={{ opacity: 0, x: 80, y: -80, scale: 0.72 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={{ duration: 0.95, ease: 'easeOut' }}
        style={{ transformOrigin: '100% 0%' }}
      >
        <div className="bg-ribbons local" />
        <div className="art-blob">
          {/* Replace background-image in CSS with your chosen image */}
        </div>
      </motion.div>
    </div>
  );
}

function roleLabel(r: RoleKey) {
  switch (r) {
    case 'registrar': return 'Government Registrar';
    case 'insurer': return 'Insurance Company';
    case 'claimant': return 'Claimant';
    case 'admin': return 'Admin';
  }
}

function getRoleConfig(role: RoleKey) {
  switch (role) {
    case 'registrar':
      return {
        title: 'Government Registrar Registration',
        terms: 'I confirm I am a government official and wish to register.',
        fields: [
          { name: 'fullName', label: 'Full Name', type: 'text', helper: 'Official full name as on government records.' },
          { name: 'department', label: 'Department Name', type: 'text' },
          { name: 'email', label: 'Official Email ID', type: 'email', helper: 'Use your official government email.' },
          { name: 'address', label: 'Office Address', type: 'text', placeholder: 'City, State' },
          { name: 'username', label: 'Username', type: 'text' },
          { name: 'password', label: 'Password', type: 'password', helper: 'Minimum 8 characters.' },
        ],
      };
    case 'insurer':
      return {
        title: 'Insurance Company Registration',
        terms: 'I confirm I am authorized to register on behalf of the organization.',
        fields: [
          { name: 'company', label: 'Company Name', type: 'text' },
          { name: 'email', label: 'Email ID', type: 'email' },
          { name: 'orgAddress', label: 'Organization Address', type: 'text' },
          { name: 'phone', label: 'Contact Number', type: 'tel' },
          { name: 'username', label: 'Username', type: 'text' },
          { name: 'password', label: 'Password', type: 'password', helper: 'Minimum 8 characters.' },
        ],
      };
    case 'claimant':
      return {
        title: 'Claimant Registration',
        terms: 'I agree to the terms and privacy policy.',
        fields: [
          { name: 'fullName', label: 'Full Name', type: 'text' },
          { name: 'email', label: 'Email ID', type: 'email' },
          { name: 'phone', label: 'Phone Number', type: 'tel' },
          { name: 'address', label: 'Address (optional)', type: 'text' },
          { name: 'password', label: 'Password', type: 'password', helper: 'Minimum 8 characters.' },
        ],
      };
    case 'admin':
      return {
        title: 'Admin Registration',
        terms: 'I understand this account has administrative privileges.',
        fields: [
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'email', label: 'Email ID', type: 'email' },
          { name: 'username', label: 'Username', type: 'text' },
          { name: 'password', label: 'Password', type: 'password', helper: 'Choose a strong password.' },
        ],
      };
  }
}

function validateField(f: any, v: string, validators: Record<string,(v:string)=>boolean>) {
  if (f.name === 'email') return validators.email(v);
  if (f.name === 'phone') return validators.phone(v);
  if (f.name === 'password') return validators.password(v);
  if (f.name === 'username') return validators.username(v);
  if (f.optional) return true;
  return validators.text(v);
}



