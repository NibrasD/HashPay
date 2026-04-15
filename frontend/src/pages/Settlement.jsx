import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatAmount, shortenAddress, shortenHash, formatDate, getChannelStatusInfo, copyToClipboard } from '../utils/format';
import { TOKENS } from '../config/chains';

export default function Settlement({ account, hspRead, hspWrite, showToast }) {
  const [tab, setTab] = useState('create');
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalChannels: 0, totalVolume: '0' });

  // Create channel form
  const [payee, setPayee] = useState('');
  const [deposit, setDeposit] = useState('');
  const [duration, setDuration] = useState('24');
  const [isCreating, setIsCreating] = useState(false);

  // Settle form
  const [settleChannelId, setSettleChannelId] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNonce, setSettleNonce] = useState('1');
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    if (hspRead && account) fetchChannels();
  }, [hspRead, account]);

  const fetchChannels = async () => {
    if (!hspRead || !account) return;
    setLoading(true);
    try {
      const [totalCh, totalVol] = await hspRead.getStats();
      setStats({ totalChannels: Number(totalCh), totalVolume: totalVol.toString() });

      const ids = await hspRead.getUserChannels(account);
      const details = await Promise.all(
        (ids || []).slice(0, 20).map(async (id) => {
          try {
            const ch = await hspRead.getChannel(id);
            return { ...ch, id };
          } catch { return null; }
        })
      );
      setChannels(details.filter(Boolean));
    } catch (err) {
      console.error('Settlement fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!hspWrite || !account) { showToast('Connect wallet first', 'error'); return; }
    if (!payee || !deposit) { showToast('Fill in all fields', 'error'); return; }

    setIsCreating(true);
    try {
      const durationSec = parseInt(duration) * 3600;
      const depositWei = ethers.parseEther(deposit);

      const tx = await hspWrite.createChannel(
        payee,
        '0x0000000000000000000000000000000000000000', // HSK native
        durationSec,
        { value: depositWei }
      );
      await tx.wait();
      showToast('Payment channel created! 🏦', 'success');
      setPayee('');
      setDeposit('');
      fetchChannels();
    } catch (err) {
      showToast(err.message || 'Failed to create channel', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    if (!hspWrite) { showToast('Connect wallet first', 'error'); return; }

    setIsSettling(true);
    try {
      const amountWei = ethers.parseEther(settleAmount);
      const tx = await hspWrite.settleChannel(settleChannelId, amountWei, parseInt(settleNonce));
      await tx.wait();
      showToast('Settlement executed! ✅', 'success');
      fetchChannels();
    } catch (err) {
      showToast(err.message || 'Settlement failed', 'error');
    } finally {
      setIsSettling(false);
    }
  };

  const handleCloseChannel = async (channelId) => {
    if (!hspWrite) return;
    try {
      const tx = await hspWrite.closeChannel(channelId);
      await tx.wait();
      showToast('Channel closed', 'success');
      fetchChannels();
    } catch (err) {
      showToast(err.message || 'Failed to close channel', 'error');
    }
  };

  if (!account) {
    return (
      <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="empty-state">
          <div className="empty-state-icon">🔗</div>
          <h2 className="empty-state-title">Connect Your Wallet</h2>
          <p className="empty-state-desc">Connect your wallet to manage settlement channels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="page-header">
        <h1 className="page-title">🏦 HSP Settlement</h1>
        <p className="page-subtitle">HashKey Settlement Protocol — Payment channels for recurring billing and streaming payments</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card animate-fade-in">
          <div className="stat-icon">🏦</div>
          <div className="stat-value">{stats.totalChannels}</div>
          <div className="stat-label">Total Channels</div>
        </div>
        <div className="stat-card animate-fade-in animate-delay-1">
          <div className="stat-icon">💎</div>
          <div className="stat-value">{formatAmount(stats.totalVolume, 18, 2)}</div>
          <div className="stat-label">Settlement Volume</div>
        </div>
        <div className="stat-card animate-fade-in animate-delay-2">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{channels.length}</div>
          <div className="stat-label">Your Channels</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
          ➕ Create Channel
        </button>
        <button className={`tab ${tab === 'settle' ? 'active' : ''}`} onClick={() => setTab('settle')}>
          💸 Settle
        </button>
        <button className={`tab ${tab === 'channels' ? 'active' : ''}`} onClick={() => setTab('channels')}>
          📋 My Channels
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'create' && (
        <div className="grid-2">
          <div className="glass-card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Create Payment Channel</h3>
            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label className="form-label">Payee Address</label>
                <input className="form-input form-input-mono" placeholder="0x..." value={payee} onChange={e => setPayee(e.target.value)} required id="channel-payee" />
              </div>
              <div className="form-group">
                <label className="form-label">Initial Deposit (HSK)</label>
                <input type="number" className="form-input" placeholder="1.0" value={deposit} onChange={e => setDeposit(e.target.value)} min="0" step="any" required id="channel-deposit" />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (hours)</label>
                <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)} id="channel-duration">
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="168">1 Week</option>
                  <option value="720">30 Days</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={isCreating} id="create-channel-btn">
                {isCreating ? <><span className="spinner"></span> Creating...</> : '🏦 Create Channel'}
              </button>
            </form>
          </div>

          <div className="glass-card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>💡 About HSP Channels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '📤', title: 'Escrow Deposit', desc: 'Payer deposits funds into a time-locked escrow. The payee can only receive via settlement.' },
                { icon: '📝', title: 'Incremental Settlement', desc: 'The payer releases funds incrementally. Each settlement is recorded on-chain with a nonce.' },
                { icon: '⏰', title: 'Time-Locked', desc: 'Channels expire after the set duration. Either party can close after expiry.' },
                { icon: '⚖️', title: 'Dispute Resolution', desc: 'If there\'s a disagreement, either party can raise a dispute for arbitration.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'settle' && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Execute Settlement</h3>
          <form onSubmit={handleSettle}>
            <div className="form-group">
              <label className="form-label">Channel ID</label>
              <input className="form-input form-input-mono" placeholder="0x..." value={settleChannelId} onChange={e => setSettleChannelId(e.target.value)} required id="settle-channel-id" />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (HSK)</label>
              <input type="number" className="form-input" placeholder="0.5" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} min="0" step="any" required id="settle-amount" />
            </div>
            <div className="form-group">
              <label className="form-label">Nonce</label>
              <input type="number" className="form-input" value={settleNonce} onChange={e => setSettleNonce(e.target.value)} min="1" required id="settle-nonce" />
              <div className="form-hint">Increment this with each settlement</div>
            </div>
            <button type="submit" className="btn btn-success btn-lg" style={{ width: '100%' }} disabled={isSettling} id="settle-btn">
              {isSettling ? <><span className="spinner"></span> Settling...</> : '💸 Execute Settlement'}
            </button>
          </form>
        </div>
      )}

      {tab === 'channels' && (
        loading ? (
          <div className="loading-screen"><div className="spinner"></div><p style={{ color: 'var(--text-secondary)' }}>Loading channels...</p></div>
        ) : channels.length > 0 ? (
          <div className="invoices-grid">
            {channels.map((ch, i) => {
              const statusInfo = getChannelStatusInfo(ch.status);
              return (
                <div key={ch.id || i} className="invoice-card animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="invoice-card-header">
                    <button className="invoice-id" onClick={() => { copyToClipboard(ch.id); showToast('Channel ID copied!', 'info'); }} style={{ cursor: 'pointer', border: 'none' }}>
                      🏦 {shortenHash(ch.id)}
                    </button>
                    <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>
                  </div>

                  <div className="invoice-amount">
                    💎 {formatAmount(ch.totalDeposit, 18)}
                    <span className="token-symbol">HSK deposited</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Settled</span>
                    <span style={{ fontWeight: 600 }}>{formatAmount(ch.settledAmount, 18)} HSK</span>
                  </div>

                  <div className="invoice-meta">
                    <span className="invoice-meta-item">👤 {shortenAddress(ch.payee)}</span>
                    <span className="invoice-meta-item">⏰ {formatDate(ch.expiresAt)}</span>
                  </div>

                  {(Number(ch.status) === 1) && (
                    <button
                      className="btn btn-sm btn-danger"
                      style={{ width: '100%', marginTop: '0.75rem' }}
                      onClick={() => handleCloseChannel(ch.id)}
                    >
                      Close Channel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🏦</div>
            <h3 className="empty-state-title">No Channels Found</h3>
            <p className="empty-state-desc">Create a payment channel to get started with HSP settlements.</p>
          </div>
        )
      )}
    </div>
  );
}
