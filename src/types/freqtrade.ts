export type BranchType = 'stable' | 'develop';

export type ActiveTab = 'setup' | 'strategy' | 'data' | 'backtest' | 'live' | 'config' | 'terminal' | 'cheatsheet';

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  stoploss: number;
  roi: { [key: number]: number };
  trailing_stop: boolean;
  trailing_stop_positive?: number;
  trailing_stop_positive_offset?: number;
  code: string;
  source?: 'official' | 'community';
  author?: string;
  tags?: string[];
  params: {
    rsiBuy: number;
    rsiSell: number;
    fastEma: number;
    slowEma: number;
    bbStdDev: number;
  };
}

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  emaFast?: number;
  emaSlow?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
}

export interface BacktestTrade {
  id: string;
  pair: string;
  open_date: string;
  close_date: string;
  open_rate: number;
  close_rate: number;
  stake_amount: number;
  profit_ratio: number;
  profit_abs: number;
  exit_reason: 'roi' | 'stop_loss' | 'trailing_stop_loss' | 'exit_signal' | 'force_exit';
  duration_min: number;
}

export interface BacktestSummary {
  strategy: string;
  timeframe: string;
  timerange: string;
  total_trades: number;
  wins: number;
  draws: number;
  losses: number;
  winrate: number;
  total_profit_pct: number;
  total_profit_abs: number;
  starting_balance: number;
  final_balance: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown_pct: number;
  max_drawdown_abs: number;
  profit_factor: number;
  avg_duration: string;
  trades_per_day: number;
  exit_reasons: {
    roi: number;
    stop_loss: number;
    trailing_stop_loss: number;
    exit_signal: number;
  };
}

export interface LiveBotPosition {
  id: string;
  pair: string;
  open_rate: number;
  current_rate: number;
  stake_amount: number;
  amount: number;
  unrealized_profit_pct: number;
  unrealized_profit_abs: number;
  open_time: string;
  open_timestamp: number;
  stoploss_price: number;
  target_roi_price: number;
}

export interface ClosedLiveTrade {
  id: string;
  pair: string;
  open_rate: number;
  close_rate: number;
  stake_amount: number;
  profit_pct: number;
  profit_abs: number;
  open_timestamp: number;
  close_timestamp: number;
  duration_str: string;
  exit_reason: 'roi' | 'stop_loss' | 'trailing_stop_loss' | 'force_exit';
}

export interface BotState {
  status: 'running' | 'paused' | 'stopped';
  dry_run: boolean;
  strategy: string;
  exchange: string;
  timeframe: string;
  stake_currency: string;
  balance: number;
  open_trades_count: number;
  max_open_trades: number;
  daily_profit_pct: number;
  daily_profit_abs: number;
  total_profit_abs: number;
}

export interface BotLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'BUY' | 'SELL';
  message: string;
}

export interface FreqtradeConfig {
  max_open_trades: number;
  stake_currency: string;
  stake_amount: number | 'unlimited';
  tradable_balance_ratio: number;
  fiat_display_currency: string;
  dry_run: boolean;
  dry_run_wallet: number;
  cancel_open_orders_on_exit: boolean;
  trading_mode: 'spot' | 'futures';
  margin_mode?: 'isolated' | 'cross';
  exchange: {
    name: string;
    key: string;
    secret: string;
    ccxt_config: {
      enableRateLimit: boolean;
    };
    pair_whitelist: string[];
    pair_blacklist: string[];
  };
  pairlists: Array<{
    method: string;
    number_assets?: number;
    sort_key?: string;
    min_value?: number;
    refresh_period?: number;
  }>;
  telegram: {
    enabled: boolean;
    token: string;
    chat_id: string;
  };
  api_server: {
    enabled: boolean;
    listen_ip_address: string;
    listen_port: number;
    verbosity: string;
    jwt_secret_key: string;
    CORS_origins: string[];
    username: string;
    password_hash: string;
  };
}
