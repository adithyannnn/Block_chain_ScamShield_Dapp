import React, { useState } from 'react';
import {
  ShieldAlert,
  Hash,
  Activity,
  Layers,
  RefreshCw,
  Search,
  PlusCircle,
  Database,
  Info,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { CategoryBadge } from '../components/CategoryBadge';
import { ContractReport, DashboardStats } from '../hooks/useScamShield';
import { formatAddress, formatHash, formatTimestamp, THREAT_CATEGORIES } from '../lib/urlUtils';
import { CONTRACT_CONFIG, SUPPORTED_NETWORKS } from '../contracts/contractConfig';
import { NavigationPage } from '../components/Navbar';

interface DashboardProps {
  stats: DashboardStats;
  onRefresh: () => void;
  onSelectReport: (report: ContractReport) => void;
  onNavigate: (page: NavigationPage) => void;
  account?: string | null;
  chainId: number | null;
  isConnected?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  onRefresh,
  onSelectReport,
  onNavigate,
  chainId,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const activeNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero / Executive Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-850 to-navy-900 border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
              <Database className="w-3.5 h-3.5" />
              <span>Decentralized Phishing Threat Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              ScamShield Threat Intelligence Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time on-chain repository for recording and verifying cryptographic SHA-256 fingerprints of malicious URLs. Empowering the Web3 community with immutable indicator tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('report')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Suspicious URL</span>
            </button>
            <button
              onClick={() => onNavigate('check')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-slate-800 text-slate-200 text-sm font-semibold border border-slate-700 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Verify URL Fingerprint</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-navy-800 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-50"
              title="Refresh contract statistics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Contract & Network Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unique URLs */}
        <StatCard
          title="Unique URL Fingerprints"
          value={stats.totalUniqueURLs}
          subtitle="Distinct hashes registered on-chain"
          icon={Hash}
          variant="cyan"
        />

        {/* Total Submissions */}
        <StatCard
          title="Total Submissions"
          value={stats.totalSubmissions}
          subtitle="Original + duplicate community reports"
          icon={Activity}
          variant="teal"
        />

        {/* Active Network */}
        <StatCard
          title="Active Blockchain Network"
          value={activeNetwork?.name || (chainId ? `Chain ID ${chainId}` : 'Disconnected')}
          subtitle={activeNetwork ? `EVM Chain ID: ${activeNetwork.chainId}` : 'Connect wallet to sync'}
          icon={Layers}
          variant="amber"
        />

        {/* Smart Contract State */}
        <StatCard
          title="Registry Smart Contract"
          value={CONTRACT_CONFIG.address ? formatAddress(CONTRACT_CONFIG.address) : 'Pending Deploy'}
          subtitle={CONTRACT_CONFIG.network ? `Hardhat / ${CONTRACT_CONFIG.network}` : 'EVM Bytecode v0.8.24'}
          icon={ShieldAlert}
          variant="rose"
        />
      </div>

      {/* Two Column Layout: Category Distribution + Latest Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Breakdown (1 col) */}
        <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-semibold text-white">Threat Category Distribution</h2>
              <span className="text-xs font-mono text-cyan-400">
                {stats.totalUniqueURLs} records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Computed exclusively from live on-chain reports registered in the smart contract.
            </p>

            <div className="space-y-4">
              {Object.keys(THREAT_CATEGORIES).map((catIdStr) => {
                const catId = Number(catIdStr);
                const count = stats.categoryBreakdown[catId] || 0;
                const percentage =
                  stats.totalUniqueURLs > 0
                    ? Math.round((count / stats.totalUniqueURLs) * 100)
                    : 0;

                return (
                  <div key={catId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium flex items-center">
                        <CategoryBadge categoryId={catId} showIcon={false} />
                      </span>
                      <div className="flex items-center space-x-2 font-mono">
                        <span className="text-slate-200 font-bold">{count}</span>
                        <span className="text-slate-500">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-navy-950/70 border border-slate-800/80 text-[11px] text-slate-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <span>
              Real-time contract data. Categories 1 through 5 represent standard threat taxonomy defined in the smart contract.
            </span>
          </div>
        </div>

        {/* Latest Reports Table (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-navy-900/90 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-white">Latest Registered Indicators</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                  Live
                </span>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center"
              >
                View All Threat Reports &rarr;
              </button>
            </div>

            {stats.latestReports.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No threat reports recorded yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Be the first community member to submit and register a suspicious URL fingerprint on-chain.
                </p>
                <button
                  onClick={() => onNavigate('report')}
                  className="mt-4 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-xs text-white font-medium transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Report First URL</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Fingerprint (SHA-256)</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Reported</th>
                      <th className="py-2.5 px-3 text-center">Reports</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {stats.latestReports.map((report) => (
                      <tr
                        key={report.urlHash}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-3 px-3 text-cyan-300 font-medium">
                          {formatHash(report.urlHash)}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <CategoryBadge categoryId={report.category} />
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {formatTimestamp(report.reportedAt)}
                        </td>
                        <td className="py-3 px-3 text-center text-white font-bold">
                          {report.reportCount}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            onClick={() => onSelectReport(report)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Displaying up to 5 most recent on-chain indicators</span>
            <span className="font-mono">Total unique on-chain: {stats.totalUniqueURLs}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
