import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { ContractReport, useScamShield } from '../hooks/useScamShield';
import { CategoryBadge } from '../components/CategoryBadge';
import { formatAddress, formatHash, formatTimestamp } from '../lib/urlUtils';
import { getExplorerAddressUrl } from '../contracts/contractConfig';
import { NavigationPage } from '../components/Navbar';

interface MyReportsProps {
  scamShield: ReturnType<typeof useScamShield>;
  account: string | null;
  isConnected: boolean;
  onConnectWallet: () => void;
  onSelectReport: (report: ContractReport) => void;
  onNavigate: (page: NavigationPage) => void;
  chainId: number | null;
}

export const MyReports: React.FC<MyReportsProps> = ({
  scamShield,
  account,
  isConnected,
  onConnectWallet,
  onSelectReport,
  onNavigate,
  chainId,
}) => {
  const [reports, setReports] = useState<ContractReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyReports = async () => {
    if (!account) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await scamShield.getReportsByReporter(account);
      setReports(data);
    } catch (err: any) {
      console.error('Failed to load my reports:', err);
      setError(err.message || 'Failed to retrieve wallet report records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      fetchMyReports();
    } else {
      setReports([]);
    }
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
          <Wallet className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Wallet Connection Required</h2>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Connect your MetaMask wallet to view the indicators you have originated and registered in the ScamShield threat database.
          </p>
        </div>
        <button
          onClick={onConnectWallet}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all"
        >
          <Wallet className="w-4 h-4" />
          <span>Connect MetaMask</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
            <User className="w-3.5 h-3.5" />
            <span>Personal Indicator Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Threat Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Records where your connected wallet <span className="font-mono text-cyan-300">{formatAddress(account || '')}</span> is recorded as the original submitter.
          </p>
        </div>

        <button
          onClick={fetchMyReports}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Scope Disclaimer */}
      <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 text-xs text-slate-400 flex items-start space-x-3">
        <AlertCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">Data Retrieval Scope Notice</p>
          <p className="leading-relaxed">
            This page queries the smart contract function <code>getMyReportCount(address)</code> and displays unique URL fingerprints where your wallet was the initial creator. Secondary repeat-reports by your address on indicators originated by other users are tracked globally on-chain, but not listed here to prevent duplicate indicator entries.
          </p>
        </div>
      </div>

      {/* Table / Results */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Fetching your on-chain submissions...</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-rose-300">Failed to Load Wallet Reports</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="text-base font-semibold text-slate-300">No Submissions Found for This Wallet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You have not yet originated any unique URL threat reports from this account.
              </p>
            </div>
            <button
              onClick={() => onNavigate('report')}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Suspicious URL</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">SHA-256 Fingerprint</th>
                  <th className="py-3 px-4">Threat Category</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4 text-center">Community Reports</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {reports.map((report) => (
                  <tr key={report.urlHash} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-cyan-300">
                      {formatHash(report.urlHash)}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <CategoryBadge categoryId={report.category} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {formatTimestamp(report.reportedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {report.reportCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={() => onSelectReport(report)}
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-navy-950 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-800/80 bg-navy-950/40 text-xs text-slate-400 flex justify-between items-center">
          <span>
            Total unique indicators registered by wallet:{' '}
            <strong className="text-white font-mono">{reports.length}</strong>
          </span>
          <a
            href={getExplorerAddressUrl(account || '', chainId || undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center"
          >
            <span>View Account on Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
};
