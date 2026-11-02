import React from 'react';
import {
  ShieldCheck,
  Lock,
  Layers,
  AlertTriangle,
  FileCheck,
  Cpu,
  Database,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { CONTRACT_CONFIG, TARGET_CHAIN_ID, getExplorerAddressUrl } from '../contracts/contractConfig';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>MSc Cyber Security Blockchain Research</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About ScamShield
        </h1>
        <p className="mt-2 text-base text-slate-400 leading-relaxed">
          A decentralized, tamper-proof threat intelligence architecture utilizing EVM smart contracts and client-side cryptographic hashing to counter phishing and Web3 social engineering attacks.
        </p>
      </div>

      {/* Abstract & Motivation */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-cyan-400" />
          Executive Problem Statement & Motivation
        </h2>
        <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
          <p>
            Phishing remains the dominant attack vector against decentralized finance (DeFi) participants, cryptocurrency holders, and enterprise infrastructure. Traditional centralized threat intelligence repositories (e.g., Google Safe Browsing, proprietary vendor blacklists) introduce significant security vulnerabilities:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-2">
            <li>
              <strong>Centralized Points of Failure:</strong> Blacklists can be censored, delayed by bureaucratic review, or compromised at the administrative level.
            </li>
            <li>
              <strong>Censorship Vulnerability:</strong> A single entity holds the authority to delist or suppress malicious indicators.
            </li>
            <li>
              <strong>Lack of Verifiable Provenance:</strong> Traditional feeds provide limited cryptographic evidence of when an indicator was first discovered and by whom.
            </li>
          </ul>
          <p>
            <strong>ScamShield</strong> resolves these architectural limitations by implementing a public, append-only, decentralized threat registry on the Ethereum blockchain. Reports are immutable, cryptographically verifiable, and devoid of administrative backdoors.
          </p>
        </div>
      </div>

      {/* System Architecture */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Layers className="w-5 h-5 mr-2 text-cyan-400" />
          Technical Architecture & Protocol Flow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-cyan-500/10 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">1. Client-Side Hash Engine</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browser Web Crypto API validates, normalizes, and computes SHA-256 digests locally. Raw URLs are never broadcasted or fetched.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-teal-500/10 text-teal-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">2. Web3 Signer & Ethers.js</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MetaMask requests explicit cryptographic transaction approval from the investigator. Ensures non-repudiation of submissions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-2">
            <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">3. Immutable EVM Contract</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Solidity 0.8.24 smart contract maintains chronological fingerprints, reporter mappings, and cumulative community counts without admin keys.
            </p>
          </div>
        </div>
      </div>

      {/* URL Normalization Specification */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FileCheck className="w-5 h-5 mr-2 text-cyan-400" />
          Documented URL Normalization Policy
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          In cryptographic threat intelligence, canonicalization is crucial: minor syntactic variations (such as uppercase characters or parameter ordering) must map to the identical SHA-256 digest:
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
            <thead className="bg-navy-950 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3 border-b border-slate-800">Rule Element</th>
                <th className="py-2.5 px-3 border-b border-slate-800">Policy Specification</th>
                <th className="py-2.5 px-3 border-b border-slate-800">Security Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Protocol Scheme</td>
                <td className="py-2.5 px-3 text-cyan-300">HTTP / HTTPS only (lowercased)</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Rejects XSS payloads (javascript:) and unmonitored protocols.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Userinfo / Credentials</td>
                <td className="py-2.5 px-3 text-rose-400 font-bold">STRICTLY REJECTED</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Blocks deceptive userinfo attacks (e.g. user:pass@evil.com).</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Hostname</td>
                <td className="py-2.5 px-3 text-cyan-300">Lowercased, trailing dot removed</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">DNS is case-insensitive; eliminates duplicate hashes.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Default Ports</td>
                <td className="py-2.5 px-3 text-cyan-300">Strip :80 for HTTP, :443 for HTTPS</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Aligns standard browser defaults; keeps non-standard ports (:8080).</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Path Slashes</td>
                <td className="py-2.5 px-3 text-cyan-300">Collapse // and strip trailing non-root slash</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Canonicalizes web server route redundancy.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">Query Parameters</td>
                <td className="py-2.5 px-3 text-cyan-300">Sorted alphabetically by key</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">Ensures ?b=2&a=1 matches ?a=1&b=2 deterministically.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-sans font-medium text-white">URL Fragment (#)</td>
                <td className="py-2.5 px-3 text-cyan-300">Preserved verbatim</td>
                <td className="py-2.5 px-3 font-sans text-slate-400">SPA phishing kits heavily utilize hash routes for credential theft.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Threat Model & Cybersecurity Considerations */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-400" />
          Cybersecurity Considerations & System Limitations
        </h2>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
            <h4 className="font-bold text-slate-200 text-sm mb-1">
              1. Prototype Disclaimer vs. Production Antivirus
            </h4>
            <p className="text-slate-400">
              ScamShield is an academic research threat-reporting prototype. Presence in the registry reflects community flagging; absence does not prove that a target URL is benign. Automated threat orchestration by adversaries creates zero-day domains that require multi-layered defense-in-depth.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
            <h4 className="font-bold text-slate-200 text-sm mb-1">
              2. SHA-256 Collision & Pre-Image Security
            </h4>
            <p className="text-slate-400">
              SHA-256 possesses 128-bit collision resistance and 256-bit pre-image resistance, preventing adversaries from forging another URL that shares the same bytes32 fingerprint. However, because URLs from high-profile services are predictable, rainbow tables can verify whether known popular URLs have been reported.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-950 border border-slate-800">
            <h4 className="font-bold text-slate-200 text-sm mb-1">
              3. Sybil Attacks and Counter Manipulation
            </h4>
            <p className="text-slate-400">
              In this demonstration, any Ethereum address with testnet gas may increment the report count of an existing indicator. In an enterprise production deployment, a Sybil-resistant staking model (e.g. Proof of Stake or tokenized bond slashing for frivolous/malicious reporting) would be incorporated to deter spam.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Context & Contract Reference */}
      <div className="rounded-2xl bg-navy-900/90 border border-slate-800 p-6 sm:p-8 space-y-3">
        <h3 className="text-base font-bold text-white">Smart Contract Reference</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The ScamShield contract is deployed on EVM target networks with full NatSpec annotations, custom revert errors, and strict immutability guarantees.
        </p>
        <div className="p-3 rounded-xl bg-navy-950 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center justify-between">
          <span>Address: {CONTRACT_CONFIG.address || 'Pending Local/Sepolia Deployment'}</span>
          {CONTRACT_CONFIG.address && (
            <a
              href={getExplorerAddressUrl(CONTRACT_CONFIG.address, TARGET_CHAIN_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 inline-flex items-center ml-2"
            >
              <span>Sepolia Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
