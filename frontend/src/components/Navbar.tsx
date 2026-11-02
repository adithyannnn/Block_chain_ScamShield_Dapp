import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  ChevronDown,
  Menu,
  X,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { formatAddress } from '../lib/urlUtils';
import { SUPPORTED_NETWORKS, TARGET_CHAIN_ID } from '../contracts/contractConfig';

export type NavigationPage = 'dashboard' | 'report' | 'check' | 'reports' | 'my-reports' | 'about';

interface NavbarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  onConnectWallet: () => void;
  onDisconnectWallet: () => void;
  onSwitchNetwork: (targetChain?: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  account,
  chainId,
  isConnected,
  isCorrectNetwork,
  isConnecting,
  onConnectWallet,
  onDisconnectWallet,
  onSwitchNetwork,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentNetwork = chainId ? SUPPORTED_NETWORKS[chainId] : null;

  const navItems: { id: NavigationPage; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'report', label: 'Report URL' },
    { id: 'check', label: 'Check URL' },
    { id: 'reports', label: 'Threat Reports' },
    { id: 'my-reports', label: 'My Reports' },
    { id: 'about', label: 'About' },
  ];

  const handleNavClick = (page: NavigationPage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-navy-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg text-white tracking-wide">ScamShield</span>
                <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                  DApp
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Decentralized Phishing Threat Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Network & Wallet Controls */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Network Indicator */}
            {isConnected && (
              <div>
                {isCorrectNetwork ? (
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span>{currentNetwork?.name || `Chain ID ${chainId}`}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => onSwitchNetwork(TARGET_CHAIN_ID)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
                    title="Click to switch to Ethereum Sepolia"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span>Switch to Sepolia</span>
                  </button>
                )}
              </div>
            )}

            {/* Wallet Connect / Account Info */}
            {!isConnected ? (
              <button
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-cyan-950/50 border border-cyan-400/30 transition-all disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-navy-900 border border-slate-700/80 hover:border-cyan-500/40 text-sm font-mono text-slate-200 transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span>{formatAddress(account || '')}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-navy-900 border border-slate-800 shadow-2xl py-2 z-50">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                        Connected Account
                      </p>
                      <p className="text-xs font-mono text-cyan-300 break-all select-all mt-1">
                        {account}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleNavClick('my-reports');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        View My Reports
                      </button>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onDisconnectWallet();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-navy-950 px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === item.id
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800">
            {!isConnected ? (
              <button
                onClick={() => {
                  onConnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-semibold"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect MetaMask</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-navy-900 border border-slate-800 text-xs font-mono text-cyan-300">
                  {account}
                </div>
                {!isCorrectNetwork && (
                  <button
                    onClick={() => {
                      onSwitchNetwork(TARGET_CHAIN_ID);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-medium"
                  >
                    Switch to Sepolia Network
                  </button>
                )}
                <button
                  onClick={() => {
                    onDisconnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium"
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
