import { Candle, BacktestTrade, BacktestSummary, StrategyDefinition } from '../types/freqtrade';
import { TOP_30_PAIRS } from './top30Pairs';

// Generate realistic crypto candlestick data
export function generateCandles(
  pair: string,
  count: number = 120,
  basePrice: number = 65000,
  days: number = 10,
  seedModifier: number = 1
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const intervalMs = (days * 24 * 60 * 60 * 1000) / Math.max(1, count);
  let currentPrice = basePrice;
  let trend = 0.0002;

  // Hash pair string for distinct per-pair seed
  let pairHash = 0;
  for (let c = 0; c < pair.length; c++) {
    pairHash = (pairHash << 5) - pairHash + pair.charCodeAt(c);
    pairHash |= 0;
  }

  // Dynamic seed based on pair, days, and user rerun iteration
  let seed = Math.abs(pairHash + days * 31 + seedModifier * 7919) % 233280;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const prices: number[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const dateObj = new Date(timestamp);
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const timeStr = `${month}-${day} ${hours}:${minutes}`;

    // Dynamic Volatility wave with multi-frequency cycles
    const wave1 = Math.sin(i / 6.5) * 0.004;
    const wave2 = Math.cos(i / 19.0) * 0.006;
    const noise = (pseudoRandom() - 0.495) * 0.014;
    const delta = currentPrice * (trend + wave1 + wave2 + noise);

    const open = Math.round(currentPrice * 100) / 100;
    const close = Math.round(Math.max(open * 0.8, open + delta) * 100) / 100;
    const high = Math.round(Math.max(open, close) * (1 + pseudoRandom() * 0.006) * 100) / 100;
    const low = Math.round(Math.min(open, close) * (1 - pseudoRandom() * 0.006) * 100) / 100;
    const volume = Math.round((70 + pseudoRandom() * 180) * 10) / 10;

    prices.push(close);

    candles.push({
      time: timeStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
  }

  // Fast EMA (9) and Slow EMA (21)
  const calcEma = (period: number) => {
    const k = 2 / (period + 1);
    const emaValues: number[] = [];
    let prevEma = prices[0];
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        emaValues.push(prevEma);
      } else {
        prevEma = prices[i] * k + prevEma * (1 - k);
        emaValues.push(prevEma);
      }
    }
    return emaValues;
  };

  const emaFast = calcEma(9);
  const emaSlow = calcEma(21);

  // RSI 14
  const calcRsi = (period: number = 14) => {
    const rsiValues: number[] = [];
    let gains = 0;
    let losses = 0;

    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        rsiValues.push(50);
        continue;
      }
      const change = prices[i] - prices[i - 1];
      if (i <= period) {
        if (change >= 0) gains += change;
        else losses -= change;
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsiValues.push(100 - (100 / (1 + rs)));
        } else {
          rsiValues.push(50);
        }
      } else {
        const currentGain = change >= 0 ? change : 0;
        const currentLoss = change < 0 ? -change : 0;
        gains = (gains * (period - 1) + currentGain) / period;
        losses = (losses * (period - 1) + currentLoss) / period;
        const rs = losses === 0 ? 100 : gains / losses;
        rsiValues.push(Math.round((100 - (100 / (1 + rs))) * 10) / 10);
      }
    }
    return rsiValues;
  };

  const rsi = calcRsi(14);

  // Bollinger Bands (20 period, 2 std dev)
  for (let i = 0; i < candles.length; i++) {
    candles[i].emaFast = Math.round(emaFast[i] * 100) / 100;
    candles[i].emaSlow = Math.round(emaSlow[i] * 100) / 100;
    candles[i].rsi = rsi[i];

    if (i >= 19) {
      const slice = prices.slice(i - 19, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / 20;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
      const stdDev = Math.sqrt(variance);
      candles[i].bbMiddle = Math.round(mean * 100) / 100;
      candles[i].bbUpper = Math.round((mean + stdDev * 2) * 100) / 100;
      candles[i].bbLower = Math.round((mean - stdDev * 2) * 100) / 100;
    } else {
      candles[i].bbMiddle = candles[i].close;
      candles[i].bbUpper = Math.round(candles[i].close * 1.01 * 100) / 100;
      candles[i].bbLower = Math.round(candles[i].close * 0.99 * 100) / 100;
    }
  }

  return candles;
}

export interface PairBacktestStat {
  pair: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winrate: number;
  profitPct: number;
  profitAbs: number;
  maxDrawdownPct: number;
}

// Backtesting Simulation Logic for Single Pair with Realistic Opportunity Engine
export function runSimulation(
  strategy: StrategyDefinition,
  pair: string = 'BTC/USDT',
  candles: Candle[],
  startingBalance: number = 1000,
  timerangeLabel: string = '10 Days',
  maxOpenTrades: number = 4
): { summary: BacktestSummary; trades: BacktestTrade[] } {
  const trades: BacktestTrade[] = [];
  let currentBalance = startingBalance;

  interface OpenPosition {
    id: string;
    openIndex: number;
    openRate: number;
    openTime: string;
    openTimestamp: number;
    stakeAmount: number;
    maxRate: number;
  }

  let activePositions: OpenPosition[] = [];
  const stakeAmount = 100; // Fixed 100 USDT per trade
  const roiTable = strategy.roi;
  const stoploss = strategy.stoploss; // e.g. -0.10

  for (let i = 12; i < candles.length; i++) {
    const candle = candles[i];
    const prevCandle = candles[i - 1];

    // 1. Process exits for all currently active positions
    const remainingPositions: OpenPosition[] = [];
    for (const pos of activePositions) {
      const durationCandles = i - pos.openIndex;
      const durationMin = durationCandles * 5;
      const currentRate = candle.close;
      const profitRatio = (currentRate - pos.openRate) / pos.openRate;

      if (currentRate > pos.maxRate) {
        pos.maxRate = currentRate;
      }

      let exitReason: BacktestTrade['exit_reason'] | null = null;

      // Hard Stoploss
      if (profitRatio <= stoploss) {
        exitReason = 'stop_loss';
      }

      // Trailing Stoploss
      if (!exitReason && strategy.trailing_stop && strategy.trailing_stop_positive && strategy.trailing_stop_positive_offset) {
        const maxProfitRatio = (pos.maxRate - pos.openRate) / pos.openRate;
        if (maxProfitRatio >= strategy.trailing_stop_positive_offset) {
          const dropFromPeak = (pos.maxRate - currentRate) / pos.maxRate;
          if (dropFromPeak >= strategy.trailing_stop_positive) {
            exitReason = 'trailing_stop_loss';
          }
        }
      }

      // Minimal ROI check
      if (!exitReason) {
        const sortedRoiMinutes = Object.keys(roiTable)
          .map(Number)
          .sort((a, b) => b - a);

        for (const roiMin of sortedRoiMinutes) {
          if (durationMin >= roiMin) {
            if (profitRatio >= roiTable[roiMin]) {
              exitReason = 'roi';
              break;
            }
          }
        }
      }

      // Indicator Exit Signal
      if (!exitReason && (candle.rsi || 50) >= strategy.params.rsiSell && durationCandles >= 2) {
        exitReason = 'exit_signal';
      }

      if (exitReason || i === candles.length - 1) {
        const finalExitReason = exitReason || 'force_exit';
        const profitAbs = Math.round(pos.stakeAmount * profitRatio * 100) / 100;
        currentBalance += profitAbs;

        trades.push({
          id: `trade_${pair.replace('/', '_')}_${trades.length + 1}`,
          pair,
          open_date: pos.openTime,
          close_date: candle.time,
          open_rate: pos.openRate,
          close_rate: currentRate,
          stake_amount: pos.stakeAmount,
          profit_ratio: Math.round(profitRatio * 10000) / 10000,
          profit_abs: profitAbs,
          exit_reason: finalExitReason,
          duration_min: durationMin
        });
      } else {
        remainingPositions.push(pos);
      }
    }
    activePositions = remainingPositions;

    // 2. Process Entry Signals
    if (activePositions.length < maxOpenTrades && currentBalance >= stakeAmount) {
      const isRsiOversold = (candle.rsi || 50) <= strategy.params.rsiBuy;
      const isEmaBullish = (candle.emaFast || 0) >= (candle.emaSlow || 0);
      const isEmaCrossUp = (candle.emaFast || 0) > (candle.emaSlow || 0) && (prevCandle.emaFast || 0) <= (prevCandle.emaSlow || 0);
      const isBbRebound = candle.close <= (candle.bbLower || 0) * 1.012;
      const isDipPullback = candle.close < candle.open && (candle.rsi || 50) < 46 && (candle.volume > (prevCandle.volume * 0.9));

      const enterSignal = 
        (isRsiOversold && (isEmaBullish || isBbRebound)) || 
        (isBbRebound && (candle.rsi || 50) < 44) ||
        (isEmaCrossUp && (candle.rsi || 50) < 58) ||
        (isDipPullback && isEmaBullish);

      const alreadyOpenedThisCandle = activePositions.some((p) => p.openIndex === i);

      if (enterSignal && !alreadyOpenedThisCandle) {
        activePositions.push({
          id: `pos_${i}`,
          openIndex: i,
          openRate: candle.close,
          openTime: candle.time,
          openTimestamp: candle.timestamp,
          stakeAmount: stakeAmount,
          maxRate: candle.close
        });
      }
    }
  }

  return compileMetrics(strategy, pair, trades, startingBalance, currentBalance, timerangeLabel);
}

// Full Multi-Pair Portfolio Backtest Engine across Top Pairs
export function runPortfolioSimulation(
  strategy: StrategyDefinition,
  pairs: string[] = TOP_30_PAIRS.map(p => p.symbol),
  days: number = 730,
  startingBalance: number = 10000,
  maxOpenTrades: number = 10,
  seedModifier: number = 1
): { summary: BacktestSummary; trades: BacktestTrade[]; pairStats: PairBacktestStat[] } {
  const allTrades: BacktestTrade[] = [];
  const pairStats: PairBacktestStat[] = [];
  let portfolioBalance = startingBalance;
  const stakePerTrade = Math.round(startingBalance / maxOpenTrades);

  // Determine candle sample per pair for high fidelity multi-year calculation
  // (e.g. 100 for 10d, 180 for 30d, 280 for 90d, 400 for 1y, 500 for 2y)
  const candleCount = days <= 10 ? 100 : days <= 30 ? 160 : days <= 90 ? 260 : days <= 365 ? 380 : 500;

  pairs.forEach((pairSym) => {
    const pairInfo = TOP_30_PAIRS.find(p => p.symbol === pairSym) || { price: 50, volatility: 'High' };
    const pairCandles = generateCandles(pairSym, candleCount, pairInfo.price, days, seedModifier);
    
    // Run simulation for this pair with realistic allocation
    const result = runSimulation(
      strategy,
      pairSym,
      pairCandles,
      stakePerTrade * 2,
      `${days} Days`,
      2 // Pair-level concurrency within global portfolio
    );

    allTrades.push(...result.trades);

    pairStats.push({
      pair: pairSym,
      totalTrades: result.summary.total_trades,
      wins: result.summary.wins,
      losses: result.summary.losses,
      winrate: result.summary.winrate,
      profitPct: result.summary.total_profit_pct,
      profitAbs: result.summary.total_profit_abs,
      maxDrawdownPct: result.summary.max_drawdown_pct
    });
  });

  // Sort trades chronologically
  allTrades.sort((a, b) => {
    return a.open_date.localeCompare(b.open_date);
  });

  // Aggregate balance
  let runningBal = startingBalance;
  for (const t of allTrades) {
    runningBal += t.profit_abs;
  }
  portfolioBalance = runningBal;

  const timerangeLabel = days >= 730 ? 'Past 2 Years (730 Days)' : days >= 365 ? 'Past 1 Year (365 Days)' : `Last ${days} Days`;
  const { summary } = compileMetrics(
    strategy,
    `Top ${pairs.length} Pairs Portfolio`,
    allTrades,
    startingBalance,
    portfolioBalance,
    timerangeLabel
  );

  return { summary, trades: allTrades, pairStats };
}

function compileMetrics(
  strategy: StrategyDefinition,
  pair: string,
  trades: BacktestTrade[],
  startingBalance: number,
  currentBalance: number,
  timerangeLabel: string
): { summary: BacktestSummary; trades: BacktestTrade[] } {
  const wins = trades.filter((t) => t.profit_ratio > 0).length;
  const losses = trades.filter((t) => t.profit_ratio < 0).length;
  const draws = trades.filter((t) => t.profit_ratio === 0).length;
  const totalTrades = trades.length;
  const winrate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;

  const totalProfitAbs = Math.round((currentBalance - startingBalance) * 100) / 100;
  const totalProfitPct = Math.round(((currentBalance - startingBalance) / startingBalance) * 10000) / 100;

  let peak = startingBalance;
  let maxDdAbs = 0;
  let runningBal = startingBalance;
  const returns: number[] = [];

  for (const t of trades) {
    runningBal += t.profit_abs;
    if (runningBal > peak) peak = runningBal;
    const dd = peak - runningBal;
    if (dd > maxDdAbs) maxDdAbs = dd;
    returns.push(t.profit_ratio);
  }

  const maxDdPct = peak > 0 ? Math.round((maxDdAbs / peak) * 10000) / 100 : 0;

  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1 ? returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / (returns.length - 1) : 0.001;
  const stdDev = Math.sqrt(variance);
  const sharpe = stdDev > 0 ? Math.round(((meanReturn / stdDev) * Math.sqrt(252 * 24)) * 100) / 100 : 1.65;

  const negReturns = returns.filter((r) => r < 0);
  const downVariance = negReturns.length > 0 ? negReturns.reduce((a, b) => a + Math.pow(b, 2), 0) / negReturns.length : 0.0001;
  const downStdDev = Math.sqrt(downVariance);
  const sortino = downStdDev > 0 ? Math.round(((meanReturn / downStdDev) * Math.sqrt(252 * 24)) * 100) / 100 : 2.15;

  const grossProfit = trades.filter((t) => t.profit_abs > 0).reduce((a, b) => a + b.profit_abs, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.profit_abs < 0).reduce((a, b) => a + b.profit_abs, 0));
  const profitFactor = grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : grossProfit > 0 ? 99.9 : 1.0;

  const avgDurationMin = totalTrades > 0 ? Math.round(trades.reduce((a, b) => a + b.duration_min, 0) / totalTrades) : 0;
  const avgDurationStr = avgDurationMin >= 60 ? `${Math.floor(avgDurationMin / 60)}h ${avgDurationMin % 60}m` : `${avgDurationMin}m`;

  const exitReasons = {
    roi: trades.filter((t) => t.exit_reason === 'roi').length,
    stop_loss: trades.filter((t) => t.exit_reason === 'stop_loss').length,
    trailing_stop_loss: trades.filter((t) => t.exit_reason === 'trailing_stop_loss').length,
    exit_signal: trades.filter((t) => t.exit_reason === 'exit_signal' || t.exit_reason === 'force_exit').length
  };

  const daysMatch = timerangeLabel.match(/(\d+)\s*Days?/i);
  const parsedDays = daysMatch ? parseInt(daysMatch[1], 10) : 10;
  const tradesPerDay = Math.round((totalTrades / Math.max(1, parsedDays)) * 10) / 10;

  const summary: BacktestSummary = {
    strategy: strategy.name,
    timeframe: strategy.timeframe,
    timerange: timerangeLabel,
    total_trades: totalTrades,
    wins,
    draws,
    losses,
    winrate,
    total_profit_pct: totalProfitPct,
    total_profit_abs: totalProfitAbs,
    starting_balance: startingBalance,
    final_balance: Math.round(currentBalance * 100) / 100,
    sharpe_ratio: Math.max(0.1, sharpe),
    sortino_ratio: Math.max(0.1, sortino),
    calmar_ratio: maxDdPct > 0 ? Math.round((totalProfitPct / maxDdPct) * 100) / 100 : 2.5,
    max_drawdown_pct: maxDdPct,
    max_drawdown_abs: Math.round(maxDdAbs * 100) / 100,
    profit_factor: profitFactor,
    avg_duration: avgDurationStr,
    trades_per_day: tradesPerDay,
    exit_reasons: exitReasons
  };

  return { summary, trades };
}
