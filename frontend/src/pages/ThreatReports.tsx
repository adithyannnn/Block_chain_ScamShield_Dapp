import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Database,
} from 'lucide-react';
import { ContractReport, useScamShield } from '../hooks/useScamShield';
import { CategoryBadge } from '../components/CategoryBadge';
import { formatAddress, formatHash, formatTimestamp, THREAT_CATEGORIES } from '../lib/urlUtils';
import { getExplorerAddressUrl } from '../contracts/contractConfig';

interface ThreatReportsProps {
  scamShield: ReturnType<typeof useScamShield>;
  onSelectReport: (report: ContractReport) => void;
  chainId: number | null;
}

export const ThreatReports: React.FC<ThreatReportsProps> = ({
  scamShield,
  onSelectReport,
  chainId,
}) => {
  const [reports, setReports] = useState<ContractReport[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Filter by category
  const [selectedCategory, setSelectedCategory] = useState<number | 'ALL'>('ALL');

  const fetchReports = async (pageNumber: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (pageNumber - 1) * pageSize;
      const result = await scamShield.getThreatReports(offset, pageSize);
      setReports(result.reports);
      setTotal(result.total);
    } catch (err: any) {
      console.error('Failed to load threat reports:', err);
      setError(err.message || 'Failed to fetch threat reports from blockchain.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(page);
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filteredReports =
    selectedCategory === 'ALL'
      ? reports
      : reports.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
            <Database className="w-3.5 h-3.5" />
            <span>On-Chain Threat Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Threat Intelligence Registry
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Immutable log of all cryptographic URL fingerprints submitted to ScamShield.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-navy-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Categories</option>
              {Object.values(THREAT_CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchReports(page)}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-navy-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">Retrieving records from smart contract...</p>
            <p className="text-xs text-slate-500 mt-1">Reading EVM state from blockchain node</p>
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-bold text-rose-300">Failed to Query Threat Registry</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchReports(page)}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center">
            <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">
              {total === 0
                ? 'No threat reports have been registered on-chain yet.'
                : 'No reports match the selected category filter.'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {total === 0 ? 'Use the Report URL tab to submit the first indicator.' : 'Try selecting All Categories.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">SHA-256 Fingerprint</th>
                  <th className="py-3 px-4">Threat Category</th>
                  <th className="py-3 px-4">Original Reporter</th>
                  <th className="py-3 px-4">First Reported</th>
                  <th className="py-3 px-4 text-center">Reports</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredReports.map((report) => (
                  <tr
                    key={report.urlHash}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-cyan-300">
                      {formatHash(report.urlHash)}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <CategoryBadge categoryId={report.category} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <span>{formatAddress(report.reporter)}</span>
                        <a
                          href={getExplorerAddressUrl(report.reporter, chainId || undefined)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-cyan-400"
                          title="View on explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-sans">
                      {formatTimestamp(report.reportedAt)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-white font-bold">
                        {report.reportCount}
                      </span>
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

        {/* Pagination & Footer Summary */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-200">
              {total > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-200">
              {Math.min(page * pageSize, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-200 font-mono">{total}</span> unique URL indicators
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-navy-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
