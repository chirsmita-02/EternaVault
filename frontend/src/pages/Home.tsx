//

export default function Home() {
  return (
    <div className="grid">
      {/* Global background is now in Layout */}
      {/* HERO */}
      <section className="hero-section reveal" style={{ textAlign: 'center' }}>
        <h1 className="heading" style={{ fontSize: 36 }}>EternaVault</h1>
        <p className="muted">Secure, Transparent, and Instant Verification of Death Certificates using Blockchain.</p>
        <div className="spacer" />
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {/* Flip Cards without navigation */}
          <FlipCard title="🔍 Verify Certificate" back="Check authenticity on-chain in seconds." />
          <FlipCard title="🧾 Submit Claim" back="Send claim details and track status." />
          <FlipCard title="🧱 Learn More" back="Understand the EternaVault process." />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works reveal">
        <h2 className="heading">How It Works</h2>
        <div className="grid how-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="how-card reveal">
            <h3 className="heading">Upload & Validate</h3>
            <p className="muted">Authorized registrar uploads and validates certificate.</p>
          </div>
          <div className="how-card reveal">
            <h3 className="heading">Blockchain Verification</h3>
            <p className="muted">Certificate hash anchored on-chain for immutability.</p>
          </div>
          <div className="how-card reveal">
            <h3 className="heading">Insurance Claim Access</h3>
            <p className="muted">Insurers verify authenticity instantly from the ledger.</p>
          </div>
        </div>
      </section>

      {/* CONTACT / FOOTER */}
      <footer className="contact-footer reveal">
        <div className="contact-left">
          <h3 className="heading" style={{ marginBottom: 6 }}>Contact & Support</h3>
          <div className="contact-lines">
            <div>Email: support@eternavault.gmail.com</div>
            <div>Phone no.: 1234567890</div>
            <div>Credits: GHRCEM, PUNE</div>
            <div>Team: Bhumika Pande, Chirsmita Thakur, Dhanish Kanithi</div>
          </div>
        </div>
        <div className="contact-right">
          <button className="powered-pill" type="button">Powered by Blockchain Technology</button>
        </div>
      </footer>
    </div>
  );
}

function FlipCard({ title, back }: { title: string; back: string }) {
  return (
    <div className="flip">
      <div className="flip-inner">
        <div className="flip-front card">{title}</div>
        <div className="flip-back card"><span className="muted">{back}</span></div>
      </div>
    </div>
  );
}