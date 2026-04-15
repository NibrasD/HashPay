import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatAmount, getTokenByAddress, getStatusInfo, shortenAddress } from '../utils/format';

export default function PayInvoice({ account, payInvoice, isPaying, nullpayRead, showToast }) {
  const [searchParams] = useSearchParams();
  const [invoiceId, setInvoiceId] = useState(searchParams.get('id') || '');
  const [salt, setSalt] = useState(searchParams.get('s') || '');
  const [merchant, setMerchant] = useState(searchParams.get('m') || '');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  // Auto-fetch invoice when ID is provided
  useEffect(() => {
    if (invoiceId && invoiceId.startsWith('0x') && nullpayRead) {
      fetchInvoice();
    }
  }, [invoiceId, nullpayRead]);

  const fetchInvoice = async () => {
    if (!nullpayRead || !invoiceId) return;
    setLoading(true);
    try {
      const inv = await nullpayRead.getInvoice(invoiceId);
      if (inv.createdAt > 0) {
        setInvoice(inv);
      } else {
        showToast('Invoice not found', 'error');
      }
    } catch (err) {
      showToast('Failed to fetch invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!invoiceId || !salt || !merchant) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    if (!account) {
      showToast('Please connect your wallet', 'error');
      return;
    }
    try {
      const result = await payInvoice(invoiceId, salt, merchant);
      setPaid(true);
      showToast('Payment successful! 🎉', 'success');
    } catch (err) {
      showToast(err.message || 'Payment failed', 'error');
    }
  };

  const tokenInfo = invoice ? getTokenByAddress(invoice.token) : null;
  const statusInfo = invoice ? getStatusInfo(invoice.status) : null;

  return (
    <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1 className="page-title">💸 Pay Invoice</h1>
        <p className="page-subtitle">Verify and pay a private invoice on HashKey Chain</p>
      </div>

      <div className="grid-2">
        {/* Payment Form */}
        <div className="glass-card">
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            Payment Details
          </h3>

          <div className="form-group">
            <label className="form-label">Invoice ID</label>
            <input
              type="text"
              className="form-input form-input-mono"
              placeholder="0x..."
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              id="pay-invoice-id"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Salt (from merchant)</label>
            <input
              type="text"
              className="form-input form-input-mono"
              placeholder="0x..."
              value={salt}
              onChange={(e) => setSalt(e.target.value)}
              id="pay-salt-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Merchant Address</label>
            <input
              type="text"
              className="form-input form-input-mono"
              placeholder="0x..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              id="pay-merchant-input"
            />
          </div>

          {!paid ? (
            <button
              className="btn btn-success btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={handlePay}
              disabled={isPaying || !account || !invoiceId}
              id="pay-invoice-btn"
            >
              {isPaying ? (
                <><span className="spinner"></span> Processing Payment...</>
              ) : !account ? (
                '🔗 Connect Wallet First'
              ) : (
                '💸 Pay Invoice'
              )}
            </button>
          ) : (
            <div className="glass-card animate-fade-in" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
              <h3 style={{ color: '#34d399', fontWeight: 700, marginBottom: '0.5rem' }}>Payment Successful!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                The invoice has been settled on HashKey Chain.
              </p>
            </div>
          )}
        </div>

        {/* Invoice Preview */}
        <div>
          {loading ? (
            <div className="glass-card loading-screen">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Fetching invoice...</p>
            </div>
          ) : invoice && invoice.createdAt > 0 ? (
            <div className="glass-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>📄 Invoice Details</h3>
                <span className={`badge ${statusInfo.class}`}>
                  {statusInfo.icon} {statusInfo.label}
                </span>
              </div>

              <div style={{ textAlign: 'center', padding: '1.5rem 0', borderBottom: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>AMOUNT</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                  {tokenInfo.icon} {formatAmount(invoice.amount, tokenInfo.decimals)}
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>{tokenInfo.symbol}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Type</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {['Standard', 'Campaign', 'Recurring'][Number(invoice.invoiceType)]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Created By</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    {shortenAddress(invoice.creator)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Token</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {tokenInfo.icon} {tokenInfo.symbol}
                  </span>
                </div>
              </div>

              {Number(invoice.status) !== 0 && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#f87171' }}>
                    ⚠️ This invoice is {statusInfo.label.toLowerCase()} and cannot be paid.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔍</div>
              <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Enter Invoice Details</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Paste the invoice ID to preview details, then fill in the salt and merchant address to pay.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
