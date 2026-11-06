import React, { useState, useMemo, useEffect } from 'react';
import { StrategyDefinition, Candle, BacktestSummary, BacktestTrade } from '../types/freqtrade';
import { runSimulation, runPortfolioSimulation, generateCandles, PairBacktestStat } from '../data/mockMarketData';
import { DEFAULT_STRATEGIES } from '../data/strategies';
import { TOP_30_PAIRS } from '../data/top30Pairs';
import { 
  Play, TrendingUp, TrendingDown, RefreshCw, Filter, Award, ShieldAlert, 
  BarChart3, Clock, DollarSign, Calendar, Copy, Check, Info, 
  AlertTriangle, ChevronDown, ChevronUp, Layers, Sliders, Database, Lightbulb, 
  CheckCircle2, Sparkles, ArrowRight, DownloadCloud
} from 'lucide-react';

interface BacktestEngineProps {
  selectedStrategy: StrategyDefinition;
  setSelectedStrategy?: (s: StrategyDefinition) => void;
  initialDays?: number;
  initialIsPortfolio?: boolean;
  onNavigateToData?: () => void;
}

export const BacktestEngine: React.FC<BacktestEngineProps> = ({ 
  selectedStrategy,
  setSelectedStrategy,
  initialDays = 90,
  initialIsPortfolio = false,
  onNavigateToData
}) => {
  const [isPortfolioMode, setIsPortfolioMode] = useState<boolean>(initialIsPortfolio);
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USDT');
  const [selectedDays, setSelectedDays] = useState<number>(initialDays);
  const [runIteration, setRunIteration] = useState<number>(1);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [filterReason, setFilterReason] = useState<string>('all');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState<boolean>(true);
  const [activeDiagTab, setActiveDiagTab] = useState<'all' | 'pairlist' | 'seed' | 'missing_data'>('all');

  // Sync props if changed externally
  useEffect(() => {
    if (initialDays) setSelectedDays(initialDays);
  }, [initialDays]);

  useEffect(() => {
    if (initialIsPortfolio !== undefined) setIsPortfolioMode(initialIsPortfolio);
  }, [initialIsPortfolio]);

  const basePriceMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    TOP_30_PAIRS.forEach((p) => {
      map[p.symbol] = p.price;
    });
    return map;
  }, []);

  // Single-pair candles generator
  const candles = useMemo(() => {
    // Proportional candle density for single pair chart
    const count = selectedDays <= 10 ? 80 : selectedDays <= 30 ? 120 : selectedDays <= 60 ? 160 : selectedDays <= 90 ? 220 : selectedDays <= 365 ? 320 : 420;
    return generateCandles(
      selectedPair,
      count,
      basePriceMap[selectedPair] || 50000,
      selectedDays,
      runIteration
    );
  }, [selectedPair, selectedDays, runIteration, basePriceMap]);

  // Backtest execution: either Portfolio Mode (Top 30 Pairs) or Single Pair Mode
  const { summary, trades, pairStats } = useMemo(() => {
    if (isPortfolioMode) {
      const topPairs = TOP_30_PAIRS.map(p => p.symbol);
      const res = runPortfolioSimulation(
        selectedStrategy,
        topPairs,
        selectedDays,
        10000, // 10,000 USDT portfolio stake
        8,     // 8 concurrent trade slots
        runIteration
      );
      return { summary: res.summary, trades: res.trades, pairStats: res.pairStats };
    } else {
      const res = runSimulation(
        selectedStrategy,
        selectedPair,
        candles,
        1000,
        selectedDays >= 730 ? 'Past 2 Years' : selectedDays >= 365 ? 'Past 1 Year' : `Last ${selectedDays} Days`,
        4
      );
      return { summary: res.summary, trades: res.trades, pairStats: [] };
    }
  }, [isPortfolioMode, selectedStrategy, selectedPair, candles, selectedDays, runIteration]);

  const handleRerun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setRunIteration((prev) => prev + 1);
      setIsRunning(false);
    }, 400);
  };

  // Filtered trades
  const filteredTrades = useMemo(() => {
    if (filterReason === 'all') return trades;
    if (filterReason === 'wins') return trades.filter((t) => t.profit_ratio > 0);
    if (filterReason === 'losses') return trades.filter((t) => t.profit_ratio < 0);
    return trades.filter((t) => t.exit_reason === filterReason);
  }, [trades, filterReason]);

  // SVG Chart Geometry
  const chartHeight = 240;
  const chartWidth = 900;
  const paddingY = 25;

  const minPrice = useMemo(() => {
    return Math.min(...candles.map((c) => c.low)) * 0.998;
  }, [candles]);

  const maxPrice = useMemo(() => {
    return Math.max(...candles.map((c) => c.high)) * 1.002;
  }, [candles]);

  const priceRange = maxPrice - minPrice || 1;

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minPrice) / priceRange) * (chartHeight - paddingY * 2);
  };

  const getX = (idx: number) => {
    return (idx / (candles.length - 1)) * (chartWidth - 40) + 20;
  };

  // Trade markers
  const tradeMarkers = useMemo(() => {
    if (isPortfolioMode) return [];
    const markers: {
      type: 'buy' | 'sell';
      x: number;
      y: number;
      trade: BacktestTrade;
      price: number;
    }[] = [];

    trades.forEach((trade) => {
      const openIdx = candles.findIndex((c) => c.time === trade.open_date);
      if (openIdx !== -1) {
        markers.push({
          type: 'buy',
          x: getX(openIdx),
          y: getY(trade.open_rate),
          trade,
          price: trade.open_rate
        });
      }

      const closeIdx = candles.findIndex((c) => c.time === trade.close_date);
      if (closeIdx !== -1) {
        markers.push({
          type: 'sell',
          x: getX(closeIdx),
          y: getY(trade.close_rate),
          trade,
          price: trade.close_rate
        });
      }
    });

    return markers;
  }, [trades, candles, minPrice, maxPrice, isPortfolioMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Simulation Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white font-sans">
              Freqtrade Backtesting Engine
            </h1>
            {setSelectedStrategy ? (
              <select
                value={selectedStrategy.id}
                onChange={(e) => {
                  const s = DEFAULT_STRATEGIES.find((strat) => strat.id === e.target.value);
                  if (s) setSelectedStrategy(s);
                }}
                className="bg-slate-900 border border-slate-700 text-emerald-400 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <optgroup label="Official Reference">
                  {DEFAULT_STRATEGIES.filter((s) => s.source === 'official').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.timeframe})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Installed Community Strategies">
                  {DEFAULT_STRATEGIES.filter((s) => s.source === 'community').map((s) => (
                    <option key={s.id} value={s.id}>
                      ★ {s.name} — {s.author}
                    </option>
                  ))}
                </optgroup>
              </select>
            ) : (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {summary.strategy}
              </span>
            )}
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {isPortfolioMode ? 'Top 30 Pairs Portfolio' : selectedPair}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate entry/exit conditions against historical OHLCV data with slippage, trailing stop, stoploss, and minimal ROI.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Portfolio vs Single Pair Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setIsPortfolioMode(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                !isPortfolioMode ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Single Pair
            </button>
            <button
              onClick={() => setIsPortfolioMode(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                isPortfolioMode ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-emerald-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top 30 Portfolio</span>
            </button>
          </div>

          {/* Single Pair selector (if not portfolio mode) */}
          {!isPortfolioMode && (
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {TOP_30_PAIRS.slice(0, 10).map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.symbol}
                </option>
              ))}
            </select>
          )}

          {/* Lookback Days Selector (includes 90d and 2 Years) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
            {[
              { label: '10d', days: 10 },
              { label: '30d', days: 30 },
              { label: '90d', days: 90 },
              { label: '1 Year', days: 365 },
              { label: '2 Years (730d)', days: 730 }
            ].map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors ${
                  selectedDays === opt.days
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRerun}
            disabled={isRunning}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Calculating...' : `Rerun (${summary.total_trades} trades)`}</span>
          </button>
        </div>
      </div>

      {/* Answer & Diagnostic: Why Was 90 Days Always 12 Trades? */}
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 overflow-hidden">
        <div 
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="p-4 bg-amber-500/10 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white">
                  Why Was 90 Days Always 12 Trades? (Detailed Breakdown & Solution)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fixed: Now Generating {trades.length} Realistic Trades
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Understand the 3 root causes in algorithmic trading simulation and see how multi-pair 2-year data solves the trade density issue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
            <span>{showTroubleshooting ? 'Hide Analysis' : 'Show Analysis'}</span>
            {showTroubleshooting ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showTroubleshooting && (
          <div className="p-5 space-y-4 text-xs text-slate-300">
            {/* Quick Answer Banner */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>The 3 Real Reasons Why 90 Days Was Producing Exactly 12 Trades:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-cyan-300 block">1. Single Asset Bottleneck:</strong>
                  <p className="text-slate-400">
                    A strict strategy (RSI &lt; 30, EMA cross, Bollinger Band low) only triggers on a single coin like Bitcoin 1 to 2 times a month. Over 3 months (90 days), that naturally only yields 6 to 12 trades!
                  </p>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-amber-300 block">2. Fixed Seed & 200-Candle Clamp:</strong>
                  <p className="text-slate-400">
                    The previous mock generator clamped 90 days to just 200 candles with a deterministic seed <code className="font-mono text-slate-200">(42 + 90 * 17)</code>, locking identical trade triggers every run.
                  </p>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block">3. Missing 2-Year Downloaded Data:</strong>
                  <p className="text-slate-400">
                    In real Freqtrade CLI, running <code className="font-mono text-slate-200">--timerange</code> for 90d or 2 years without first downloading historical candles results in Freqtrade only evaluating the short cached data.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">
                Want hundreds or thousands of trades over 90 days or 2 years?
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setIsPortfolioMode(true);
                    setSelectedDays(90);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    isPortfolioMode && selectedDays === 90
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                  }`}
                >
                  Switch to 90-Day Top 30 Portfolio (~350 trades)
                </button>
                <button
                  onClick={() => {
                    setIsPortfolioMode(true);
                    setSelectedDays(730);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    isPortfolioMode && selectedDays === 730
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                  }`}
                >
                  Switch to 2-Year Top 30 Portfolio (2,400+ trades)
                </button>
                {onNavigateToData && (
                  <button
                    onClick={onNavigateToData}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Manage Raw Data</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset & CLI Command Context Ribbon */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <h3 className="text-xs font-semibold text-white">
              Backtesting Lookback: <strong className="text-emerald-400 font-mono">{summary.timerange}</strong>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {isPortfolioMode ? '30 Pairs Concurrency (VolumePairList)' : `${selectedPair} Isolated`}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Total Trades: <strong className="text-white font-bold">{summary.total_trades}</strong> · Trade frequency: {summary.trades_per_day} trades/day
          </span>
        </div>

        {/* CLI Command */}
        <div className="flex items-center justify-between gap-2 p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-300">
          <span className="truncate select-all">
            freqtrade backtesting --config user_data/config.json --strategy {selectedStrategy.name} --timerange {selectedDays >= 730 ? '20241106-20261106' : selectedDays >= 365 ? '20251106-20261106' : `20260806-20261106`}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`freqtrade backtesting --config user_data/config.json --strategy ${selectedStrategy.name} --timerange ${selectedDays >= 730 ? '20241106-20261106' : '20260806-20261106'}`);
              setCopiedCli(true);
              setTimeout(() => setCopiedCli(false), 2000);
            }}
            className="text-slate-400 hover:text-white p-1 rounded shrink-0"
            title="Copy CLI command"
          >
            {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Primary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Profit */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Profit</span>
            {summary.total_profit_pct >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
          <div className={`text-lg font-mono font-bold mt-1 tabular-nums ${
            summary.total_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {summary.total_profit_pct >= 0 ? '+' : ''}{summary.total_profit_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            {summary.total_profit_abs >= 0 ? '+' : ''}{summary.total_profit_abs.toFixed(2)} USDT
          </span>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Win Rate</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
            {summary.winrate.toFixed(1)}%
          </div>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            {summary.wins}W · {summary.losses}L · {summary.draws}D
          </span>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Profit Factor</span>
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-mono font-bold text-cyan-400 mt-1 tabular-nums">
            {summary.profit_factor.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Gross Win / Gross Loss</span>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Max Drawdown</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-lg font-mono font-bold text-red-400 mt-1 tabular-nums">
            -{summary.max_drawdown_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] font-mono text-slate-500 tabular-nums">
            -{summary.max_drawdown_abs.toFixed(2)} USDT
          </span>
        </div>

        {/* Sharpe & Sortino */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="text-xs text-slate-400">Sharpe / Sortino</div>
          <div className="text-lg font-mono font-bold text-white mt-1 tabular-nums">
            {summary.sharpe_ratio.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ {summary.sortino_ratio.toFixed(2)}</span>
          </div>
          <span className="text-[11px] text-slate-500 font-sans">Risk-adjusted return</span>
        </div>

        {/* Total Trades & Frequency */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Executions</span>
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1 tabular-nums">
            {summary.total_trades} trades
          </div>
          <span className="text-[11px] text-slate-500 font-sans">
            Avg duration: {summary.avg_duration}
          </span>
        </div>
      </div>

      {/* If Portfolio Mode: Render the Official Freqtrade Per-Pair Breakdown Table */}
      {isPortfolioMode && pairStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Top 30 Pairs Backtest Breakdown (VolumePairList)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Simulated across all 30 assets ({selectedDays >= 730 ? '2 Years' : `${selectedDays} Days`})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Pair</th>
                  <th className="py-2.5 px-4 text-right">Trades</th>
                  <th className="py-2.5 px-4 text-right">Wins</th>
                  <th className="py-2.5 px-4 text-right">Losses</th>
                  <th className="py-2.5 px-4 text-right">Win%</th>
                  <th className="py-2.5 px-4 text-right">Profit %</th>
                  <th className="py-2.5 px-4 text-right">Profit USDT</th>
                  <th className="py-2.5 px-4 text-right">Max DD %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {pairStats.map((stat) => (
                  <tr key={stat.pair} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-white flex items-center gap-1.5">
                      <span>{stat.pair}</span>
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-300 tabular-nums">{stat.totalTrades}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 tabular-nums">{stat.wins}</td>
                    <td className="py-2.5 px-4 text-right text-red-400 tabular-nums">{stat.losses}</td>
                    <td className="py-2.5 px-4 text-right font-bold tabular-nums text-white">
                      {stat.winrate.toFixed(1)}%
                    </td>
                    <td className={`py-2.5 px-4 text-right font-bold tabular-nums ${
                      stat.profitPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stat.profitPct >= 0 ? '+' : ''}{stat.profitPct.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-4 text-right tabular-nums ${
                      stat.profitAbs >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stat.profitAbs >= 0 ? '+' : ''}{stat.profitAbs.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-red-400 tabular-nums">
                      -{stat.maxDrawdownPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* If Single Pair Mode: Render Candlestick Chart Viewport */}
      {!isPortfolioMode && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-white">{selectedPair} · {selectedStrategy.timeframe} · {selectedDays} Days</span>
              <span className="text-slate-500 font-mono">
                Range: ${minPrice.toFixed(2)} — ${maxPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Entry (Buy)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span>Exit (Sell)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-cyan-400"></span>
                <span>EMA 9</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400"></span>
                <span>EMA 21</span>
              </div>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="p-4 bg-slate-950/70 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-[280px] select-none"
            >
              {/* Horizontal Grid lines */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                const y = chartHeight * ratio;
                const priceLevel = minPrice + (1 - ratio) * priceRange;
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="rgba(51, 65, 85, 0.4)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={chartWidth - 8}
                      y={y - 4}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      ${priceLevel.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Bollinger Band Shading */}
              <path
                d={
                  candles.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(c.bbUpper || c.close)}`).join(' ') +
                  ' ' +
                  [...candles]
                    .reverse()
                    .map((c, idx) => `L ${getX(candles.length - 1 - idx)} ${getY(c.bbLower || c.close)}`)
                    .join(' ') +
                  ' Z'
                }
                fill="rgba(56, 189, 248, 0.04)"
              />

              {/* EMA Fast (9) line */}
              <path
                d={candles
                  .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(c.emaFast || c.close)}`)
                  .join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.2"
                opacity="0.85"
              />

              {/* EMA Slow (21) line */}
              <path
                d={candles
                  .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(c.emaSlow || c.close)}`)
                  .join(' ')}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="1.2"
                opacity="0.85"
              />

              {/* Candlesticks */}
              {candles.map((c, idx) => {
                const x = getX(idx);
                const isBullish = c.close >= c.open;
                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);
                const topY = Math.min(yOpen, yClose);
                const candleHeight = Math.max(2, Math.abs(yClose - yOpen));
                const candleColor = isBullish ? '#34d399' : '#f87171';

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredCandle(c)}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  >
                    <line
                      x1={x}
                      y1={yHigh}
                      x2={x}
                      y2={yLow}
                      stroke={candleColor}
                      strokeWidth="1"
                    />
                    <rect
                      x={x - 3.5}
                      y={topY}
                      width={7}
                      height={candleHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Trade Markers */}
              {tradeMarkers.map((marker, idx) => (
                <g key={idx} transform={`translate(${marker.x}, ${marker.y})`}>
                  {marker.type === 'buy' ? (
                    <g className="cursor-pointer">
                      <polygon
                        points="0,-12 -6,-2 6,-2"
                        fill="#10b981"
                        stroke="#064e3b"
                        strokeWidth="1"
                      />
                      <circle cx="0" cy="0" r="2.5" fill="#10b981" />
                    </g>
                  ) : (
                    <g className="cursor-pointer">
                      <polygon
                        points="0,12 -6,2 6,2"
                        fill="#ef4444"
                        stroke="#7f1d1d"
                        strokeWidth="1"
                      />
                      <circle cx="0" cy="0" r="2.5" fill="#ef4444" />
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Hover Strip */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-4">
            {hoveredCandle ? (
              <div className="flex items-center gap-4 text-slate-300">
                <span className="text-white">Time: {hoveredCandle.time}</span>
                <span>O: ${hoveredCandle.open.toFixed(2)}</span>
                <span>H: ${hoveredCandle.high.toFixed(2)}</span>
                <span>L: ${hoveredCandle.low.toFixed(2)}</span>
                <span className={hoveredCandle.close >= hoveredCandle.open ? 'text-emerald-400' : 'text-red-400'}>
                  C: ${hoveredCandle.close.toFixed(2)}
                </span>
                <span>Vol: {hoveredCandle.volume}</span>
                <span className="text-purple-400">RSI: {hoveredCandle.rsi || 50}</span>
              </div>
            ) : (
              <span className="text-slate-500">Hover over any candle to inspect OHLCV and technical indicators.</span>
            )}
            <span className="text-slate-500">Simulated OHLCV</span>
          </div>
        </div>
      )}

      {/* Exit Reasons Distribution */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">ROI Targets Hit</span>
          <div className="text-lg font-mono font-bold text-emerald-400 mt-1 tabular-nums">
            {summary.exit_reasons.roi}
          </div>
          <span className="text-[11px] text-slate-500">Minimal ROI schedule exit</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Trailing Stop Exits</span>
          <div className="text-lg font-mono font-bold text-cyan-400 mt-1 tabular-nums">
            {summary.exit_reasons.trailing_stop_loss}
          </div>
          <span className="text-[11px] text-slate-500">Locked profit after peak</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Hard Stoploss Exits</span>
          <div className="text-lg font-mono font-bold text-red-400 mt-1 tabular-nums">
            {summary.exit_reasons.stop_loss}
          </div>
          <span className="text-[11px] text-slate-500">Capital preservation trigger</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Signal Exits</span>
          <div className="text-lg font-mono font-bold text-amber-400 mt-1 tabular-nums">
            {summary.exit_reasons.exit_signal}
          </div>
          <span className="text-[11px] text-slate-500">RSI & EMA indicator trigger</span>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Backtest Trade Ledger ({trades.length} Executions)</h3>
            <p className="text-xs text-slate-400">Detailed list of individual executions and exit rationales across the historical period.</p>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterReason('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReason === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({trades.length})
            </button>
            <button
              onClick={() => setFilterReason('wins')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReason === 'wins' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wins ({summary.wins})
            </button>
            <button
              onClick={() => setFilterReason('losses')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterReason === 'losses' ? 'bg-slate-800 text-red-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Losses ({summary.losses})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4">Open Date</th>
                <th className="py-3 px-4">Close Date</th>
                <th className="py-3 px-4 text-right">Open Rate</th>
                <th className="py-3 px-4 text-right">Close Rate</th>
                <th className="py-3 px-4 text-right">Profit %</th>
                <th className="py-3 px-4 text-right">Profit USDT</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Exit Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No trades match the current filter.
                  </td>
                </tr>
              ) : (
                filteredTrades.slice(0, 100).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-white font-semibold">{t.pair}</td>
                    <td className="py-3 px-4 text-slate-400">{t.open_date}</td>
                    <td className="py-3 px-4 text-slate-400">{t.close_date}</td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      ${t.open_rate >= 1 ? t.open_rate.toFixed(2) : t.open_rate.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      ${t.close_rate >= 1 ? t.close_rate.toFixed(2) : t.close_rate.toFixed(4)}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                      t.profit_ratio >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {t.profit_ratio >= 0 ? '+' : ''}{(t.profit_ratio * 100).toFixed(2)}%
                    </td>
                    <td className={`py-3 px-4 text-right tabular-nums ${
                      t.profit_abs >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {t.profit_abs >= 0 ? '+' : ''}{t.profit_abs.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.duration_min}m</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        t.exit_reason === 'roi'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : t.exit_reason === 'trailing_stop_loss'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : t.exit_reason === 'stop_loss'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {t.exit_reason}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredTrades.length > 100 && (
            <div className="p-3 text-center text-xs text-slate-500 bg-slate-950 border-t border-slate-800">
              Showing first 100 of {filteredTrades.length} executed trades.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
