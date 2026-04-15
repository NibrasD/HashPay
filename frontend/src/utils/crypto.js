import { ethers } from 'ethers';

/**
 * Generate a cryptographically secure 256-bit salt
 */
export function generateSalt() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return ethers.hexlify(bytes);
}

/**
 * Compute the invoice hash (must match the smart contract)
 * hash = keccak256(abi.encodePacked(merchant, amount, salt, token))
 */
export function computeInvoiceHash(merchant, amountWei, salt, tokenAddress) {
  return ethers.solidityPackedKeccak256(
    ['address', 'uint256', 'bytes32', 'address'],
    [merchant, amountWei, salt, tokenAddress]
  );
}

/**
 * Verify an invoice hash matches expectations
 */
export function verifyHash(merchant, amountWei, salt, tokenAddress, expectedHash) {
  const computed = computeInvoiceHash(merchant, amountWei, salt, tokenAddress);
  return computed === expectedHash;
}

/**
 * Generate a shareable invoice link
 */
export function generateInvoiceLink(invoiceId, salt, merchant) {
  const params = new URLSearchParams({
    id: invoiceId,
    s: salt,
    m: merchant,
  });
  return `${window.location.origin}/pay?${params.toString()}`;
}

/**
 * Parse an invoice link
 */
export function parseInvoiceLink(url) {
  try {
    const urlObj = new URL(url);
    return {
      invoiceId: urlObj.searchParams.get('id'),
      salt: urlObj.searchParams.get('s'),
      merchant: urlObj.searchParams.get('m'),
    };
  } catch {
    return null;
  }
}
