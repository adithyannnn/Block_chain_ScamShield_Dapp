import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, TARGET_CHAIN_ID, LOCAL_CHAIN_ID, NetworkConfig } from '../contracts/contractConfig';

export interface MetaMaskState {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // Check if current chain is either Sepolia or Localhost
  const isCorrectNetwork = chainId === TARGET_CHAIN_ID || chainId === LOCAL_CHAIN_ID;

  // Initialize or re-sync provider
  const syncWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(browserProvider);

      const accounts: string[] = await browserProvider.send('eth_accounts', []);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setChainId(currentChainId);

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const rpcSigner = await browserProvider.getSigner();
        setSigner(rpcSigner);
        setError(null);
      } else {
        setAccount(null);
        setSigner(null);
      }
    } catch (err: any) {
      console.error('Wallet sync error:', err);
      setError(err.message || 'Failed to sync wallet state.');
    }
  }, []);

  useEffect(() => {
    syncWallet();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
        } else {
          setAccount(accounts[0]);
          syncWallet();
        }
      };

      const handleChainChanged = (chainHex: string) => {
        const newChainId = parseInt(chainHex, 16);
        setChainId(newChainId);
        syncWallet();
      };

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        if (eth.removeListener) {
          eth.removeListener('accountsChanged', handleAccountsChanged);
          eth.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [syncWallet]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('MetaMask or an EVM-compatible browser extension is not detected. Please install MetaMask to interact with the contract.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts: string[] = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);

      setProvider(browserProvider);
      setChainId(currentChainId);

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const rpcSigner = await browserProvider.getSigner();
        setSigner(rpcSigner);
      }
    } catch (err: any) {
      console.error('MetaMask connection error:', err);
      if (err.code === 4001) {
        setError('Connection request was rejected by the user in MetaMask.');
      } else {
        setError(err.message || 'Failed to connect MetaMask wallet.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setError(null);
  };

  const switchNetwork = async (targetChain: number = TARGET_CHAIN_ID) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setError('MetaMask is not available.');
      return;
    }

    const networkConfig: NetworkConfig = SUPPORTED_NETWORKS[targetChain];
    if (!networkConfig) {
      setError(`Unsupported chain ID: ${targetChain}`);
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainHex }],
      });
      setError(null);
    } catch (switchError: any) {
      // Error 4902: Target network has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: networkConfig.chainHex,
                chainName: networkConfig.name,
                rpcUrls: networkConfig.rpcUrls,
                blockExplorerUrls: networkConfig.blockExplorerUrls,
                nativeCurrency: networkConfig.nativeCurrency,
              },
            ],
          });
          setError(null);
        } catch (addError: any) {
          setError(addError.message || 'Failed to add network to MetaMask.');
        }
      } else if (switchError.code === 4001) {
        setError('Network switch request was rejected in MetaMask.');
      } else {
        setError(switchError.message || 'Failed to switch network.');
      }
    }
  };

  return {
    account,
    chainId,
    isConnecting,
    isConnected: !!account,
    isCorrectNetwork,
    error,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}
