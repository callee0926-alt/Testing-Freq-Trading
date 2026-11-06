import React from 'react';
import { Terminal, Cpu, Play, Settings, BookOpen, Layers } from 'lucide-react';
import { ActiveTab } from '../types/freqtrade';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isTerminalOpen: boolean;
  setIsTerminalOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isTerminalOpen,
  setIsTerminalOpen
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('setup');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2.5 font-sans"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <span>Freqtrade Studio</span>
        </a>
      </div>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('setup')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'setup' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Setup & Branches
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'strategy' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Strategy Lab
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
            activeTab === 'data' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <span>Historical Data</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
            30 Pairs
          </span>
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'backtest' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Backtester
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'live' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Live Simulator
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'config' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Config Generator
        </button>
        <button
          onClick={() => setActiveTab('cheatsheet')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
            activeTab === 'cheatsheet' ? 'text-white border-b-2 border-emerald-500 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          Cheat Sheet
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 border ${
            isTerminalOpen
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold'
              : 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>freqtrade CLI</span>
        </button>
      </div>
    </header>
  );
};
