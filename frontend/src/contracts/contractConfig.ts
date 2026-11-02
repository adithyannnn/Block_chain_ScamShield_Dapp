import contractData from './contractConfig.json';

export interface NetworkConfig {
  chainId: number;
  chainHex: string;
  name: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // Sepolia Testnet (Target Production Network)
  11155111: {
    chainId: 11155111,
    chainHex: '0xaa36a7',
    name: 'Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org', 'https://ethereum-sepolia.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'SEP',
      decimals: 18,
    },
  },
  // Hardhat / Anvil Local Testnet
  31337: {
    chainId: 31337,
    chainHex: '0x7a69',
    name: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: 'Local Testnet ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

// Target default network is Sepolia testnet
export const TARGET_CHAIN_ID = 11155111;
export const LOCAL_CHAIN_ID = 31337;

/**
 * Resolved contract configuration.
 * Automatically loads deployed address and ABI from contractConfig.json
 */
export const CONTRACT_CONFIG = {
  address: (import.meta.env.VITE_CONTRACT_ADDRESS as string) || (contractData.address as string) || '',
  abi: contractData.abi,
  network: contractData.network,
  chainId: Number(contractData.chainId) || LOCAL_CHAIN_ID,
  transactionHash: contractData.transactionHash,
};

export function getExplorerTxUrl(txHash: string, chainId: number = TARGET_CHAIN_ID): string {
  if (!txHash) return '';
  const network = SUPPORTED_NETWORKS[chainId];
  if (network && network.blockExplorerUrls[0]) {
    return `${network.blockExplorerUrls[0]}/tx/${txHash}`;
  }
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, chainId: number = TARGET_CHAIN_ID): string {
  if (!address) return '';
  const network = SUPPORTED_NETWORKS[chainId];
  if (network && network.blockExplorerUrls[0]) {
    return `${network.blockExplorerUrls[0]}/address/${address}`;
  }
  return `https://sepolia.etherscan.io/address/${address}`;
}

