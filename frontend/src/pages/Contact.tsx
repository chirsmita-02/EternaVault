import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleChange(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: any) {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 2200);
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      {/* Funky heading + subtext */}
      <section className="hero-section" style={{ maxWidth: 980, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <motion.h1
          className="heading"
          style={{ fontSize: 34, background: 'linear-gradient(90deg, #A855F7, #22d3ee)', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '0 0 12px rgba(168,85,247,0.45)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Get in Touch ⚡
        </motion.h1>
        <motion.p
          className="muted"
          style={{ marginTop: 6, opacity: 0.9 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Got questions or feedback? Drop us a message — we’re all ears 👂💬
        </motion.p>
      </section>

      {/* Glassmorphic form */}
      <section style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div className="contact-glass">
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="row">
              <label className="label">Full Name</label>
              <input className="input input-neo" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
            </div>
            <div className="row">
              <label className="label">Email</label>
              <input className="input input-neo" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
            <div className="row">
              <label className="label">Message / Inquiry</label>
              <textarea className="input input-neo" name="message" value={form.message} onChange={handleChange} placeholder="How can we help?" rows={6} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn neon-submit" type="submit">Submit</button>
            </div>
          </form>
        </div>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.35 }}
            className="sent-toast"
          >
            Message sent successfully!
          </motion.div>
        )}
      </section>

      {/* Informational footer */}
      <footer className="contact-footer" style={{ marginTop: 10 }}>
        <div className="contact-left">
          <div className="contact-lines">
            <div>✉ Email: support@eternavault.gmail.com</div>
            <div>📞 Phone: 1234567890</div>
            <div>⚙ Credits: GHRCEM, Pune</div>
            <div>👥 Team: Bhumika Pande, Chirsmita Thakur, Dhanish Kanithi</div>
          </div>
        </div>
        <div className="contact-right">
          <span className="powered-pill" style={{ textAlign: 'center' }}>Powered by Blockchain Technology</span>
        </div>
      </footer>
    </div>
  );
}


