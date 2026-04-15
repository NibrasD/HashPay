import React, { useState, useEffect } from 'react';
import InvoiceCard from '../components/InvoiceCard';
import { getLocalInvoices } from '../hooks/useInvoice';
import { formatAmount, formatNumber, shortenAddress } from '../utils/format';
import { generateInvoiceLink } from '../utils/crypto';
import { copyToClipboard } from '../utils/format';

export default function Dashboard({ account, nullpayRead, showToast }) {
  const [tab, setTab] = useState('created');
  const [invoiceIds, setInvoiceIds] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, settled: 0, volume: '0' });
  const [loading, setLoading] = useState(false);
  const [localInvoices, setLocalInvoices] = useState([]);

  useEffect(() => {
    setLocalInvoices(getLocalInvoices().filter(inv => inv.merchant?.toLowerCase() === account?.toLowerCase()));
  }, [account]);

  useEffect(() => {
    if (nullpayRead && account) {
      fetchData();
    }
  }, [nullpayRead, account, tab]);

  const fetchData = async () => {
    if (!nullpayRead || !account) return;
    setLoading(true);
    try {
      // Fetch stats
      const [total, settled, volume] = await nullpayRead.getStats();
      setStats({
        total: Number(total),
        settled: Number(settled),
        volume: volume.toString(),
      });

      // Fetch user invoices
      let ids;
      if (tab === 'created') {
        ids = await nullpayRead.getMerchantInvoices(account);
      } else {
        ids = await nullpayRead.getPayerHistory(account);
      }
      setInvoiceIds(ids || []);

      // Fetch invoice details
      const details = await Promise.all(
        (ids || []).slice(0, 20).map(async (id) => {
          try {
            const inv = await nullpayRead.getInvoice(id);
            return { ...inv, id };
          } catch {
            return null;
          }
        })
      );
      setInvoices(details.filter(Boolean));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceClick = async (invoice) => {
    // Find local invoice data for salt
    const localData = localInvoices.find(
      li => li.invoiceId === (invoice.id || invoice.invoiceId)
    );
    if (localData) {
      const link = generateInvoiceLink(localData.invoiceId, localData.salt, localData.merchant);
      await copyToClipboard(link);
      showToast('Payment link copied!', 'success');
    } else {
      const id = invoice.id || invoice.invoiceId;
      if (id) {
        await copyToClipboard(id);
        showToast('Invoice ID copied!', 'info');
      }
    }
  };

  if (!account) {
    return (
      <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <h2 className="empty-state-title">Connect Your Wallet</h2>
          <p className="empty-state-desc">Connect your wallet to view your merchant dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1 className="page-title">📊 Merchant Dashboard</h1>
        <p className="page-subtitle">
          Welcome back, <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)' }}>{shortenAddress(account)}</span>
        </p>
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
          <div className="stat-icon">📋</div>
          <div className="stat-value">{localInvoices.length}</div>
          <div className="stat-label">Local Invoices</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === 'created' ? 'active' : ''}`}
          onClick={() => setTab('created')}
        >
          📝 Created Invoices
        </button>
        <button
          className={`tab ${tab === 'paid' ? 'active' : ''}`}
          onClick={() => setTab('paid')}
        >
          💸 Payments Made
        </button>
        <button
          className={`tab ${tab === 'local' ? 'active' : ''}`}
          onClick={() => setTab('local')}
        >
          💾 Local History
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading invoices...</p>
        </div>
      ) : tab === 'local' ? (
        localInvoices.length > 0 ? (
          <div className="invoices-grid">
            {localInvoices.map((inv, i) => (
              <InvoiceCard
                key={inv.invoiceId || i}
                invoice={inv}
                invoiceId={inv.invoiceId}
                onClick={() => handleInvoiceClick(inv)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Local Invoices</h3>
            <p className="empty-state-desc">Invoices you create will appear here with their secret salts.</p>
          </div>
        )
      ) : invoices.length > 0 ? (
        <div className="invoices-grid">
          {invoices.map((inv, i) => (
            <InvoiceCard
              key={inv.id || i}
              invoice={inv}
              invoiceId={inv.id}
              onClick={() => handleInvoiceClick(inv)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">{tab === 'created' ? '📝' : '💸'}</div>
          <h3 className="empty-state-title">
            {tab === 'created' ? 'No Invoices Created' : 'No Payments Made'}
          </h3>
          <p className="empty-state-desc">
            {tab === 'created'
              ? 'Create your first invoice to get started.'
              : 'Your payment history will appear here.'}
          </p>
        </div>
      )}
    </div>
  );
}
