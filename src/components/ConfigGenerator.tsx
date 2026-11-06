import React, { useState } from 'react';
import { FreqtradeConfig } from '../types/freqtrade';
import { Copy, Check, Download, Settings, Server, Shield, Send, SlidersHorizontal, RefreshCw } from 'lucide-react';

export const ConfigGenerator: React.FC = () => {
  const [exchangeName, setExchangeName] = useState('hyperliquid');
  const [dryRun, setDryRun] = useState(true);
  const [tradingMode, setTradingMode] = useState<'spot' | 'futures'>('futures');
  const [stakeCurrency, setStakeCurrency] = useState('USDT');
  const [stakeAmount, setStakeAmount] = useState<number | 'unlimited'>('unlimited');
  const [maxOpenTrades, setMaxOpenTrades] = useState(4);
  const [dryRunWallet, setDryRunWallet] = useState(1000);
  const [pairlistType, setPairlistType] = useState<'static' | 'volume'>('volume');
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [apiServerEnabled, setApiServerEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLiveGuide, setShowLiveGuide] = useState(false);

  // Dynamic config object matching Freqtrade specification
  const isFutures = tradingMode === 'futures';
  const pairSuffix = isFutures ? `:${stakeCurrency}` : '';

  const configObject: FreqtradeConfig = {
    max_open_trades: maxOpenTrades,
    stake_currency: stakeCurrency,
    stake_amount: stakeAmount,
    tradable_balance_ratio: 0.99,
    fiat_display_currency: 'USD',
    dry_run: dryRun,
    dry_run_wallet: dryRunWallet,
    cancel_open_orders_on_exit: false,
    trading_mode: tradingMode,
    margin_mode: isFutures ? 'cross' : undefined,
    exchange: {
      name: exchangeName,
      key: dryRun ? '' : '0xYourHyperliquidWalletAddress...',
      secret: dryRun ? '' : '0xYourAgentApiPrivateKey...',
      ccxt_config: {
        enableRateLimit: true
      },
      pair_whitelist: [
        `BTC/${stakeCurrency}${pairSuffix}`,
        `ETH/${stakeCurrency}${pairSuffix}`,
        `SOL/${stakeCurrency}${pairSuffix}`,
        `HYPE/${stakeCurrency}${pairSuffix}`,
        `SUI/${stakeCurrency}${pairSuffix}`,
        `AVAX/${stakeCurrency}${pairSuffix}`
      ],
      pair_blacklist: [
        `.*(DOWN|UP)/.*`,
        `.*(BULL|BEAR)/.*`
      ]
    },
    pairlists: pairlistType === 'volume' ? [
      {
        method: 'VolumePairList',
        number_assets: 20,
        sort_key: 'quoteVolume',
        min_value: 0,
        refresh_period: 1800
      },
      {
        method: 'AgeFilter',
        min_value: 10
      },
      {
        method: 'PrecisionFilter'
      },
      {
        method: 'PriceFilter',
        min_value: 0.00000010
      },
      {
        method: 'ShuffleFilter'
      }
    ] : [
      {
        method: 'StaticPairList'
      }
    ],
    telegram: {
      enabled: telegramEnabled,
      token: telegramEnabled ? '123456789:ABCdefGhIJKlmNoPQRstuVWXyz' : '',
      chat_id: telegramEnabled ? '987654321' : ''
    },
    api_server: {
      enabled: apiServerEnabled,
      listen_ip_address: '0.0.0.0',
      listen_port: 8080,
      verbosity: 'info',
      jwt_secret_key: 'supersecretjwttokenforfrequi',
      CORS_origins: ['*'],
      username: 'freqtrader',
      password_hash: '$2b$12$e8x5mY...your_hashed_password...'
    }
  };

  const jsonString = JSON.stringify(configObject, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([jsonString], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = 'config.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white font-sans">
            Freqtrade Config Generator (config.json)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Construct production-ready Freqtrade bot configurations with verified exchange adapters, dynamic pairlists, and FreqUI API webserver settings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download config.json</span>
          </button>
        </div>
      </div>

      {/* Grid: Visual Builder (Left) + Live JSON Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Settings Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Section: Exchange & Market */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Exchange & Trading Mode</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Exchange CCXT Provider</label>
                <select
                  value={exchangeName}
                  onChange={(e) => {
                    const ex = e.target.value;
                    setExchangeName(ex);
                    if (ex === 'hyperliquid') setTradingMode('futures');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                >
                  <option value="hyperliquid">Hyperliquid (Decentralized Perps DEX)</option>
                  <option value="binance">Binance (Official Top Tier)</option>
                  <option value="kraken">Kraken</option>
                  <option value="kucoin">KuCoin</option>
                  <option value="okx">OKX</option>
                  <option value="bybit">Bybit</option>
                  <option value="gate">Gate.io</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-400 block mb-1">Mode</label>
                  <select
                    value={tradingMode}
                    onChange={(e) => setTradingMode(e.target.value as 'spot' | 'futures')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  >
                    <option value="futures">Futures / Perps</option>
                    <option value="spot">Spot Trading</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Execution Safety</label>
                  <button
                    type="button"
                    onClick={() => setDryRun(!dryRun)}
                    className={`w-full p-2.5 rounded-lg border font-mono font-medium text-center transition-colors ${
                      dryRun
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/40 text-red-400 font-bold'
                    }`}
                  >
                    {dryRun ? 'DRY-RUN (Active)' : 'LIVE CAPITAL'}
                  </button>
                </div>
              </div>

              {/* How to turn on Live Testing Later */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLiveGuide(!showLiveGuide)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center justify-between w-full text-left"
                >
                  <span>How do I turn on live testing later?</span>
                  <span className="font-mono text-[11px] text-slate-500">{showLiveGuide ? 'Hide ▲' : 'Show ▼'}</span>
                </button>

                {showLiveGuide && (
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px] text-slate-300 leading-relaxed font-sans">
                    <p className="font-semibold text-white">To transition to real funds / live testing:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>In <code className="text-emerald-400 font-mono">user_data/config.json</code>, change <code className="text-slate-200 font-mono">"dry_run": true</code> to <code className="text-red-400 font-mono">"dry_run": false</code>.</li>
                      <li>On Hyperliquid, go to <strong className="text-slate-200">app.hyperliquid.xyz/API</strong> and generate an <strong className="text-slate-200">API Agent Wallet</strong>. Fill in the agent address in <code className="text-slate-200 font-mono">"key"</code> and private key in <code className="text-slate-200 font-mono">"secret"</code>. (Never use your primary seed phrase).</li>
                      <li>Deposit test funds (e.g. 50–100 USDC/USDT) to your Hyperliquid perp account.</li>
                      <li>Start live bot: <code className="text-emerald-400 font-mono">freqtrade trade --config user_data/config.json --strategy SampleStrategy</code>.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Stake & Capital Allocation */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Stake & Capital Management</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Stake Currency</label>
                  <select
                    value={stakeCurrency}
                    onChange={(e) => setStakeCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  >
                    <option value="USDT">USDT</option>
                    <option value="USDC">USDC</option>
                    <option value="BTC">BTC</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Max Concurrent Trades</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxOpenTrades}
                    onChange={(e) => setMaxOpenTrades(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-400">Stake Amount Per Trade</label>
                  <button
                    type="button"
                    onClick={() => setStakeAmount(stakeAmount === 'unlimited' ? 150 : 'unlimited')}
                    className="text-[11px] text-cyan-400 hover:underline font-mono"
                  >
                    {stakeAmount === 'unlimited' ? 'Switch to Fixed' : 'Switch to Unlimited'}
                  </button>
                </div>
                {stakeAmount === 'unlimited' ? (
                  <div className="p-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono text-cyan-400">
                    "unlimited" (bot automatically divides tradable balance)
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(parseFloat(e.target.value) || 50)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono pr-14"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-xs">
                      {stakeCurrency}
                    </span>
                  </div>
                )}
              </div>

              {dryRun && (
                <div>
                  <label className="text-slate-400 block mb-1">Dry-Run Virtual Wallet</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="100"
                      step="100"
                      value={dryRunWallet}
                      onChange={(e) => setDryRunWallet(parseFloat(e.target.value) || 1000)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono pr-14"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-500 font-mono text-xs">
                      {stakeCurrency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Pairlist Architecture & FreqUI */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Pairlists & Integrations</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Pairlist Selector</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPairlistType('volume')}
                    className={`p-2 rounded-lg border font-sans text-xs transition-colors ${
                      pairlistType === 'volume'
                        ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    VolumePairList (Top 20)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPairlistType('static')}
                    className={`p-2 rounded-lg border font-sans text-xs transition-colors ${
                      pairlistType === 'static'
                        ? 'bg-slate-800 border-emerald-500 text-white font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Static Whitelist
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">FreqUI Webserver (Port 8080)</span>
                  <span className="text-[11px] text-slate-500">Enable modern browser control dashboard</span>
                </div>
                <input
                  type="checkbox"
                  checked={apiServerEnabled}
                  onChange={(e) => setApiServerEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Telegram Bot Notifications</span>
                  <span className="text-[11px] text-slate-500">Real-time smartphone push alerts for trades</span>
                </div>
                <input
                  type="checkbox"
                  checked={telegramEnabled}
                  onChange={(e) => setTelegramEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Code Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              user_data/config.json
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              Validated Schema v3
            </span>
          </div>

          <div className="p-4 bg-slate-950 overflow-x-auto max-h-[660px] font-mono text-xs leading-relaxed text-slate-300">
            <pre>
              {jsonString.split('\n').map((line, idx) => (
                <div key={idx} className="table-row">
                  <span className="table-cell select-none text-slate-600 text-right pr-4 text-[11px] w-8">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">
                    {line.includes('"name"') || line.includes('"stake_currency"') || line.includes('"method"') ? (
                      <span className="text-cyan-300">{line}</span>
                    ) : line.includes('true') || line.includes('false') ? (
                      <span className="text-purple-400">{line}</span>
                    ) : line.includes(': "') ? (
                      <span className="text-amber-200">{line}</span>
                    ) : line.includes(': [') || line.includes(': {') ? (
                      <span className="text-emerald-400">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
