import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

export default function About() {
  return (
    <div className="grid" style={{ gap: 32 }}>
      {/* Row 1 */}
      <section className="hero-section" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="zig">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <h1 className="heading" style={{ fontSize: 32, marginBottom: 12 }}>Empowering Trust with Blockchain</h1>
            <div className="divider-anim" style={{ animation: 'growWidth 1s ease-out forwards' }} />
            <p className="muted" style={{ marginTop: 12 }}>
              EternaVault is a blockchain-powered platform that makes death certificate verification and insurance claim
              processing secure, transparent, and instant. By combining blockchain, smart contracts, and IPFS, we turn every
              certificate into a tamper-proof digital record, fostering trust between governments, insurers, and citizens.
            </p>
          </motion.div>
          <motion.div className="about-icon" initial={{ opacity: 0, scale: 0.92, rotate: -2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'anticipate' }}>
            <div style={{ width: '100%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', aspectRatio: '16 / 10' }}>
              <motion.img
                src="/images/empower.jpg"
                alt="Empowering trust with blockchain"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Row 2 */}
      <section className="hero-section" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="zig reverse">
          <motion.div className="about-icon" initial={{ opacity: 0, scale: 0.92, rotate: 2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'anticipate' }}>
            <div style={{ width: '100%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', aspectRatio: '16 / 10' }}>
              <motion.img
                src="/images/power.jpg"
                alt="Our Purpose"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <h2 className="heading" style={{ marginBottom: 8 }}>Our Purpose</h2>
            <div className="divider-anim" style={{ animation: 'growWidth 1s .1s ease-out forwards' }} />
            <p className="muted" style={{ marginTop: 12 }}>
              To eliminate document fraud and simplify insurance verification — ensuring no false claims or forged certificates
              enter the system. We aim to build a digital trust bridge between government offices and insurance providers
              where every document is immutable, verifiable, and accessible anywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Row 3 */}
      <section className="hero-section" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="zig">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <h2 className="heading" style={{ marginBottom: 8 }}>How It Works</h2>
            <div className="divider-anim" style={{ animation: 'growWidth 1s .2s ease-out forwards' }} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12 }}>
              <div className="step-card"><h3 className="heading">1️⃣ Government Upload (MetaMask)</h3><p className="muted">Registrar logs in with MetaMask, uploads a verified death certificate, and the system stores its SHA-256 hash on the blockchain.</p></div>
              <div className="step-card"><h3 className="heading">2️⃣ Claimant Submission</h3><p className="muted">The claimant files an insurance claim through a simple web interface.</p></div>
              <div className="step-card"><h3 className="heading">3️⃣ Insurance Verification</h3><p className="muted">Insurers verify authenticity by fetching the certificate hash directly from the blockchain.</p></div>
              <div className="step-card"><h3 className="heading">4️⃣ Admin Oversight</h3><p className="muted">Admin supervises and approves Government and Insurance accounts for system transparency.</p></div>
            </div>
          </motion.div>
          <motion.div className="about-icon" initial={{ opacity: 0, scale: 0.92, rotate: -2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'anticipate' }}>
            <div style={{ width: '100%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', aspectRatio: '16 / 10' }}>
              <motion.img
                src="/images/works.jpg"
                alt="How It Works"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Row 4 */}
      <section className="hero-section" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="zig reverse">
          <motion.div className="about-icon" initial={{ opacity: 0, scale: 0.92, rotate: 2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'anticipate' }}>
            <div style={{ width: '100%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', aspectRatio: '16 / 10' }}>
              <motion.img
                src="/images/why.jpg"
                alt="Why EternaVault"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <h2 className="heading" style={{ marginBottom: 8 }}>Why EternaVault</h2>
            <div className="divider-anim" style={{ animation: 'growWidth 1s .2s ease-out forwards' }} />
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 12 }}>
              <div className="step-card"><h3 className="heading">🔒 Immutable Proof</h3><p className="muted">Blockchain ensures every certificate is tamper-proof.</p></div>
              <div className="step-card"><h3 className="heading">⚡ Instant Verification</h3><p className="muted">Insurers validate authenticity within seconds.</p></div>
              <div className="step-card"><h3 className="heading">🌐 Decentralized System</h3><p className="muted">No single authority, no manipulation.</p></div>
              <div className="step-card"><h3 className="heading">💡 User-First Design</h3><p className="muted">Clean and intuitive experience for all roles.</p></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Row 5 */}
      <section className="hero-section" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="zig">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <h2 className="heading" style={{ marginBottom: 8 }}>Our Vision</h2>
            <div className="divider-anim" style={{ animation: 'growWidth 1s .2s ease-out forwards' }} />
            <p className="muted" style={{ marginTop: 12 }}>
              To create a transparent and tamper-proof verification network where every death certificate and insurance claim
              is securely validated through blockchain.
            </p>
          </motion.div>
          <motion.div className="about-icon" initial={{ opacity: 0, scale: 0.92, rotate: -2 }} whileInView={{ opacity: 1, scale: 1, rotate: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: 'anticipate' }}>
            <div style={{ width: '100%', maxWidth: 420, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', aspectRatio: '16 / 10' }}>
              <motion.img
                src="/images/vision.jpg"
                alt="Our Vision"
                style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


