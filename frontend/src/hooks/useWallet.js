import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ACTIVE_CHAIN } from '../config/chains';

/**
 * useWallet - MetaMask wallet connection hook for HashKey Chain
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === ACTIVE_CHAIN.chainId;

  // Switch to HashKey Chain
  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ACTIVE_CHAIN.chainIdHex }],
      });
    } catch (switchError) {
      // Chain not added — add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ACTIVE_CHAIN.chainIdHex,
              chainName: ACTIVE_CHAIN.chainName,
              rpcUrls: ACTIVE_CHAIN.rpcUrls,
              blockExplorerUrls: ACTIVE_CHAIN.blockExplorerUrls,
              nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
            }],
          });
        } catch (addError) {
          setError('Failed to add HashKey Chain network');
        }
      }
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);

      if (accounts.length > 0) {
        const walletSigner = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAccount(accounts[0]);
        setChainId(Number(network.chainId));

        // Auto-switch to HashKey Chain if needed
        if (Number(network.chainId) !== ACTIVE_CHAIN.chainId) {
          await switchChain();
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [switchChain]);

  // Disconnect
  const disconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      // Refresh provider
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        browserProvider.getSigner().then(setSigner).catch(() => {});
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts.length > 0) {
          connect();
        }
      }).catch(() => {});
    }
  }, [connect]);

  return {
    account,
    provider,
    signer,
    chainId,
    isConnecting,
    isCorrectChain,
    error,
    connect,
    disconnect,
    switchChain,
  };
}
