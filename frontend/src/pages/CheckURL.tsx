import React, { useState } from 'react';
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  Hash,
  ExternalLink,
  Info,
  CheckCircle,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import { normalizeURL, computeSHA256Bytes32, formatTimestamp, formatAddress } from '../lib/urlUtils';
import { useScamShield, ContractReport } from '../hooks/useScamShield';
import { CategoryBadge } from '../components/CategoryBadge';
import { getExplorerAddressUrl } from '../contracts/contractConfig';

interface CheckURLProps {
  scamShield: ReturnType<typeof useScamShield>;
  chainId: number | null;
}

type CheckStatus = 'IDLE' | 'LOADING' | 'PREVIOUSLY_REPORTED' | 'NO_REPORT_FOUND' | 'INVALID_URL' | 'ERROR';

export const CheckURL: React.FC<CheckURLProps> = ({ scamShield, chainId }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState<CheckStatus>('IDLE');
  const [normalizedUrl, setNormalizedUrl] = useState<string>('');
  const [urlHash, setUrlHash] = useState<string>('');
  const [reportData, setReportData] = useState<ContractReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputUrl.trim()) {
      setStatus('INVALID_URL');
      setErrorMessage('Please enter a URL to check.');
      return;
    }

    setStatus('LOADING');
    setErrorMessage(null);
    setReportData(null);

    let norm: string;
    let hash: string;

    // Step 1: Client-Side Validation and Normalization
    try {
      norm = normalizeURL(inputUrl);
      setNormalizedUrl(norm);
    } catch (valErr: any) {
      setStatus('INVALID_URL');
      setErrorMessage(valErr.message || 'URL failed syntactic validation.');
      return;
    }

    // Step 2: Client-Side SHA-256 Digest
    try {
      hash = await computeSHA256Bytes32(norm);
      setUrlHash(hash);
    } catch (hashErr: any) {
      setStatus('ERROR');
      setErrorMessage(hashErr.message || 'Cryptographic hashing failed.');
      return;
    }

    // Step 3: Query Smart Contract On-Chain
    try {
      const exists = await scamShield.checkURL(hash);
      if (exists) {
        const fullReport = await scamShield.getReport(hash);
        setReportData(fullReport);
        setStatus('PREVIOUSLY_REPORTED');
      } else {
        setStatus('NO_REPORT_FOUND');
      }
    } catch (contractErr: any) {
      console.error('Check URL query error:', contractErr);
      setStatus('ERROR');
      setErrorMessage(contractErr.message || 'Failed to query smart contract on blockchain.');
    }
  };

  const handleCopyHash = () => {
    if (urlHash) {
      navigator.clipboard.writeText(urlHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
          <Search className="w-3.5 h-3.5" />
          <span>Threat Verification Protocol</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Verify URL Threat Intelligence
        </h1>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">
          Check if a URL’s cryptographic fingerprint has been recorded in the community threat registry. No remote connection to the target URL is ever made.
        </p>
      </div>

      {/* Query Card */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Target URL to Query
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (status !== 'IDLE') setStatus('IDLE');
                }}
                placeholder="https://suspicious-domain.com/login"
                className="flex-1 px-4 py-3 rounded-xl bg-navy-950 border border-slate-800 focus:border-cyan-500 text-sm font-mono text-slate-200 placeholder:font-sans placeholder:text-slate-600 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={status === 'LOADING'}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{status === 'LOADING' ? 'Checking...' : 'Check Fingerprint'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Cryptographic Normalization Fingerprint Preview (Shown once computed) */}
        {urlHash && (
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="flex items-center">
                <Hash className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                Generated SHA-256 Fingerprint (bytes32):
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-cyan-400 hover:text-cyan-300 font-sans flex items-center"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3 h-3 mr-1 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-cyan-300 break-all select-all bg-navy-900 p-2 rounded border border-slate-800/80">
              {urlHash}
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Normalized form: <span className="text-slate-300 break-all">{normalizedUrl}</span>
            </p>
          </div>
        )}

        {/* 4 Explicit Outcome States */}
        {status === 'PREVIOUSLY_REPORTED' && reportData && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-5 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-rose-400 block font-mono">
                  Registry Status
                </span>
                <h3 className="text-lg font-bold text-white">PREVIOUSLY REPORTED</h3>
              </div>
            </div>

            <p className="text-xs text-rose-200/90 leading-relaxed">
              A matching cryptographic fingerprint was identified on the blockchain. This URL has been flagged by community members as a potential threat.
            </p>

            {/* Record Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Threat Category</span>
                <CategoryBadge categoryId={reportData.category} />
              </div>

              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Report Count</span>
                <span className="text-base font-bold font-mono text-white">
                  {reportData.reportCount} submissions
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">First Reported</span>
                <span className="text-xs font-mono text-slate-300">
                  {formatTimestamp(reportData.reportedAt)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-950/80 border border-slate-800">
                <span className="text-slate-400 block mb-1">Original Reporter</span>
                <div className="flex items-center justify-between font-mono text-cyan-300">
                  <span>{formatAddress(reportData.reporter)}</span>
                  <a
                    href={getExplorerAddressUrl(reportData.reporter, chainId || undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 ml-1"
                    title="View reporter in blockchain explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Mandatory Threat Advisory Disclaimer */}
            <div className="p-3 rounded-xl bg-navy-950/90 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Threat Intelligence Caveat:</strong> A report record signifies a community submission. It is not conclusive judicial proof of malicious operation. Exercise extreme caution and do not disclose credentials.
              </span>
            </div>
          </div>
        )}

        {status === 'NO_REPORT_FOUND' && (
          <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-3 text-teal-400">
              <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-teal-400 block font-mono">
                  Registry Status
                </span>
                <h3 className="text-lg font-bold text-white">NO REPORT FOUND</h3>
              </div>
            </div>

            <p className="text-xs text-teal-200/90 leading-relaxed">
              No matching fingerprint exists in the smart contract registry. This URL has not been submitted or flagged in ScamShield.
            </p>

            <div className="p-3.5 rounded-xl bg-navy-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <p className="font-semibold text-slate-300 flex items-center">
                <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                Critical Security Warning:
              </p>
              <p className="leading-relaxed">
                The absence of an on-chain report does <strong>NOT</strong> prove that a URL is safe. Newly orchestrated zero-day phishing campaigns often operate for hours before community detection. Always inspect TLS certificates and domain spelling.
              </p>
            </div>
          </div>
        )}

        {status === 'INVALID_URL' && (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center space-x-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-amber-400 block font-mono">
                  Registry Status
                </span>
                <h3 className="text-lg font-bold text-white">INVALID URL SYNTAX</h3>
              </div>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {errorMessage || 'The supplied URL failed validation against ScamShield RFC 3986 policy.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Ensure the URL includes an <code>http://</code> or <code>https://</code> scheme and contains no unencoded whitespace or embedded user credentials.
            </p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-rose-400 block font-mono">
                  Registry Status
                </span>
                <h3 className="text-lg font-bold text-white">QUERY ERROR</h3>
              </div>
            </div>
            <p className="text-xs text-rose-200 leading-relaxed">
              {errorMessage || 'The on-chain query could not be completed.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Verify your network connection and ensure the smart contract has been properly deployed to the network.
            </p>
          </div>
        )}
      </div>

      {/* Verification Protocol Information */}
      <div className="rounded-2xl bg-navy-900/60 border border-slate-800 p-6 space-y-3 text-xs text-slate-400">
        <h4 className="font-semibold text-slate-200 text-sm flex items-center">
          <Info className="w-4 h-4 mr-2 text-cyan-400" />
          How Fingerprint Verification Works
        </h4>
        <p className="leading-relaxed">
          When you check a URL, ScamShield applies deterministic normalization (lowercasing hostname, standardizing default ports, collapsing duplicate slashes, sorting query parameters). The client browser hashes the result into a 32-byte SHA-256 digest and performs a read-only <code>checkURL(bytes32)</code> call to the Ethereum smart contract. No gas fee or wallet signature is required to check indicators.
        </p>
      </div>
    </div>
  );
};
