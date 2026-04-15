import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ account, isConnecting, onConnect, onDisconnect, isCorrectChain, onSwitchChain }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shortenAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/create', label: 'Create Invoice', icon: '📝' },
    { path: '/pay', label: 'Pay', icon: '💸' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/settlement', label: 'Settlement', icon: '🏦' },
    { path: '/explorer', label: 'Explorer', icon: '🔍' },
  ];

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">N</div>
          HashPay
          <span className="brand-tag">HSK</span>
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={() => setMobileOpen(false)}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {account && !isCorrectChain && (
            <button
              className="btn btn-sm btn-danger"
              onClick={onSwitchChain}
            >
              ⚠️ Switch Network
            </button>
          )}

          {account ? (
            <button
              className="wallet-btn connected"
              onClick={onDisconnect}
              title="Click to disconnect"
              id="wallet-disconnect-btn"
            >
              <span className="wallet-dot"></span>
              {shortenAddr(account)}
            </button>
          ) : (
            <button
              className="wallet-btn"
              onClick={onConnect}
              disabled={isConnecting}
              id="wallet-connect-btn"
            >
              {isConnecting ? (
                <><span className="spinner" style={{ width: 14, height: 14 }}></span> Connecting...</>
              ) : (
                '🔗 Connect Wallet'
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
