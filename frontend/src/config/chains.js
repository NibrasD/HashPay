/**
 * HashKey Chain network configuration
 */
export const CHAINS = {
  hashkeyTestnet: {
    chainId: 133,
    chainIdHex: '0x85',
    chainName: 'HashKey Chain Testnet',
    rpcUrls: ['https://testnet.hsk.xyz'],
    blockExplorerUrls: ['https://testnet-explorer.hsk.xyz'],
    nativeCurrency: {
      name: 'HSK',
      symbol: 'HSK',
      decimals: 18,
    },
  },
  hashkeyMainnet: {
    chainId: 177,
    chainIdHex: '0xb1',
    chainName: 'HashKey Chain Mainnet',
    rpcUrls: ['https://mainnet.hsk.xyz'],
    blockExplorerUrls: ['https://hashkey.blockscout.com'],
    nativeCurrency: {
      name: 'HSK',
      symbol: 'HSK',
      decimals: 18,
    },
  },
};

// Tokens available on HashKey Chain
export const TOKENS = {
  HSK: {
    symbol: 'HSK',
    name: 'HashKey Token',
    address: '0x0000000000000000000000000000000000000000', // native
    decimals: 18,
    icon: '💎',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xefd4bC9afD210517803f293ABABd701CaeeCdfd0', // mainnet
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xf1b50ed67a9e2cc94ad3c477779e2d4cbfff9029', // mainnet
    decimals: 6,
    icon: '💲',
  },
};

// Default to testnet
export const ACTIVE_CHAIN = CHAINS.hashkeyTestnet;

export const getExplorerUrl = (hash, type = 'tx') => {
  return `${ACTIVE_CHAIN.blockExplorerUrls[0]}/${type}/${hash}`;
};
