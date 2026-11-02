import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, ShieldAlert, Calendar, User, Hash, AlertCircle } from 'lucide-react';
import { ContractReport } from '../hooks/useScamShield';
import { CategoryBadge } from './CategoryBadge';
import { formatTimestamp, THREAT_CATEGORIES } from '../lib/urlUtils';
import { getExplorerAddressUrl } from '../contracts/contractConfig';

interface ReportDetailsModalProps {
  report: ContractReport | null;
  isOpen: boolean;
  onClose: () => void;
  chainId: number | null;
}

export const ReportDetailsModal: React.FC<ReportDetailsModalProps> = ({
  report,
  isOpen,
  onClose,
  chainId,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.urlHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryInfo = THREAT_CATEGORIES[report.category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-navy-900 border border-slate-800 shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">On-Chain Threat Record</h3>
              <p className="text-xs text-slate-400">Cryptographic indicator registered on EVM blockchain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          {/* Fingerprint */}
          <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400 flex items-center">
                <Hash className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                SHA-256 URL Fingerprint (bytes32)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center text-xs text-cyan-400 hover:text-cyan-300 font-mono"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Hash
                  </>
                )}
              </button>
            </div>
            <p className="text-xs font-mono text-cyan-300 break-all select-all bg-navy-900 p-2 rounded border border-slate-800/80">
              {report.urlHash}
            </p>
          </div>

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Threat Category</span>
              <div className="flex items-center mt-1">
                <CategoryBadge categoryId={report.category} />
              </div>
              {categoryInfo && (
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {categoryInfo.description}
                </p>
              )}
            </div>

            {/* Total Reports */}
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Community Report Count</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-bold font-mono text-white">
                  {report.reportCount}
                </span>
                <span className="text-xs text-slate-400">
                  {report.reportCount === 1 ? 'submission' : 'independent reports'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Incremented on each repeated community report.
              </p>
            </div>

            {/* First Reported Date */}
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center mb-1">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                First Recorded Timestamp
              </span>
              <p className="text-sm font-mono text-slate-200 mt-1">
                {formatTimestamp(report.reportedAt)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Block timestamp when the record was initially created.
              </p>
            </div>

            {/* Original Reporter */}
            <div className="p-3.5 rounded-xl bg-navy-950/60 border border-slate-800">
              <span className="text-xs text-slate-400 flex items-center mb-1">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Original Reporter
              </span>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-mono text-cyan-300 truncate max-w-[190px]">
                  {report.reporter}
                </p>
                {report.reporter && (
                  <a
                    href={getExplorerAddressUrl(report.reporter, chainId || undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center ml-2"
                  >
                    Explorer <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Immutable origin address recorded on-chain.
              </p>
            </div>
          </div>

          {/* Security Disclaimer Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cybersecurity Advisory & Prototype Context</p>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                This record represents a community-submitted threat report. On-chain presence indicates that community members flagged this URL fingerprint, but does not constitute formal forensic attribution. Never navigate to suspicious URLs directly.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
