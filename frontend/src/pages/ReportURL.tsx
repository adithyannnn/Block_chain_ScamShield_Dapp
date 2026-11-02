import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Hash,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Lock,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { normalizeURL, computeSHA256Bytes32, THREAT_CATEGORIES, formatTimestamp } from '../lib/urlUtils';
import { useScamShield, ContractReport } from '../hooks/useScamShield';
import { CategoryBadge } from '../components/CategoryBadge';
import { getExplorerTxUrl, CONTRACT_CONFIG, SUPPORTED_NETWORKS } from '../contracts/contractConfig';

interface ReportURLProps {
  scamShield: ReturnType<typeof useScamShield>;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  chainId: number | null;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
}

export const ReportURL: React.FC<ReportURLProps> = ({
  scamShield,
  isConnected,
  isCorrectNetwork,
  chainId,
  onConnectWallet,
  onSwitchNetwork,
}) => {
  const [rawUrl, setRawUrl] = useState('');
  const [category, setCategory] = useState<number>(1);
  const [normalizedUrl, setNormalizedUrl] = useState<string>('');
  const [urlHash, setUrlHash] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Pre-check state
  const [isPreChecking, setIsPreChecking] = useState<boolean>(false);
  const [existingReport, setExistingReport] = useState<ContractReport | null>(null);
  const [preCheckDone, setPreCheckDone] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [resultReport, setResultReport] = useState<ContractReport | null>(null);
  const [isNewReportResult, setIsNewReportResult] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [copiedHash, setCopiedHash] = useState(false);

  // Debounced URL validation, normalization, and fingerprinting
  useEffect(() => {
    setSubmissionSuccess(false);
    setTxHash(null);
    setResultReport(null);
    setErrorMessage(null);
    setExistingReport(null);
    setPreCheckDone(false);

    if (!rawUrl.trim()) {
      setNormalizedUrl('');
      setUrlHash('');
      setValidationError(null);
      return;
    }

    try {
      const norm = normalizeURL(rawUrl);
      setNormalizedUrl(norm);
      setValidationError(null);

      // Async hash computation
      computeSHA256Bytes32(norm)
        .then((hash) => {
          setUrlHash(hash);
          // Trigger pre-check on-chain
          setIsPreChecking(true);
          scamShield
            .checkURL(hash)
            .then(async (exists) => {
              if (exists) {
                const rep = await scamShield.getReport(hash);
                setExistingReport(rep);
              } else {
                setExistingReport(null);
              }
              setPreCheckDone(true);
            })
            .catch(() => {
              setExistingReport(null);
              setPreCheckDone(true);
            })
            .finally(() => {
              setIsPreChecking(false);
            });
        })
        .catch((err) => {
          setUrlHash('');
          setValidationError(err.message || 'Cryptographic hashing failed.');
        });
    } catch (err: any) {
      setNormalizedUrl('');
      setUrlHash('');
      setValidationError(err.message || 'Invalid URL syntax.');
    }
  }, [rawUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rawUrl || validationError || !urlHash) {
      return;
    }

    if (!isConnected) {
      onConnectWallet();
      return;
    }

    if (!isCorrectNetwork) {
      onSwitchNetwork();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmissionSuccess(false);

    try {
      const result = await scamShield.reportURL(urlHash, category);
      setTxHash(result.transactionHash);
      setIsNewReportResult(result.isNewReport);
      setResultReport(result.report);
      setSubmissionSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
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
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Indicator Registration Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Report Suspicious URL Fingerprint
        </h1>
        <p className="mt-1 text-sm text-slate-400 leading-relaxed">
          Submit suspicious links to register their immutable cryptographic SHA-256 fingerprint on-chain. The actual URL is hashed client-side and never published or visited.
        </p>
      </div>

      {/* Main Submission Card */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Suspicious URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                placeholder="https://evil-phishing-portal.com/login?token=target"
                className={`w-full px-4 py-3 rounded-xl bg-navy-950 border text-sm font-mono placeholder:font-sans placeholder:text-slate-600 focus:outline-none transition-all ${
                  validationError
                    ? 'border-rose-500/60 focus:border-rose-500 text-rose-300'
                    : urlHash
                    ? 'border-cyan-500/50 focus:border-cyan-400 text-cyan-200'
                    : 'border-slate-800 focus:border-slate-700 text-slate-200'
                }`}
              />
            </div>
            {validationError ? (
              <p className="text-xs text-rose-400 flex items-center mt-1.5 font-sans">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                {validationError}
              </p>
            ) : (
              <p className="text-xs text-slate-500 font-sans">
                Accepts HTTP and HTTPS protocols only. Embedded credentials (user:pass@) are rejected.
              </p>
            )}
          </div>

          {/* Threat Category Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-200">
              Threat Category Classification
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.values(THREAT_CATEGORIES).map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all text-left ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-navy-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                      <CategoryBadge categoryId={cat.id} showIcon={false} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Processing Inspection Panel */}
          {urlHash && (
            <div className="p-4 rounded-xl bg-navy-950/90 border border-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center">
                  <Hash className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  Client-Side Normalization & Fingerprint Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Web Crypto SHA-256
                </span>
              </div>

              {/* Normalized Preview */}
              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">
                  Normalized URL (Documented RFC 3986 Policy):
                </span>
                <p className="text-xs font-mono text-slate-300 bg-navy-900 p-2 rounded border border-slate-800/80 break-all select-all">
                  {normalizedUrl}
                </p>
              </div>

              {/* SHA-256 Hash */}
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-500">
                    Cryptographic SHA-256 Digest (bytes32 format):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center"
                  >
                    {copiedHash ? (
                      <>
                        <Check className="w-3 h-3 mr-1 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" /> Copy Hash
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs font-mono text-cyan-300 bg-navy-900 p-2 rounded border border-slate-800/80 break-all select-all">
                  {urlHash}
                </p>
              </div>

              {/* Pre-Check Status Notice */}
              {isPreChecking ? (
                <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Checking on-chain registry for existing reports...</span>
                </div>
              ) : preCheckDone && existingReport ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start space-x-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold block">URL Fingerprint Already Recorded On-Chain!</span>
                    <span className="text-amber-200/90 leading-relaxed block mt-0.5">
                      This fingerprint currently has <strong>{existingReport.reportCount}</strong> community reports (first reported on {formatTimestamp(existingReport.reportedAt)}).
                      Submitting will <strong>increment the report counter</strong> without overwriting original reporter integrity.
                    </span>
                  </div>
                </div>
              ) : preCheckDone ? (
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-cyan-400" />
                  <span>
                    New Fingerprint: This submission will register a brand new threat record in the smart contract.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Action Button & Wallet Status */}
          <div className="pt-2">
            {!isConnected ? (
              <button
                type="button"
                onClick={onConnectWallet}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Connect MetaMask to Submit Report</span>
              </button>
            ) : !isCorrectNetwork ? (
              <button
                type="button"
                onClick={onSwitchNetwork}
                className="w-full py-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Switch to {SUPPORTED_NETWORKS[CONTRACT_CONFIG.chainId]?.name || 'Localhost'} (Chain ID {CONTRACT_CONFIG.chainId})</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!urlHash || !!validationError || isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing & Confirming on Ethereum...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {existingReport ? 'Submit Duplicate Report (+1 Count)' : 'Register On-Chain Report'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-rose-200">Transaction Failed</p>
              <p className="mt-1 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Confirmed Success State */}
        {submissionSuccess && resultReport && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <h3 className="text-base font-bold text-white">
                  {isNewReportResult ? 'New Threat Report Registered!' : 'Report Count Incremented!'}
                </h3>
                <p className="text-xs text-emerald-300">
                  Transaction confirmed on-chain in block.
                </p>
              </div>
            </div>

            {/* Confirmed Data Details */}
            <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>URL Fingerprint:</span>
                <span className="text-cyan-300 truncate max-w-xs">{resultReport.urlHash}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Total On-Chain Reports:</span>
                <span className="text-white font-bold">{resultReport.reportCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Original Reporter:</span>
                <span className="text-slate-300">{resultReport.reporter}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>First Recorded:</span>
                <span className="text-slate-300">{formatTimestamp(resultReport.reportedAt)}</span>
              </div>
            </div>

            {/* Transaction Hash & Explorer Link */}
            {txHash && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-500/20">
                <span className="text-slate-400">Transaction Hash:</span>
                <a
                  href={getExplorerTxUrl(txHash, chainId || undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 font-mono inline-flex items-center"
                >
                  <span className="truncate max-w-[200px] sm:max-w-xs">{txHash}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cyber Security Protocol Guidelines */}
      <div className="rounded-2xl bg-navy-900/60 border border-slate-800 p-6 space-y-3 text-xs text-slate-400">
        <h4 className="font-semibold text-slate-200 text-sm flex items-center">
          <Info className="w-4 h-4 mr-2 text-cyan-400" />
          ScamShield Threat Handling Principles
        </h4>
        <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-slate-400">
          <li>
            <strong>Zero Remote Navigation:</strong> ScamShield never opens, crawls, renders in an iframe, or fetches headers from submitted URLs.
          </li>
          <li>
            <strong>Local Cryptographic Hashing:</strong> Normalization and SHA-256 calculation are performed entirely in your browser using the W3C Web Crypto API before touching the blockchain.
          </li>
          <li>
            <strong>Privacy Preservation:</strong> Plaintext URLs, passwords, API keys, and personal credentials are never stored on the public blockchain.
          </li>
          <li>
            <strong>Community Disclaimer:</strong> All registered reports are decentralized submissions and should be corroborated with formal threat feeds.
          </li>
        </ul>
      </div>
    </div>
  );
};
