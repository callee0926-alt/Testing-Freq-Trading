import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BranchSetupGuide } from './components/BranchSetupGuide';
import { StrategyWorkbench } from './components/StrategyWorkbench';
import { BacktestEngine } from './components/BacktestEngine';
import { LiveBotCockpit } from './components/LiveBotCockpit';
import { ConfigGenerator } from './components/ConfigGenerator';
import { CheatSheet } from './components/CheatSheet';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { HistoricalDataManager } from './components/HistoricalDataManager';
import { ActiveTab, BranchType, StrategyDefinition } from './types/freqtrade';
import { DEFAULT_STRATEGIES } from './data/strategies';
import { GitBranch, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('data');
  const [currentBranch, setCurrentBranch] = useState<BranchType>('stable');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyDefinition>(DEFAULT_STRATEGIES[0]);
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [terminalInitialCmd, setTerminalInitialCmd] = useState<string | undefined>(undefined);
  const [backtestDays, setBacktestDays] = useState<number>(730);
  const [backtestIsPortfolio, setBacktestIsPortfolio] = useState<boolean>(true);

  const handleOpenTerminalWithCmd = (cmd?: string) => {
    setTerminalInitialCmd(cmd);
    setIsTerminalOpen(true);
  };

  const handleRunBacktest = () => {
    setActiveTab('backtest');
  };

  const handleNavigateToBacktestWithParams = (days: number = 730, isPortfolio: boolean = true) => {
    setBacktestDays(days);
    setBacktestIsPortfolio(isPortfolio);
    setActiveTab('backtest');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTerminalOpen={isTerminalOpen}
        setIsTerminalOpen={setIsTerminalOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'setup' && (
          <BranchSetupGuide
            currentBranch={currentBranch}
            setBranch={setCurrentBranch}
            onOpenTerminal={handleOpenTerminalWithCmd}
          />
        )}

        {activeTab === 'strategy' && (
          <StrategyWorkbench
            selectedStrategy={selectedStrategy}
            setSelectedStrategy={setSelectedStrategy}
            onRunBacktest={handleRunBacktest}
          />
        )}

        {activeTab === 'data' && (
          <HistoricalDataManager
            onNavigateToBacktest={handleNavigateToBacktestWithParams}
            onOpenTerminal={handleOpenTerminalWithCmd}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestEngine 
            selectedStrategy={selectedStrategy} 
            setSelectedStrategy={setSelectedStrategy}
            initialDays={backtestDays}
            initialIsPortfolio={backtestIsPortfolio}
            onNavigateToData={() => setActiveTab('data')}
          />
        )}

        {activeTab === 'live' && (
          <LiveBotCockpit />
        )}

        {activeTab === 'config' && (
          <ConfigGenerator />
        )}

        {activeTab === 'cheatsheet' && (
          <CheatSheet />
        )}
      </main>

      {/* Floating Interactive Terminal Component */}
      <InteractiveTerminal
        currentBranch={currentBranch}
        setBranch={setCurrentBranch}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        initialCommand={terminalInitialCmd}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-slate-400">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Git Branch:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
              currentBranch === 'stable'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}>
              {currentBranch}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-700">·</span>
          <span className="hidden sm:inline">Freqtrade v2024.12</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <button
            onClick={() => setActiveTab('setup')}
            className="hover:text-slate-200 transition-colors"
          >
            Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className="hover:text-slate-200 transition-colors"
          >
            Command Cheat Sheet
          </button>
          <a
            href="https://www.freqtrade.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-200 transition-colors"
          >
            Official Docs
          </a>
        </div>
      </footer>
    </div>
  );
}
