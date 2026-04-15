import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { generateSalt, computeInvoiceHash } from '../utils/crypto';
import { TOKENS } from '../config/chains';

/**
 * useInvoice - Hook for creating and paying invoices
 */
export function useInvoice(nullpayWrite, nullpayRead, account) {
  const [isCreating, setIsCreating] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [lastReceipt, setLastReceipt] = useState(null);

  /**
   * Create a new invoice
   */
  const createInvoice = useCallback(async (amount, tokenSymbol, invoiceType = 0) => {
    if (!nullpayWrite || !account) throw new Error('Wallet not connected');

    setIsCreating(true);
    try {
      const token = TOKENS[tokenSymbol] || TOKENS.HSK;
      const tokenAddress = token.address === '0x0000000000000000000000000000000000000000'
        ? '0x0000000000000000000000000000000000000000'
        : token.address;

      // Generate salt client-side
      const salt = generateSalt();

      // Parse amount to wei
      const amountWei = ethers.parseUnits(amount.toString(), token.decimals);

      // Compute invoice hash
      const invoiceHash = computeInvoiceHash(account, amountWei, salt, tokenAddress);

      // Send transaction
      const tx = await nullpayWrite.createInvoice(
        invoiceHash,
        amountWei,
        tokenAddress,
        invoiceType
      );

      const receipt = await tx.wait();

      // Parse InvoiceCreated event
      let invoiceId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = nullpayWrite.interface.parseLog(log);
          if (parsed && parsed.name === 'InvoiceCreated') {
            invoiceId = parsed.args[0]; // invoiceId
            break;
          }
        } catch (e) {
          // skip unparseable logs
        }
      }

      const invoiceData = {
        invoiceId,
        invoiceHash,
        salt,
        amount: amount.toString(),
        amountWei: amountWei.toString(),
        token: tokenSymbol,
        tokenAddress,
        merchant: account,
        invoiceType,
        txHash: receipt.hash,
        createdAt: Date.now(),
      };

      setLastInvoice(invoiceData);

      // Save to localStorage for persistence
      saveInvoiceLocally(invoiceData);

      return invoiceData;
    } finally {
      setIsCreating(false);
    }
  }, [nullpayWrite, account]);

  /**
   * Pay an existing invoice
   */
  const payInvoice = useCallback(async (invoiceId, salt, merchant) => {
    if (!nullpayWrite) throw new Error('Wallet not connected');

    setIsPaying(true);
    try {
      // Fetch invoice details
      const invoice = await nullpayRead.getInvoice(invoiceId);
      const isNative = invoice.token === '0x0000000000000000000000000000000000000000';

      let tx;
      if (isNative) {
        tx = await nullpayWrite.payInvoice(invoiceId, salt, merchant, {
          value: invoice.amount,
        });
      } else {
        // Need to approve ERC20 first
        const tokenContract = new ethers.Contract(
          invoice.token,
          ['function approve(address,uint256) returns (bool)', 'function allowance(address,address) view returns (uint256)'],
          nullpayWrite.runner
        );

        const allowance = await tokenContract.allowance(
          await nullpayWrite.runner.getAddress(),
          await nullpayWrite.getAddress()
        );

        if (allowance < invoice.amount) {
          const approveTx = await tokenContract.approve(
            await nullpayWrite.getAddress(),
            invoice.amount
          );
          await approveTx.wait();
        }

        tx = await nullpayWrite.payInvoice(invoiceId, salt, merchant);
      }

      const receipt = await tx.wait();

      const receiptData = {
        invoiceId,
        txHash: receipt.hash,
        paidAt: Date.now(),
      };

      setLastReceipt(receiptData);
      return receiptData;
    } finally {
      setIsPaying(false);
    }
  }, [nullpayWrite, nullpayRead]);

  return {
    createInvoice,
    payInvoice,
    isCreating,
    isPaying,
    lastInvoice,
    lastReceipt,
  };
}

// ─── Local Storage Helpers ──────────────────────────────────────────
function saveInvoiceLocally(invoiceData) {
  try {
    const existing = JSON.parse(localStorage.getItem('nullpay_invoices') || '[]');
    existing.unshift(invoiceData);
    localStorage.setItem('nullpay_invoices', JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    // ignore
  }
}

export function getLocalInvoices() {
  try {
    return JSON.parse(localStorage.getItem('nullpay_invoices') || '[]');
  } catch {
    return [];
  }
}

export function clearLocalInvoices() {
  localStorage.removeItem('nullpay_invoices');
}
