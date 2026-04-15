import React, { useState } from 'react';
import { generateInvoiceLink } from '../utils/crypto';
import { copyToClipboard } from '../utils/format';
import { TOKENS } from '../config/chains';

export default function CreateInvoice({ account, createInvoice, isCreating, lastInvoice, showToast }) {
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('HSK');
  const [invoiceType, setInvoiceType] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    if (!account) {
      showToast('Please connect your wallet first', 'error');
      return;
    }
    try {
      const result = await createInvoice(parseFloat(amount), token, invoiceType);
      showToast(`Invoice created successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create invoice', 'error');
    }
  };

  const handleCopyLink = async () => {
    if (lastInvoice) {
      const link = generateInvoiceLink(lastInvoice.invoiceId, lastInvoice.salt, lastInvoice.merchant);
      await copyToClipboard(link);
      setLinkCopied(true);
      showToast('Payment link copied!', 'success');
      setTimeout(() => setLinkCopied(false), 3000);
    }
  };

  const handleCopyId = async () => {
    if (lastInvoice?.invoiceId) {
      await copyToClipboard(lastInvoice.invoiceId);
      showToast('Invoice ID copied!', 'success');
    }
  };

  const handleCopySalt = async () => {
    if (lastInvoice?.salt) {
      await copyToClipboard(lastInvoice.salt);
      showToast('Salt copied — keep it secret!', 'info');
    }
  };

  return (
    <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1 className="page-title">📝 Create Invoice</h1>
        <p className="page-subtitle">Create a privacy-preserving invoice on HashKey Chain</p>
      </div>

      <div className="grid-2">
        {/* Form */}
        <div className="glass-card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Invoice Details
          </h3>

          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="any"
                required
                id="invoice-amount-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Token</label>
              <select
                className="form-select"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                id="invoice-token-select"
              >
                {Object.entries(TOKENS).map(([key, t]) => (
                  <option key={key} value={key}>
                    {t.icon} {t.symbol} — {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Invoice Type</label>
              <select
                className="form-select"
                value={invoiceType}
                onChange={(e) => setInvoiceType(Number(e.target.value))}
                id="invoice-type-select"
              >
                <option value={0}>📄 Standard (Single Payment)</option>
                <option value={1}>🎯 Campaign (Multi-Payment)</option>
                <option value={2}>🔄 Recurring</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isCreating || !account}
              style={{ width: '100%', marginTop: '0.5rem' }}
              id="create-invoice-btn"
            >
              {isCreating ? (
                <><span className="spinner"></span> Creating Invoice...</>
              ) : !account ? (
                '🔗 Connect Wallet First'
              ) : (
                '🔒 Create Private Invoice'
              )}
            </button>
          </form>
        </div>

        {/* Privacy Info / Result */}
        <div>
          {lastInvoice ? (
            <div className="glass-card animate-fade-in" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#34d399' }}>Invoice Created!</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <div className="form-label">Invoice ID</div>
                  <div className="copy-field">
                    <code>{lastInvoice.invoiceId}</code>
                    <button className="copy-btn" onClick={handleCopyId}>📋</button>
                  </div>
                </div>

                <div>
                  <div className="form-label">Salt (Secret — Keep Safe!)</div>
                  <div className="copy-field" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                    <code>{lastInvoice.salt}</code>
                    <button className="copy-btn" onClick={handleCopySalt}>📋</button>
                  </div>
                  <div className="form-hint" style={{ color: '#fbbf24' }}>
                    ⚠️ The salt is required for payment. Share it only with the payer.
                  </div>
                </div>

                <div>
                  <div className="form-label">Amount</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700 }}>
                    {TOKENS[lastInvoice.token]?.icon} {lastInvoice.amount} {lastInvoice.token}
                  </div>
                </div>

                <button
                  className="btn btn-success btn-lg"
                  onClick={handleCopyLink}
                  style={{ width: '100%' }}
                  id="copy-payment-link-btn"
                >
                  {linkCopied ? '✅ Link Copied!' : '🔗 Copy Payment Link'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>
                🔐 How Privacy Works
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: '🎲', title: 'Salt Generation', desc: 'A 256-bit random salt is generated client-side using crypto.getRandomValues() — never leaves your browser.' },
                  { icon: '#️⃣', title: 'Hash Commitment', desc: 'Your address + amount + salt are hashed with keccak256. Only the hash is stored on-chain.' },
                  { icon: '🔗', title: 'Payment Link', desc: 'A shareable link with the invoice ID, salt, and your address is created for the payer.' },
                  { icon: '✅', title: 'Verify & Pay', desc: 'The payer reveals the preimage. The contract verifies the hash and executes the payment atomically.' },
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{step.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{step.title}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
