import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG, SUPPORTED_NETWORKS } from '../contracts/contractConfig';

export interface ContractReport {
  urlHash: string;
  reporter: string;
  category: number;
  reportedAt: number;
  reportCount: number;
  exists: boolean;
}

export interface DashboardStats {
  totalUniqueURLs: number;
  totalSubmissions: number;
  categoryBreakdown: Record<number, number>;
  latestReports: ContractReport[];
  isLoading: boolean;
  error: string | null;
}

export function useScamShield(
  provider: ethers.BrowserProvider | null,
  signer: ethers.JsonRpcSigner | null,
  _chainId?: number | null
) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Read-only provider connected to the network where the contract is actually deployed
  const readProvider = useMemo(() => {
    // If the browser provider is connected to the exact network where contract is deployed, use it
    if (provider && _chainId === CONTRACT_CONFIG.chainId) {
      return provider;
    }
    // Otherwise, query the RPC endpoint of the network where the contract is actually hosted
    const deployedRpc =
      SUPPORTED_NETWORKS[CONTRACT_CONFIG.chainId]?.rpcUrls[0] ||
      (CONTRACT_CONFIG.chainId === 31337 ? 'http://127.0.0.1:8545' : 'https://ethereum-sepolia.publicnode.com');
    return new ethers.JsonRpcProvider(deployedRpc);
  }, [provider, _chainId]);

  // Read-only contract instance
  const readContract = useMemo(() => {
    if (!CONTRACT_CONFIG.address || !readProvider) return null;
    return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, readProvider);
  }, [readProvider]);

  // Signer write contract instance
  const writeContract = useMemo(() => {
    if (!CONTRACT_CONFIG.address || !signer) return null;
    return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
  }, [signer]);

  /**
   * Query whether a URL fingerprint exists on-chain.
   */
  const checkURL = useCallback(
    async (urlHash: string): Promise<boolean> => {
      if (!readContract) {
        throw new Error('Contract is not configured or address is pending deployment.');
      }
      try {
        return await readContract.checkURL(urlHash);
      } catch (err: any) {
        console.error('checkURL failed:', err);
        throw new Error(err.reason || err.message || 'Failed to query URL status on blockchain.');
      }
    },
    [readContract]
  );

  /**
   * Retrieve the complete on-chain report for a fingerprint.
   */
  const getReport = useCallback(
    async (urlHash: string): Promise<ContractReport> => {
      if (!readContract) {
        throw new Error('Contract is not initialized.');
      }
      try {
        const raw = await readContract.getReport(urlHash);
        return {
          urlHash: raw.urlHash,
          reporter: raw.reporter,
          category: Number(raw.category),
          reportedAt: Number(raw.reportedAt),
          reportCount: Number(raw.reportCount),
          exists: raw.exists,
        };
      } catch (err: any) {
        if (err.data && err.data.includes('ReportNotFound')) {
          throw new Error('No report record found on-chain for this fingerprint.');
        }
        throw new Error(err.reason || err.message || 'Failed to retrieve report from blockchain.');
      }
    },
    [readContract]
  );

  /**
   * Submit a URL fingerprint to the smart contract (registers new or increments repeat count).
   */
  const reportURL = useCallback(
    async (
      urlHash: string,
      category: number
    ): Promise<{
      transactionHash: string;
      isNewReport: boolean;
      report: ContractReport;
    }> => {
      if (!writeContract || !signer) {
        throw new Error('MetaMask wallet is not connected. Please connect your wallet to sign the transaction.');
      }

      setIsSubmitting(true);
      setContractError(null);

      try {
        // Enforce network alignment: do not allow transaction if wallet is on wrong chain
        if (_chainId !== CONTRACT_CONFIG.chainId) {
          const currentNetName = SUPPORTED_NETWORKS[_chainId || 0]?.name || `Chain ID ${_chainId}`;
          const targetNetName = SUPPORTED_NETWORKS[CONTRACT_CONFIG.chainId]?.name || `Chain ID ${CONTRACT_CONFIG.chainId}`;
          throw new Error(
            `Network Mismatch: Your MetaMask is connected to ${currentNetName}, but the contract is deployed on ${targetNetName}. ` +
            `Please switch your MetaMask network to ${targetNetName} before signing.`
          );
        }

        // Pre-flight check: Verify that contract bytecode actually exists on the wallet's chain
        const signerCode = await signer.provider.getCode(CONTRACT_CONFIG.address);
        if (!signerCode || signerCode === '0x') {
          const targetNetName = SUPPORTED_NETWORKS[CONTRACT_CONFIG.chainId]?.name || `Chain ID ${CONTRACT_CONFIG.chainId}`;
          throw new Error(
            `No contract bytecode found at ${CONTRACT_CONFIG.address}. ` +
            `Please ensure you are connected to ${targetNetName} where the contract was deployed.`
          );
        }

        // Step 1: Pre-check whether it currently exists
        const alreadyExists = await readContract?.checkURL(urlHash).catch(() => false);

        // Step 2: Prompt MetaMask user for transaction approval
        const tx = await writeContract.reportURL(urlHash, category);

        // Step 3: Wait for 1 block confirmation
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status !== 1) {
          throw new Error('Transaction execution failed or was reverted on-chain.');
        }

        // Step 4: Fetch verified updated report record directly from blockchain
        const updatedReport = await getReport(urlHash);

        return {
          transactionHash: tx.hash,
          isNewReport: !alreadyExists,
          report: updatedReport,
        };
      } catch (err: any) {
        console.error('reportURL transaction error:', err);
        let msg = err.reason || err.message || 'Transaction failed.';
        if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
          msg = 'Transaction was rejected by user in MetaMask.';
        }
        setContractError(msg);
        throw new Error(msg);
      } finally {
        setIsSubmitting(false);
      }
    },
    [writeContract, signer, readContract, getReport]
  );

  /**
   * Fetch all threat reports with pagination support.
   */
  const getThreatReports = useCallback(
    async (offset: number = 0, limit: number = 20): Promise<{ reports: ContractReport[]; total: number }> => {
      if (!readContract) {
        return { reports: [], total: 0 };
      }

      try {
        const totalBN = await readContract.getTotalUniqueURLs();
        const total = Number(totalBN);

        if (total === 0 || offset >= total) {
          return { reports: [], total };
        }

        // Try batch method if available
        try {
          const [batchData, totalReturned] = await readContract.getBatchReports(offset, limit);
          const formatted: ContractReport[] = batchData.map((raw: any) => ({
            urlHash: raw.urlHash,
            reporter: raw.reporter,
            category: Number(raw.category),
            reportedAt: Number(raw.reportedAt),
            reportCount: Number(raw.reportCount),
            exists: raw.exists,
          }));
          return { reports: formatted, total: Number(totalReturned) };
        } catch {
          // Fallback to individual index queries
          const end = Math.min(offset + limit, total);
          const reports: ContractReport[] = [];
          for (let i = offset; i < end; i++) {
            const [, raw] = await readContract.getURLByIndex(i);
            reports.push({
              urlHash: raw.urlHash,
              reporter: raw.reporter,
              category: Number(raw.category),
              reportedAt: Number(raw.reportedAt),
              reportCount: Number(raw.reportCount),
              exists: raw.exists,
            });
          }
          return { reports, total };
        }
      } catch (err: any) {
        console.error('getThreatReports error:', err);
        throw new Error(err.reason || err.message || 'Failed to fetch threat reports from smart contract.');
      }
    },
    [readContract]
  );

  /**
   * Fetch reports submitted by a specific wallet address.
   */
  const getReportsByReporter = useCallback(
    async (reporterAddress: string): Promise<ContractReport[]> => {
      if (!readContract || !reporterAddress) {
        return [];
      }

      try {
        const countBN = await readContract.getMyReportCount(reporterAddress);
        const count = Number(countBN);

        if (count === 0) return [];

        const reports: ContractReport[] = [];
        for (let i = 0; i < count; i++) {
          try {
            const [, raw] = await readContract.getMyReportByIndex(reporterAddress, i);
            reports.push({
              urlHash: raw.urlHash,
              reporter: raw.reporter,
              category: Number(raw.category),
              reportedAt: Number(raw.reportedAt),
              reportCount: Number(raw.reportCount),
              exists: raw.exists,
            });
          } catch (e) {
            console.warn(`Failed to fetch report at index ${i} for reporter`, e);
          }
        }
        return reports;
      } catch (err: any) {
        console.error('getReportsByReporter error:', err);
        throw new Error(err.reason || err.message || 'Failed to retrieve wallet report records.');
      }
    },
    [readContract]
  );

  /**
   * Aggregate high-level dashboard statistics directly from real contract state.
   */
  const getDashboardStats = useCallback(async (): Promise<DashboardStats> => {
    if (!readContract) {
      return {
        totalUniqueURLs: 0,
        totalSubmissions: 0,
        categoryBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        latestReports: [],
        isLoading: false,
        error: 'Contract address not configured or unavailable.',
      };
    }

    try {
      const [totalUniqueBN, totalSubmissionsBN] = await Promise.all([
        readContract.getTotalUniqueURLs(),
        readContract.getTotalSubmissions().catch(() => 0n),
      ]);

      const totalUnique = Number(totalUniqueBN);
      const totalSubmissions = Number(totalSubmissionsBN) || totalUnique;

      // Query latest reports up to 50 to compute real on-chain category distribution
      const sampleLimit = Math.min(totalUnique, 50);
      const categoryBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const latestReports: ContractReport[] = [];

      if (sampleLimit > 0) {
        const offset = Math.max(0, totalUnique - sampleLimit);
        const { reports } = await getThreatReports(offset, sampleLimit);

        for (const rep of reports) {
          const cat = rep.category;
          categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
        }

        // Reverse to show newest first
        latestReports.push(...[...reports].reverse().slice(0, 5));
      }

      return {
        totalUniqueURLs: totalUnique,
        totalSubmissions,
        categoryBreakdown,
        latestReports,
        isLoading: false,
        error: null,
      };
    } catch (err: any) {
      console.error('getDashboardStats error:', err);
      return {
        totalUniqueURLs: 0,
        totalSubmissions: 0,
        categoryBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        latestReports: [],
        isLoading: false,
        error: err.reason || err.message || 'Failed to load stats from contract.',
      };
    }
  }, [readContract, getThreatReports]);

  return {
    isSubmitting,
    contractError,
    checkURL,
    getReport,
    reportURL,
    getThreatReports,
    getReportsByReporter,
    getDashboardStats,
  };
}
