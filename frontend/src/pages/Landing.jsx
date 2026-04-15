import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing({ account, onConnect }) {
  const features = [
    {
      icon: '🔒',
      title: 'Privacy-First Invoices',
      desc: 'Merchant addresses and amounts are hashed with keccak256 before storing on-chain. Only the hash is public — details remain private.',
    },
    {
      icon: '⚡',
      title: 'Instant Settlement',
      desc: 'Built on HashKey Chain L2 for fast, low-cost transactions. Pay and settle invoices in seconds, not minutes.',
    },
    {
      icon: '💎',
      title: 'Multi-Token Support',
      desc: 'Accept payments in HSK, USDC, USDT, or any ERC20 token on HashKey Chain. Full flexibility for merchants.',
    },
    {
      icon: '🏦',
      title: 'HSP Payment Channels',
      desc: 'HashKey Settlement Protocol integration with escrow-based payment channels for recurring billing and streaming payments.',
    },
    {
      icon: '📱',
      title: 'QR Code Payments',
      desc: 'Generate shareable QR codes and payment links. Scan and pay instantly from any device with MetaMask.',
    },
    {
      icon: '🧾',
      title: 'Dual Receipts',
      desc: 'Every payment generates cryptographic receipts for both payer and merchant, enabling verifiable proof of purchase.',
    },
  ];

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero-badge">
          🚀 Built on HashKey Chain · PayFi Track
        </div>

        <h1 className="hero-title">
          <span className="gradient-text">Private Payments</span>
          <br />
          on HashKey Chain
        </h1>

        <p className="hero-description">
          HashPay HSK is a privacy-first invoice and payment protocol.
          Create private invoices, send anonymous payments, and manage
          settlement channels — all powered by zero-knowledge hashing
          on HashKey Chain.
        </p>

        <div className="hero-actions">
          {account ? (
            <>
              <Link to="/create" className="btn btn-primary btn-lg" id="cta-create">
                📝 Create Invoice
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn-lg" id="cta-dashboard">
                📊 Dashboard
              </Link>
            </>
          ) : (
            <>
              <button className="btn btn-primary btn-lg" onClick={onConnect} id="cta-connect">
                🔗 Connect Wallet
              </button>
              <Link to="/explorer" className="btn btn-secondary btn-lg" id="cta-explore">
                🔍 Explore
              </Link>
            </>
          )}
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">∞</div>
            <div className="hero-stat-label">Privacy Level</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">&lt; 2s</div>
            <div className="hero-stat-label">Settlement Time</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">$0.01</div>
            <div className="hero-stat-label">Avg Gas Fee</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">3+</div>
            <div className="hero-stat-label">Supported Tokens</div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="page-container">
        <div className="section-divider"></div>

        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            How It <span className="gradient-text" style={{ background: 'var(--gradient-secondary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Works</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
            Privacy-preserving payments in three simple steps using commit-reveal cryptography
          </p>
        </div>

        <div className="grid-3" style={{ marginBottom: '3rem' }}>
          {[
            { step: '01', title: 'Create Invoice', desc: 'Merchant creates an invoice. Amount and address are hashed with a secret salt — only the hash goes on-chain.', icon: '📝' },
            { step: '02', title: 'Share Payment Link', desc: 'A unique payment link with the invoice ID, salt, and merchant address is generated. Share via QR code or URL.', icon: '🔗' },
            { step: '03', title: 'Verify & Pay', desc: 'Payer reveals the preimage (salt + merchant). The smart contract verifies the hash matches and executes the payment.', icon: '✅' },
          ].map((item, i) => (
            <div key={i} className="glass-card animate-fade-in" style={{ textAlign: 'center', animationDelay: `${i * 0.15}s` }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-accent)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                STEP {item.step}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="section-divider"></div>

        {/* Features */}
        <div className="features-section" id="features-section">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              <span className="gradient-text" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Powerful</span> Features
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
              Everything you need for private, compliant payments on HashKey Chain
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-divider"></div>

        {/* Tech Stack */}
        <div style={{ textAlign: 'center', padding: '2rem 0 4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Built With
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              { name: 'HashKey Chain', icon: '⛓️' },
              { name: 'Solidity', icon: '📜' },
              { name: 'React', icon: '⚛️' },
              { name: 'ethers.js', icon: '🔧' },
              { name: 'MetaMask', icon: '🦊' },
            ].map((tech, i) => (
              <div key={i} className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{tech.icon}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
