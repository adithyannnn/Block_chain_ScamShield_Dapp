import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, NavigationPage } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ReportURL } from './pages/ReportURL';
import { CheckURL } from './pages/CheckURL';
import { ThreatReports } from './pages/ThreatReports';
import { MyReports } from './pages/MyReports';
import { About } from './pages/About';
import { ReportDetailsModal } from './components/ReportDetailsModal';
import { useMetaMask } from './hooks/useMetaMask';
import { useScamShield, ContractReport, DashboardStats } from './hooks/useScamShield';
import { TARGET_CHAIN_ID } from './contracts/contractConfig';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [selectedReport, setSelectedReport] = useState<ContractReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // MetaMask integration
  const metaMask = useMetaMask();

  // ScamShield contract integration
  const scamShield = useScamShield(metaMask.provider, metaMask.signer, metaMask.chainId);

  // Dashboard statistics state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUniqueURLs: 0,
    totalSubmissions: 0,
    categoryBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    latestReports: [],
    isLoading: true,
    error: null,
  });

  const loadStats = useCallback(async () => {
    const stats = await scamShield.getDashboardStats();
    setDashboardStats(stats);
  }, [scamShield]);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleSelectReport = (report: ContractReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Wrong Network Warning Banner */}
      {metaMask.isConnected && !metaMask.isCorrectNetwork && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-3xl">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              You are connected to an unsupported network (Chain ID: {metaMask.chainId}). Please switch to Ethereum Sepolia Testnet (Chain ID: {TARGET_CHAIN_ID}) to sign transactions.
            </span>
          </div>
          <button
            onClick={() => metaMask.switchNetwork(TARGET_CHAIN_ID)}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs transition-colors ml-4 flex-shrink-0"
          >
            Switch Network
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        account={metaMask.account}
        chainId={metaMask.chainId}
        isConnected={metaMask.isConnected}
        isCorrectNetwork={metaMask.isCorrectNetwork}
        isConnecting={metaMask.isConnecting}
        onConnectWallet={metaMask.connectWallet}
        onDisconnectWallet={metaMask.disconnectWallet}
        onSwitchNetwork={metaMask.switchNetwork}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && (
          <Dashboard
            stats={dashboardStats}
            onRefresh={loadStats}
            onSelectReport={handleSelectReport}
            onNavigate={setCurrentPage}
            account={metaMask.account}
            chainId={metaMask.chainId}
            isConnected={metaMask.isConnected}
          />
        )}

        {currentPage === 'report' && (
          <ReportURL
            scamShield={scamShield}
            isConnected={metaMask.isConnected}
            isCorrectNetwork={metaMask.isCorrectNetwork}
            chainId={metaMask.chainId}
            onConnectWallet={metaMask.connectWallet}
            onSwitchNetwork={metaMask.switchNetwork}
          />
        )}

        {currentPage === 'check' && (
          <CheckURL
            scamShield={scamShield}
            chainId={metaMask.chainId}
          />
        )}

        {currentPage === 'reports' && (
          <ThreatReports
            scamShield={scamShield}
            onSelectReport={handleSelectReport}
            chainId={metaMask.chainId}
          />
        )}

        {currentPage === 'my-reports' && (
          <MyReports
            scamShield={scamShield}
            account={metaMask.account}
            isConnected={metaMask.isConnected}
            onConnectWallet={metaMask.connectWallet}
            onSelectReport={handleSelectReport}
            onNavigate={setCurrentPage}
            chainId={metaMask.chainId}
          />
        )}

        {currentPage === 'about' && <About />}
      </main>

      {/* Report Details Modal */}
      <ReportDetailsModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        chainId={metaMask.chainId}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-navy-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">ScamShield DApp</span>
            <span>&bull;</span>
            <span>MSc Cyber Security Assignment</span>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-500">
            <span>Powered by Solidity 0.8.24, Hardhat, Ethers.js v6 & Ethereum Sepolia</span>
            <div className="text-slate-600 mt-0.5">
              Community threat prototype. Never navigate to suspicious URLs directly.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
