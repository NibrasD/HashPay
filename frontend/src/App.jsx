import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ParticleBackground from './components/ParticleBackground';
import { useToast } from './components/Toast';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { useInvoice } from './hooks/useInvoice';

import Landing from './pages/Landing';
import CreateInvoice from './pages/CreateInvoice';
import PayInvoice from './pages/PayInvoice';
import Dashboard from './pages/Dashboard';
import Settlement from './pages/Settlement';
import Explorer from './pages/Explorer';

export default function App() {
  const wallet = useWallet();
  const contracts = useContract(wallet.signer, wallet.provider);
  const invoice = useInvoice(contracts.nullpayWrite, contracts.nullpayRead, wallet.account);
  const { showToast, ToastContainer } = useToast();

  return (
    <div className="app-container">
      <ParticleBackground />

      <Navbar
        account={wallet.account}
        isConnecting={wallet.isConnecting}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
        isCorrectChain={wallet.isCorrectChain}
        onSwitchChain={wallet.switchChain}
      />

      <Routes>
        <Route
          path="/"
          element={
            <Landing
              account={wallet.account}
              onConnect={wallet.connect}
            />
          }
        />
        <Route
          path="/create"
          element={
            <CreateInvoice
              account={wallet.account}
              createInvoice={invoice.createInvoice}
              isCreating={invoice.isCreating}
              lastInvoice={invoice.lastInvoice}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/pay"
          element={
            <PayInvoice
              account={wallet.account}
              payInvoice={invoice.payInvoice}
              isPaying={invoice.isPaying}
              nullpayRead={contracts.nullpayRead}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            <Dashboard
              account={wallet.account}
              nullpayRead={contracts.nullpayRead}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/settlement"
          element={
            <Settlement
              account={wallet.account}
              hspRead={contracts.hspRead}
              hspWrite={contracts.hspWrite}
              showToast={showToast}
            />
          }
        />
        <Route
          path="/explorer"
          element={
            <Explorer
              nullpayRead={contracts.nullpayRead}
              showToast={showToast}
            />
          }
        />
      </Routes>

      <ToastContainer />

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1.5rem',
        borderTop: '1px solid var(--border-glass)',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--text-secondary)' }}>HashPay HSK</strong> — Privacy-First Payments on HashKey Chain
        </div>
        <div>
          Built for the HashKey Hackathon · PayFi Track · Powered by{' '}
          <a href="https://hashkey.com" target="_blank" rel="noopener noreferrer">HashKey Chain</a>
        </div>
      </footer>
    </div>
  );
}
