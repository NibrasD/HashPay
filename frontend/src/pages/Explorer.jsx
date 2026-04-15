import React, { useState, useEffect } from 'react';
import InvoiceCard from '../components/InvoiceCard';
import { formatAmount, formatNumber, shortenHash, copyToClipboard } from '../utils/format';

export default function Explorer({ nullpayRead, showToast }) {
  const [invoiceIds, setInvoiceIds] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, settled: 0, volume: '0' });
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  useEffect(() => {
    if (nullpayRead) fetchRecent();
  }, [nullpayRead]);

  const fetchRecent = async () => {
    if (!nullpayRead) return;
    setLoading(true);
    try {
      const [total, settled, volume] = await nullpayRead.getStats();
      setStats({ total: Number(total), settled: Number(settled), volume: volume.toString() });

      const ids = await nullpayRead.getRecentInvoices(20);
      setInvoiceIds(ids || []);

      const details = await Promise.all(
        (ids || []).map(async (id) => {
          try {
            const inv = await nullpayRead.getInvoice(id);
            return { ...inv, id };
          } catch { return null; }
        })
      );
      setInvoices(details.filter(Boolean));
    } catch (err) {
      console.error('Explorer fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!nullpayRead || !searchId) return;
    try {
      const inv = await nullpayRead.getInvoice(searchId);
      if (inv.createdAt > 0) {
        setSearchResult({ ...inv, id: searchId });
        showToast('Invoice found!', 'success');
      } else {
        setSearchResult(null);
        showToast('Invoice not found', 'error');
      }
    } catch {
      showToast('Invalid invoice ID', 'error');
    }
  };

  return (
    <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1 className="page-title">🔍 Invoice Explorer</h1>
        <p className="page-subtitle">Browse and search invoices on HashKey Chain</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card animate-fade-in">
          <div className="stat-icon">📄</div>
          <div className="stat-value">{formatNumber(stats.total)}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card animate-fade-in animate-delay-1">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{formatNumber(stats.settled)}</div>
          <div className="stat-label">Settled</div>
        </div>
        <div className="stat-card animate-fade-in animate-delay-2">
          <div className="stat-icon">💎</div>
          <div className="stat-value">{formatAmount(stats.volume, 18, 2)}</div>
          <div className="stat-label">Total Volume (HSK)</div>
        </div>
        <div className="stat-card animate-fade-in animate-delay-3">
          <div className="stat-icon">📈</div>
          <div className="stat-value">
            {stats.total > 0 ? ((stats.settled / stats.total) * 100).toFixed(0) : 0}%
          </div>
          <div className="stat-label">Settlement Rate</div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Search by Invoice ID</label>
            <input
              className="form-input form-input-mono"
              placeholder="0x..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              id="explorer-search"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSearch} style={{ marginBottom: 0 }} id="explorer-search-btn">
            🔍 Search
          </button>
        </div>

        {searchResult && (
          <div style={{ marginTop: '1.25rem' }}>
            <InvoiceCard
              invoice={searchResult}
              invoiceId={searchResult.id}
              onClick={() => { copyToClipboard(searchResult.id); showToast('Invoice ID copied!', 'info'); }}
            />
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>
        📋 Recent Invoices
      </h2>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading recent invoices...</p>
        </div>
      ) : invoices.length > 0 ? (
        <div className="invoices-grid">
          {invoices.map((inv, i) => (
            <InvoiceCard
              key={inv.id || i}
              invoice={inv}
              invoiceId={inv.id}
              onClick={() => { copyToClipboard(inv.id); showToast('Invoice ID copied!', 'info'); }}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-title">No Invoices Yet</h3>
          <p className="empty-state-desc">
            {nullpayRead
              ? 'No invoices have been created on-chain yet. Be the first!'
              : 'Contracts not deployed. Deploy to HashKey Chain to see live data.'}
          </p>
        </div>
      )}
    </div>
  );
}
