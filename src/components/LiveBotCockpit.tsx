import React, { useState, useEffect } from 'react';
import { BotState, LiveBotPosition, BotLogEntry, ClosedLiveTrade } from '../types/freqtrade';
import { 
  Play, Pause, Power, AlertCircle, TrendingUp, TrendingDown, DollarSign, 
  Activity, Zap, Check, Shield, PlusCircle, Clock, History, AlertTriangle, 
  Server, ArrowUpRight, CheckCircle2, RefreshCw, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';

export const LiveBotCockpit: React.FC = () => {
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [showFaq, setShowFaq] = useState<boolean>(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyPair, setBuyPair] = useState('SOL/USDT:USDT');
  const [autoTradeLoop, setAutoTradeLoop] = useState<boolean>(true);

  const [botState, setBotState] = useState<BotState>({
    status: 'running',
    dry_run: true,
    strategy: 'NostalgiaForInfinityX',
    exchange: 'hyperliquid',
    timeframe: '5m',
    stake_currency: 'USDT',
    balance: 1420.50,
    open_trades_count: 2,
    max_open_trades: 4,
    daily_profit_pct: 2.14,
    daily_profit_abs: 29.80,
    total_profit_abs: 145.20
  });

  // Active Positions initialized with real epoch timestamps
  const [positions, setPositions] = useState<LiveBotPosition[]>([
    {
      id: 'trade_101',
      pair: 'BTC/USDT:USDT',
      open_rate: 67450.00,
      current_rate: 68120.00,
      stake_amount: 250.00,
      amount: 0.00370645,
      unrealized_profit_pct: 0.99,
      unrealized_profit_abs: 2.48,
      open_time: '24m ago',
      open_timestamp: Date.now() - (24 * 60 + 15) * 1000,
      stoploss_price: 60705.00,
      target_roi_price: 70148.00
    },
    {
      id: 'trade_102',
      pair: 'HYPE/USDT:USDT',
      open_rate: 28.50,
      current_rate: 29.40,
      stake_amount: 250.00,
      amount: 8.77192982,
      unrealized_profit_pct: 3.16,
      unrealized_profit_abs: 7.90,
      open_time: '14m ago',
      open_timestamp: Date.now() - (14 * 60 + 40) * 1000,
      stoploss_price: 25.65,
      target_roi_price: 30.21
    }
  ]);

  // Closed Trades History Ledger
  const [closedTrades, setClosedTrades] = useState<ClosedLiveTrade[]>([
    {
      id: 'closed_1',
      pair: 'SOL/USDT:USDT',
      open_rate: 182.20,
      close_rate: 189.48,
      stake_amount: 250.00,
      profit_pct: 4.00,
      profit_abs: 10.00,
      open_timestamp: Date.now() - 110 * 60 * 1000,
      close_timestamp: Date.now() - 32 * 60 * 1000,
      duration_str: '1h 18m',
      exit_reason: 'roi'
    },
    {
      id: 'closed_2',
      pair: 'ETH/USDT:USDT',
      open_rate: 3410.00,
      close_rate: 3482.00,
      stake_amount: 250.00,
      profit_pct: 2.11,
      profit_abs: 5.28,
      open_timestamp: Date.now() - 210 * 60 * 1000,
      close_timestamp: Date.now() - 95 * 60 * 1000,
      duration_str: '1h 55m',
      exit_reason: 'trailing_stop_loss'
    }
  ]);

  const [logs, setLogs] = useState<BotLogEntry[]>([
    {
      id: 'log_1',
      timestamp: '22:14:02',
      level: 'INFO',
      message: 'Freqtrade worker process running (strategy: NostalgiaForInfinityX, dry-run: true, exchange: Hyperliquid Futures)'
    },
    {
      id: 'log_2',
      timestamp: '22:14:05',
      level: 'BUY',
      message: 'LONG order executed on Hyperliquid for BTC/USDT:USDT at 67,450.00 USDT (cross margin)'
    },
    {
      id: 'log_3',
      timestamp: '22:15:10',
      level: 'BUY',
      message: 'LONG order executed on Hyperliquid for HYPE/USDT:USDT at 28.50 USDT (cross margin)'
    },
    {
      id: 'log_4',
      timestamp: '22:16:00',
      level: 'INFO',
      message: 'Housekeeping: Checked open trades. Real-time duration timer active.'
    }
  ]);

  // Real-time second clock for dynamic held duration
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Format dynamic elapsed duration into readable mm:ss or hh:mm:ss
  const formatLiveDuration = (startMs: number, currentMs: number): string => {
    const diffSec = Math.max(0, Math.floor((currentMs - startMs) / 1000));
    const hrs = Math.floor(diffSec / 3600);
    const mins = Math.floor((diffSec % 3600) / 60);
    const secs = diffSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs.toString().padStart(2, '0')}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Live order book price fluctuations and automated Take-Profit / Stoploss triggers
  useEffect(() => {
    if (botState.status !== 'running') return;

    let tickCount = 0;

    const interval = setInterval(() => {
      tickCount += 1;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setPositions((prev) => {
        const remaining: LiveBotPosition[] = [];

        for (const pos of prev) {
          // Dynamic price oscillation
          const delta = (Math.random() - 0.48) * 0.0035;
          const newCurrent = Math.round(pos.current_rate * (1 + delta) * 100) / 100;
          const profitPct = Math.round(((newCurrent - pos.open_rate) / pos.open_rate) * 10000) / 100;
          const profitAbs = Math.round(pos.stake_amount * (profitPct / 100) * 100) / 100;

          // Check Automated Take-Profit (ROI) Hit
          if (newCurrent >= pos.target_roi_price) {
            const durationStr = formatLiveDuration(pos.open_timestamp, Date.now());
            setClosedTrades((closed) => [
              {
                id: `closed_${Date.now()}`,
                pair: pos.pair,
                open_rate: pos.open_rate,
                close_rate: newCurrent,
                stake_amount: pos.stake_amount,
                profit_pct: profitPct,
                profit_abs: profitAbs,
                open_timestamp: pos.open_timestamp,
                close_timestamp: Date.now(),
                duration_str: durationStr,
                exit_reason: 'roi'
              },
              ...closed
            ]);

            setBotState((state) => ({
              ...state,
              balance: Math.round((state.balance + profitAbs) * 100) / 100,
              open_trades_count: Math.max(0, state.open_trades_count - 1),
              daily_profit_abs: Math.round((state.daily_profit_abs + profitAbs) * 100) / 100,
              total_profit_abs: Math.round((state.total_profit_abs + profitAbs) * 100) / 100
            }));

            setLogs((l) => [
              {
                id: `log_${Date.now()}`,
                timestamp: nowStr,
                level: 'SELL',
                message: `TARGET ROI HIT: Took profit on ${pos.pair} at ${newCurrent} USDT (+${profitPct}% | +${profitAbs} USDT in ${durationStr})`
              },
              ...l
            ]);
            continue; // Trade closed
          }

          // Check Automated Stoploss Hit
          if (newCurrent <= pos.stoploss_price) {
            const durationStr = formatLiveDuration(pos.open_timestamp, Date.now());
            setClosedTrades((closed) => [
              {
                id: `closed_${Date.now()}`,
                pair: pos.pair,
                open_rate: pos.open_rate,
                close_rate: newCurrent,
                stake_amount: pos.stake_amount,
                profit_pct: profitPct,
                profit_abs: profitAbs,
                open_timestamp: pos.open_timestamp,
                close_timestamp: Date.now(),
                duration_str: durationStr,
                exit_reason: 'stop_loss'
              },
              ...closed
            ]);

            setBotState((state) => ({
              ...state,
              balance: Math.round((state.balance + profitAbs) * 100) / 100,
              open_trades_count: Math.max(0, state.open_trades_count - 1),
              daily_profit_abs: Math.round((state.daily_profit_abs + profitAbs) * 100) / 100,
              total_profit_abs: Math.round((state.total_profit_abs + profitAbs) * 100) / 100
            }));

            setLogs((l) => [
              {
                id: `log_${Date.now()}`,
                timestamp: nowStr,
                level: 'SELL',
                message: `STOPLOSS TRIGGERED: Exited ${pos.pair} at ${newCurrent} USDT (${profitPct}% | ${profitAbs} USDT in ${durationStr})`
              },
              ...l
            ]);
            continue; // Trade closed
          }

          remaining.push({
            ...pos,
            current_rate: newCurrent,
            unrealized_profit_pct: profitPct,
            unrealized_profit_abs: profitAbs
          });
        }

        // Automated Strategy Signal Scanner: if slots available, occasionally trigger a new buy signal
        if (autoTradeLoop && remaining.length < botState.max_open_trades && tickCount % 12 === 0) {
          const candidatePairs = [
            { pair: 'SOL/USDT:USDT', rate: 188.40 },
            { pair: 'ETH/USDT:USDT', rate: 3462.50 },
            { pair: 'SUI/USDT:USDT', rate: 3.24 },
            { pair: 'AVAX/USDT:USDT', rate: 31.80 }
          ];
          const unheld = candidatePairs.filter((c) => !remaining.some((r) => r.pair === c.pair));
          if (unheld.length > 0) {
            const nextCandidate = unheld[Math.floor(Math.random() * unheld.length)];
            const stake = 250.00;
            const newPos: LiveBotPosition = {
              id: `trade_${Date.now()}`,
              pair: nextCandidate.pair,
              open_rate: nextCandidate.rate,
              current_rate: nextCandidate.rate,
              stake_amount: stake,
              amount: Math.round((stake / nextCandidate.rate) * 100000) / 100000,
              unrealized_profit_pct: 0,
              unrealized_profit_abs: 0,
              open_time: 'Just now',
              open_timestamp: Date.now(),
              stoploss_price: Math.round(nextCandidate.rate * 0.90 * 100) / 100,
              target_roi_price: Math.round(nextCandidate.rate * 1.04 * 100) / 100
            };
            remaining.push(newPos);

            setBotState((s) => ({ ...s, open_trades_count: remaining.length }));
            setLogs((l) => [
              {
                id: `log_${Date.now()}`,
                timestamp: nowStr,
                level: 'BUY',
                message: `ENTRY SIGNAL: Strategy opened LONG on ${nextCandidate.pair} at ${nextCandidate.rate} USDT (stake: 250 USDT)`
              },
              ...l
            ]);
          }
        }

        return remaining;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [botState.status, autoTradeLoop, botState.max_open_trades]);

  const handleForceExit = (id: string, pair: string) => {
    const exitedTrade = positions.find((p) => p.id === id);
    if (!exitedTrade) return;

    const profit = exitedTrade.unrealized_profit_abs;
    const durationStr = formatLiveDuration(exitedTrade.open_timestamp, Date.now());

    setPositions((prev) => prev.filter((p) => p.id !== id));
    setClosedTrades((closed) => [
      {
        id: `closed_${Date.now()}`,
        pair: exitedTrade.pair,
        open_rate: exitedTrade.open_rate,
        close_rate: exitedTrade.current_rate,
        stake_amount: exitedTrade.stake_amount,
        profit_pct: exitedTrade.unrealized_profit_pct,
        profit_abs: profit,
        open_timestamp: exitedTrade.open_timestamp,
        close_timestamp: Date.now(),
        duration_str: durationStr,
        exit_reason: 'force_exit'
      },
      ...closed
    ]);

    setBotState((prev) => ({
      ...prev,
      balance: Math.round((prev.balance + profit) * 100) / 100,
      open_trades_count: Math.max(0, prev.open_trades_count - 1),
      total_profit_abs: Math.round((prev.total_profit_abs + profit) * 100) / 100
    }));

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: now,
        level: 'SELL',
        message: `MANUAL FORCE EXIT on ${pair} at ${exitedTrade.current_rate} USDT (${profit >= 0 ? '+' : ''}${profit} USDT, held ${durationStr})`
      },
      ...prev
    ]);
  };

  const handleManualBuy = () => {
    const prices: Record<string, number> = {
      'SOL/USDT:USDT': 188.50,
      'BNB/USDT:USDT': 590.20,
      'AVAX/USDT:USDT': 32.40,
      'ETH/USDT:USDT': 3450.00
    };
    const rate = prices[buyPair] || 150.00;
    const stake = 250.00;

    const newPosition: LiveBotPosition = {
      id: `trade_${Date.now()}`,
      pair: buyPair,
      open_rate: rate,
      current_rate: rate,
      stake_amount: stake,
      amount: Math.round((stake / rate) * 100000) / 100000,
      unrealized_profit_pct: 0,
      unrealized_profit_abs: 0,
      open_time: 'Just now',
      open_timestamp: Date.now(),
      stoploss_price: Math.round(rate * 0.90 * 100) / 100,
      target_roi_price: Math.round(rate * 1.04 * 100) / 100
    };

    setPositions([newPosition, ...positions]);
    setBotState((prev) => ({
      ...prev,
      open_trades_count: prev.open_trades_count + 1
    }));
    setShowBuyModal(false);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: now,
        level: 'BUY',
        message: `FORCE BUY manually triggered for ${buyPair} at ${rate} USDT (stake: ${stake} USDT)`
      },
      ...prev
    ]);
  };

  const togglePauseBot = () => {
    const nextStatus = botState.status === 'running' ? 'paused' : 'running';
    setBotState({ ...botState, status: nextStatus });

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: now,
        level: 'INFO',
        message: `Bot state transitioned to: ${nextStatus.toUpperCase()}`
      },
      ...prev
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white font-sans">
              Live Bot Simulator & FreqUI Cockpit
            </h1>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              botState.status === 'running'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {botState.status.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              DRY-RUN (SIMULATED TELEMETRY)
            </span>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
              Strategy: {botState.strategy}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates real-time FreqUI trade monitoring, dynamic tick updates, auto ROI exit, stoploss triggering, and continuous trade duration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBuyModal(true)}
            disabled={positions.length >= botState.max_open_trades}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 rounded-lg transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Force Buy</span>
          </button>

          <button
            onClick={togglePauseBot}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              botState.status === 'running'
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold'
            }`}
          >
            {botState.status === 'running' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Bot</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Bot</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Critical Reality Check Banner: Is it really live? Why was held duration static? */}
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/30 overflow-hidden">
        <div 
          onClick={() => setShowFaq(!showFaq)}
          className="p-4 bg-amber-500/10 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-amber-500/15 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white">
                  Why was Held Duration Static & Is This Really Live? (Honest Architecture Breakdown)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fixed: Real-Time Timer Ticking Active
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Understand how browser-based simulation operates versus real continuous 24/7 Python Freqtrade daemons.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs shrink-0">
            <span>{showFaq ? 'Collapse Details' : 'Expand Details'}</span>
            {showFaq ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showFaq && (
          <div className="p-4 sm:p-5 space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 leading-relaxed">
              {/* Question 1: Why held duration was static */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>1. Why Held Duration Was the Same (And What Was Fixed)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  You caught an important detail! In the prototype, the open time was previously loaded as static text (<code className="text-cyan-300 font-mono">'24m ago'</code>) instead of calculating from active epoch timestamps.
                </p>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  <strong>Fix Applied:</strong> We have now connected each position to a real timestamp (<code className="text-emerald-300 font-mono">Date.now()</code>) with a 1-second active interval. If you look at the <strong>Held Duration</strong> column below, you will see it ticking live every single second (<code className="text-emerald-400 font-mono">24m 15s → 24m 16s...</code>).
                </p>
              </div>

              {/* Question 2: Is it really live? */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <Server className="w-4 h-4 shrink-0" />
                  <span>2. Is it Really Live? (Web Simulator vs Real Python Bot)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  <strong>No, this browser tab is NOT directly placing live orders with real money on Hyperliquid or Binance.</strong>
                </p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Web browsers in an iframe cannot run continuous Python daemons or hold financial exchange WebSockets when your laptop sleeps or your tab is closed. 
                  This tab acts as an <strong>interactive FreqUI simulator</strong> that mirrors live trading state, dynamic profit calculations, and auto-exits.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
                  <strong className="text-white block">How Real Live Trading Operates:</strong>
                  Real Freqtrade runs as a Python background daemon on your local computer or VPS:
                  <code className="block font-mono text-emerald-400 mt-1 select-all">
                    docker compose up -d    # Runs 24/7 in background
                  </code>
                  It connects directly to Hyperliquid via API keys and exposes FreqUI on <code className="text-cyan-300 font-mono">http://localhost:8080</code>.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">Wallet Balance</span>
          <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
            ${botState.balance.toFixed(2)}
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Stake: {botState.stake_currency} · Hyperliquid Dry-run
          </span>
        </div>

        {/* Daily Profit */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">Daily P&L</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
            +{botState.daily_profit_pct.toFixed(2)}%
          </div>
          <span className="text-[11px] font-mono text-emerald-400/80">
            +${botState.daily_profit_abs.toFixed(2)} today
          </span>
        </div>

        {/* Total Realized Profit */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">Cumulative Realized P&L</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
            +${botState.total_profit_abs.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-500">{closedTrades.length} trades settled</span>
        </div>

        {/* Open Trades Slot */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-xs text-slate-400">Open Trades Capacity</span>
          <div className="text-xl font-mono font-bold text-white mt-1 tabular-nums">
            {positions.length} / {botState.max_open_trades}
          </div>
          <span className="text-[11px] text-slate-500">Max concurrent trades limit</span>
        </div>
      </div>

      {/* Active Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Active Open Positions</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-400">Currently held crypto positions under management.</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Duration: <span className="text-emerald-400 font-bold">Live Ticking</span>
            </span>
            <span>Tick rate: 2.5s</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4 text-right">Entry Price</th>
                <th className="py-3 px-4 text-right">Current Price</th>
                <th className="py-3 px-4 text-right">Unrealized P&L</th>
                <th className="py-3 px-4 text-right">Stoploss Level</th>
                <th className="py-3 px-4 text-right">Target ROI Level</th>
                <th className="py-3 px-4">Held Duration (Live)</th>
                <th className="py-3 px-4 text-right">Emergency Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No active positions. Automated signal scanner is searching pairs for entry conditions...
                  </td>
                </tr>
              ) : (
                positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-white font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>{pos.pair}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-slate-300">
                      ${pos.open_rate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-white font-bold">
                      ${pos.current_rate.toFixed(2)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold tabular-nums ${
                      pos.unrealized_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      <div>
                        {pos.unrealized_profit_pct >= 0 ? '+' : ''}{pos.unrealized_profit_pct.toFixed(2)}%
                      </div>
                      <div className="text-[10px] opacity-80">
                        {pos.unrealized_profit_abs >= 0 ? '+' : ''}{pos.unrealized_profit_abs.toFixed(2)} USDT
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-red-400">
                      ${pos.stoploss_price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums text-cyan-400">
                      ${pos.target_roi_price.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-mono font-semibold tabular-nums">
                      {formatLiveDuration(pos.open_timestamp, nowTime)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleForceExit(pos.id, pos.pair)}
                        className="px-2.5 py-1 text-[11px] font-sans font-medium text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 rounded transition-colors"
                      >
                        Force Exit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closed Trades / Realized P&L Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Recently Settled Trades (Realized P&L)</h3>
              <p className="text-xs text-slate-400">Trades that exited via Take-Profit ROI, Trailing Stop, Stoploss, or Force Exit.</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {closedTrades.length} settled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Pair</th>
                <th className="py-3 px-4 text-right">Entry Rate</th>
                <th className="py-3 px-4 text-right">Exit Rate</th>
                <th className="py-3 px-4 text-right">Realized P&L %</th>
                <th className="py-3 px-4 text-right">Profit USDT</th>
                <th className="py-3 px-4">Total Held Duration</th>
                <th className="py-3 px-4">Exit Trigger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {closedTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-white font-semibold">{t.pair}</td>
                  <td className="py-3 px-4 text-right text-slate-400">${t.open_rate.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-200 font-medium">${t.close_rate.toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                    t.profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {t.profit_pct >= 0 ? '+' : ''}{t.profit_pct.toFixed(2)}%
                  </td>
                  <td className={`py-3 px-4 text-right font-bold tabular-nums ${
                    t.profit_abs >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {t.profit_abs >= 0 ? '+' : ''}${t.profit_abs.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{t.duration_str}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      t.exit_reason === 'roi'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : t.exit_reason === 'trailing_stop_loss'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : t.exit_reason === 'stop_loss'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {t.exit_reason.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bot Stdout / Telemetry Log Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-semibold text-slate-300">
              Freqtrade Worker Log Stream (user_data/logs/freqtrade.log)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">Live feed</span>
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs space-y-1.5 max-h-48 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 leading-relaxed">
              <span className="text-slate-600 select-none text-[11px]">{log.timestamp}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                log.level === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : log.level === 'SELL'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {log.level}
              </span>
              <span className="text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Force Buy Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Manual Force Buy</h3>
            <p className="text-xs text-slate-400">
              Immediately dispatch a buy order bypassing entry trend indicators. Used for test entries or discretionary setups.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Select Trading Pair</label>
              <select
                value={buyPair}
                onChange={(e) => setBuyPair(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono"
              >
                <option value="SOL/USDT:USDT">SOL/USDT (~$188.50)</option>
                <option value="ETH/USDT:USDT">ETH/USDT (~$3450.00)</option>
                <option value="BNB/USDT:USDT">BNB/USDT (~$590.20)</option>
                <option value="AVAX/USDT:USDT">AVAX/USDT (~$32.40)</option>
              </select>
            </div>

            <div className="space-y-1 text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span>Stake Amount:</span>
                <span className="text-white font-mono">250.00 USDT</span>
              </div>
              <div className="flex justify-between">
                <span>Initial Stoploss:</span>
                <span className="text-red-400 font-mono">-10.0%</span>
              </div>
              <div className="flex justify-between">
                <span>Target ROI Take-Profit:</span>
                <span className="text-emerald-400 font-mono">+4.0%</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowBuyModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleManualBuy}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                Confirm Force Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
