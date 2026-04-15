import { useMemo } from 'react';
import { ethers } from 'ethers';
import { HASHPAY_ADDRESS, HASHPAY_ABI, HSP_ADDRESS, HSP_ABI, ERC20_ABI } from '../config/contracts';
import { ACTIVE_CHAIN } from '../config/chains';

/**
 * useContract - Hook for interacting with HashPay and HSP contracts
 */
export function useContract(signer, provider) {
  const readProvider = useMemo(() => {
    if (provider) return provider;
    return new ethers.JsonRpcProvider(ACTIVE_CHAIN.rpcUrls[0]);
  }, [provider]);

  const nullpayRead = useMemo(() => {
    if (HASHPAY_ADDRESS === '0x0000000000000000000000000000000000000000') return null;
    return new ethers.Contract(HASHPAY_ADDRESS, HASHPAY_ABI, readProvider);
  }, [readProvider]);

  const nullpayWrite = useMemo(() => {
    if (!signer || HASHPAY_ADDRESS === '0x0000000000000000000000000000000000000000') return null;
    return new ethers.Contract(HASHPAY_ADDRESS, HASHPAY_ABI, signer);
  }, [signer]);

  const hspRead = useMemo(() => {
    if (HSP_ADDRESS === '0x0000000000000000000000000000000000000000') return null;
    return new ethers.Contract(HSP_ADDRESS, HSP_ABI, readProvider);
  }, [readProvider]);

  const hspWrite = useMemo(() => {
    if (!signer || HSP_ADDRESS === '0x0000000000000000000000000000000000000000') return null;
    return new ethers.Contract(HSP_ADDRESS, HSP_ABI, signer);
  }, [signer]);

  const getERC20 = (tokenAddress) => {
    if (!signer) return null;
    return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  };

  return {
    nullpayRead,
    nullpayWrite,
    hspRead,
    hspWrite,
    getERC20,
  };
}
