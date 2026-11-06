import React, { useState } from 'react';
import { StrategyDefinition } from '../types/freqtrade';
import { DEFAULT_STRATEGIES } from '../data/strategies';
import { Code, Sliders, Play, Copy, Check, Download, FileText, Sparkles, BookOpen } from 'lucide-react';

interface StrategyWorkbenchProps {
  selectedStrategy: StrategyDefinition;
  setSelectedStrategy: (s: StrategyDefinition) => void;
  onRunBacktest: () => void;
}

export const StrategyWorkbench: React.FC<StrategyWorkbenchProps> = ({
  selectedStrategy,
  setSelectedStrategy,
  onRunBacktest
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'params' | 'lifecycle'>('code');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedStrategy.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([selectedStrategy.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedStrategy.name}.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const updateParam = (key: keyof StrategyDefinition['params'], value: number) => {
    setSelectedStrategy({
      ...selectedStrategy,
      params: {
        ...selectedStrategy.params,
        [key]: value
      }
    });
  };

  const updateStoploss = (val: number) => {
    setSelectedStrategy({
      ...selectedStrategy,
      stoploss: val
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar with strategy selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">
            Strategy Lab & Python Workbench
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Build, inspect, and fine-tune Freqtrade <code className="text-emerald-400 font-mono">IStrategy</code> classes with indicators, entry/exit trends, and minimal ROI tables.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedStrategy.id}
            onChange={(e) => {
              const strat = DEFAULT_STRATEGIES.find((s) => s.id === e.target.value);
              if (strat) setSelectedStrategy(strat);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <optgroup label="Official Reference Strategies">
              {DEFAULT_STRATEGIES.filter((s) => s.source === 'official').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.timeframe})
                </option>
              ))}
            </optgroup>
            <optgroup label="Installed Community Strategies (freqtrade-strategies & Repos)">
              {DEFAULT_STRATEGIES.filter((s) => s.source === 'community').map((s) => (
                <option key={s.id} value={s.id}>
                  ★ {s.name} ({s.timeframe}) — {s.author}
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={onRunBacktest}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Backtest Strategy</span>
          </button>
        </div>
      </div>

      {/* Quick Select Strategy Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 text-[11px] font-mono mr-1 shrink-0">Quick Load:</span>
        {DEFAULT_STRATEGIES.map((s) => {
          const isSelected = selectedStrategy.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedStrategy(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              {s.source === 'community' ? '★ ' : ''}{s.name}
            </button>
          );
        })}
      </div>

      {/* Community Source & Strategy Info Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
              selectedStrategy.source === 'community'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {selectedStrategy.source === 'community' ? 'COMMUNITY (freqtrade-strategies)' : 'OFFICIAL CORE'}
            </span>
            <span className="text-xs text-slate-300 font-semibold">{selectedStrategy.name}</span>
            {selectedStrategy.author && (
              <span className="text-[11px] font-mono text-slate-400">
                by <strong className="text-slate-300">{selectedStrategy.author}</strong>
              </span>
            )}
          </div>
          {selectedStrategy.source === 'community' && (
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Installed from: github.com/freqtrade/freqtrade-strategies
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {selectedStrategy.description}
        </p>

        {selectedStrategy.tags && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {selectedStrategy.tags.map((t, idx) => (
              <span key={idx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Overview Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 font-medium">Timeframe</span>
          <div className="text-sm font-mono font-semibold text-white mt-0.5">{selectedStrategy.timeframe}</div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Stoploss</span>
          <div className="text-sm font-mono font-semibold text-red-400 mt-0.5">
            {(selectedStrategy.stoploss * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Trailing Stop</span>
          <div className="text-sm font-mono font-semibold text-emerald-400 mt-0.5">
            {selectedStrategy.trailing_stop ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <div>
          <span className="text-slate-500 font-medium">Target ROI Steps</span>
          <div className="text-sm font-mono font-semibold text-cyan-400 mt-0.5">
            {Object.keys(selectedStrategy.roi).length} milestones
          </div>
        </div>
      </div>

      {/* Main Grid: Code + Inspector/Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Code Viewer (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-medium text-slate-300">
                user_data/strategies/{selectedStrategy.name}.py
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export .py</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[580px] font-mono text-xs leading-relaxed text-slate-300">
            <pre>
              {selectedStrategy.code.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 text-[11px] w-8">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {/* Basic visual color coding for python tokens */}
                    {line.startsWith('#') || line.startsWith('"""') || line.startsWith('*') ? (
                      <span className="text-slate-500 italic">{line}</span>
                    ) : line.includes('def ') || line.includes('class ') ? (
                      <span className="text-cyan-300 font-semibold">{line}</span>
                    ) : line.includes('import ') || line.includes('from ') ? (
                      <span className="text-purple-400">{line}</span>
                    ) : line.includes('dataframe[') ? (
                      <span className="text-amber-300">{line}</span>
                    ) : line.includes('return ') || line.includes('minimal_roi') || line.includes('stoploss') ? (
                      <span className="text-emerald-400 font-medium">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Right Column: Parameters Tuning & Lifecycle Guide */}
        <div className="space-y-6">
          {/* Tuning Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Live Strategy Tuner</h3>
              </div>
              <span className="text-[11px] text-slate-500">Affects Backtests</span>
            </div>

            {/* Stoploss Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Stoploss (Hard Limit)</span>
                <span className="font-mono text-red-400 font-semibold">
                  {(selectedStrategy.stoploss * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-0.20"
                max="-0.02"
                step="0.005"
                value={selectedStrategy.stoploss}
                onChange={(e) => updateStoploss(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
              />
              <p className="text-[11px] text-slate-500">Unconditional emergency exit when price drops this amount.</p>
            </div>

            {/* RSI Buy Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">RSI Oversold Entry Limit</span>
                <span className="font-mono text-emerald-400 font-semibold">{selectedStrategy.params.rsiBuy}</span>
              </div>
              <input
                type="range"
                min="15"
                max="45"
                value={selectedStrategy.params.rsiBuy}
                onChange={(e) => updateParam('rsiBuy', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <p className="text-[11px] text-slate-500">Buy signal triggered only when 14-period RSI is below this value.</p>
            </div>

            {/* RSI Sell Slider */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">RSI Overbought Exit Limit</span>
                <span className="font-mono text-amber-400 font-semibold">{selectedStrategy.params.rsiSell}</span>
              </div>
              <input
                type="range"
                min="60"
                max="85"
                value={selectedStrategy.params.rsiSell}
                onChange={(e) => updateParam('rsiSell', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <p className="text-[11px] text-slate-500">Signal exit when momentum exceeds this threshold.</p>
            </div>

            {/* Fast EMA Length */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Fast EMA Period</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedStrategy.params.fastEma}</span>
              </div>
              <input
                type="range"
                min="5"
                max="18"
                value={selectedStrategy.params.fastEma}
                onChange={(e) => updateParam('fastEma', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Slow EMA Length */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Slow EMA Period</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedStrategy.params.slowEma}</span>
              </div>
              <input
                type="range"
                min="19"
                max="50"
                value={selectedStrategy.params.slowEma}
                onChange={(e) => updateParam('slowEma', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Strategy Anatomy Reference Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Freqtrade Strategy Anatomy</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <div>
                <strong className="text-slate-200 font-mono text-[11px]">populate_indicators()</strong>
                <p>Runs TA-Lib/qtpylib indicators over the entire historical DataFrame once.</p>
              </div>
              <div>
                <strong className="text-slate-200 font-mono text-[11px]">populate_entry_trend()</strong>
                <p>Flags rows where <code className="text-emerald-400 font-mono">enter_long = 1</code> to enter trades.</p>
              </div>
              <div>
                <strong className="text-slate-200 font-mono text-[11px]">populate_exit_trend()</strong>
                <p>Flags rows where <code className="text-red-400 font-mono">exit_long = 1</code> to close positions.</p>
              </div>
              <div>
                <strong className="text-slate-200 font-mono text-[11px]">minimal_roi</strong>
                <p>Dictionary defining take-profit thresholds decreasing by elapsed trade duration minutes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
