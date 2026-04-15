import { ethers } from 'ethers';

/**
 * Shorten an address: 0x1234...abcd
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Shorten a hash: 0x1234...abcd
 */
export function shortenHash(hash, chars = 6) {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Format amount from wei with token decimals
 */
export function formatAmount(amountWei, decimals = 18, maxDecimals = 4) {
  if (!amountWei) return '0';
  const formatted = ethers.formatUnits(amountWei, decimals);
  const num = parseFloat(formatted);
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return Number(num).toLocaleString();
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const ts = typeof timestamp === 'number' && timestamp < 1e12
    ? timestamp * 1000
    : Number(timestamp);
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time ago
 */
export function timeAgo(timestamp) {
  const ts = typeof timestamp === 'number' && timestamp < 1e12
    ? timestamp * 1000
    : Number(timestamp);
  const seconds = Math.floor((Date.now() - ts) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(timestamp);
}

/**
 * Get invoice status label and class
 */
export function getStatusInfo(status) {
  const map = {
    0: { label: 'Open', class: 'badge-open', icon: '🟢' },
    1: { label: 'Settled', class: 'badge-settled', icon: '✅' },
    2: { label: 'Cancelled', class: 'badge-cancelled', icon: '❌' },
    3: { label: 'Disputed', class: 'badge-disputed', icon: '⚠️' },
  };
  return map[Number(status)] || map[0];
}

/**
 * Get channel status label
 */
export function getChannelStatusInfo(status) {
  const map = {
    0: { label: 'Open', class: 'badge-open' },
    1: { label: 'Active', class: 'badge-active' },
    2: { label: 'Settling', class: 'badge-disputed' },
    3: { label: 'Closed', class: 'badge-cancelled' },
    4: { label: 'Disputed', class: 'badge-disputed' },
  };
  return map[Number(status)] || map[0];
}

/**
 * Get token info by address
 */
export function getTokenByAddress(address) {
  if (!address || address === '0x0000000000000000000000000000000000000000') {
    return { symbol: 'HSK', decimals: 18, icon: '💎' };
  }
  // known tokens on HashKey
  const known = {
    '0xefd4bc9afd210517803f293ababd701caeecdfd0': { symbol: 'USDC', decimals: 6, icon: '💵' },
    '0xf1b50ed67a9e2cc94ad3c477779e2d4cbfff9029': { symbol: 'USDT', decimals: 6, icon: '💲' },
  };
  return known[address.toLowerCase()] || { symbol: 'ERC20', decimals: 18, icon: '🪙' };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
