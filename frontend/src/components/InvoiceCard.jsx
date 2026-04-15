import React, { useState } from 'react';
import { shortenHash, formatAmount, formatDate, getStatusInfo, getTokenByAddress, copyToClipboard } from '../utils/format';

export default function InvoiceCard({ invoice, invoiceId, onClick }) {
  const [copied, setCopied] = useState(false);

  const statusInfo = getStatusInfo(invoice.status || invoice.statusNum || 0);
  const tokenInfo = getTokenByAddress(invoice.token || invoice.tokenAddress);
  const amount = invoice.amount || invoice.amountWei;
  const displayAmount = typeof amount === 'string' && amount.length > 10
    ? formatAmount(amount, tokenInfo.decimals)
    : amount;

  const handleCopyId = async (e) => {
    e.stopPropagation();
    const id = invoiceId || invoice.invoiceId;
    if (id) {
      await copyToClipboard(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="invoice-card animate-fade-in"
      onClick={() => onClick && onClick(invoice, invoiceId)}
      id={`invoice-${(invoiceId || invoice.invoiceId || '').slice(0, 10)}`}
    >
      <div className="invoice-card-header">
        <button
          className="invoice-id"
          onClick={handleCopyId}
          title="Click to copy Invoice ID"
          style={{ cursor: 'pointer', border: 'none' }}
        >
          {copied ? '✅ Copied!' : `🧾 ${shortenHash(invoiceId || invoice.invoiceId)}`}
        </button>
        <span className={`badge ${statusInfo.class}`}>
          {statusInfo.icon} {statusInfo.label}
        </span>
      </div>

      <div className="invoice-amount">
        {tokenInfo.icon} {displayAmount}
        <span className="token-symbol">{tokenInfo.symbol}</span>
      </div>

      <div className="invoice-meta">
        {invoice.createdAt && (
          <span className="invoice-meta-item">
            🕐 {formatDate(invoice.createdAt)}
          </span>
        )}
        {invoice.invoiceType !== undefined && (
          <span className="invoice-meta-item">
            📋 {['Standard', 'Campaign', 'Recurring'][Number(invoice.invoiceType)] || 'Standard'}
          </span>
        )}
        {invoice.paymentCount > 0 && (
          <span className="invoice-meta-item">
            💳 {Number(invoice.paymentCount)} payments
          </span>
        )}
      </div>
    </div>
  );
}
