import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, ExternalLink, HelpCircle, Code, Shield } from 'lucide-react';

export const CheatSheet: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const commandCategories = [
    {
      category: '0. Operating System Packages & Prerequisites',
      commands: [
        {
          cmd: 'sudo apt-get update && sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl',
          desc: 'Ubuntu/Debian: Update apt index and install Python 3 development headers, virtual environments, pandas, git, and curl.'
        },
        {
          cmd: 'sudo pacman -Syu && sudo pacman -S --needed python python-pip python-virtualenv python-pandas git curl base-devel',
          desc: 'Arch Linux: Update system and install required packages with base development toolchain.'
        },
        {
          cmd: 'sudo dnf install -y python3-pip python3-devel python3-pandas git curl gcc gcc-c++',
          desc: 'Fedora/RHEL: Install Python 3 headers, pandas, and C/C++ compilers.'
        },
        {
          cmd: 'brew install python git curl ta-lib',
          desc: 'macOS Homebrew: Install Python, git, curl, and native TA-Lib binary.'
        },
        {
          cmd: 'Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process; cd freqtrade; . .\\setup.ps1',
          desc: 'Windows PowerShell: Bypass script execution policy and run official automated installer.'
        },
        {
          cmd: '.\\.venv\\Scripts\\Activate.ps1',
          desc: 'Windows PowerShell: Activate the Python virtual environment.'
        }
      ]
    },
    {
      category: '1. Repository & Branch Management',
      commands: [
        {
          cmd: 'git clone https://github.com/freqtrade/freqtrade.git',
          desc: 'Clone the official Freqtrade repository from GitHub.'
        },
        {
          cmd: 'git checkout stable',
          desc: 'Novice choice: Locks repository to production-ready, thoroughly vetted release tags.'
        },
        {
          cmd: 'git checkout develop',
          desc: 'Advanced choice: Switches to active development branch with latest features and CCXT updates.'
        },
        {
          cmd: 'git pull origin $(git branch --show-current)',
          desc: 'Pull latest commits and updates for currently checked out branch.'
        }
      ]
    },
    {
      category: '2. Initialization, Pairlists & Data Download',
      commands: [
        {
          cmd: 'freqtrade create-userdir --userdir user_data',
          desc: 'Generate canonical directory tree (strategies, data, config, logs).'
        },
        {
          cmd: 'freqtrade new-config --config user_data/config.json',
          desc: 'Interactive CLI wizard to configure exchange, stake, telegram, and webserver.'
        },
        {
          cmd: 'scripts/fw generate-static-pairlist ./pairlist/pairlist-volume-usdt.json',
          desc: 'Wrapper script (fw): Generate high-volume USDT perpetual pairlist snapshot from filter rules.'
        },
        {
          cmd: 'mv pairlist.json pairlist/new_pairlist.json && ln -fsrv pairlist/new_pairlist.json pairlist/pairlist_futures.json',
          desc: 'Symlink trick: Link pairlist_futures.json -> new_pairlist.json so configs automatically load updated pairs.'
        },
        {
          cmd: 'scripts/fw download-data --timeframes 1m 3m 5m 15m 30m 1h 4h 12h 1d --timerange 20241201-20250101',
          desc: 'Download 9 OHLCV candlestick timeframes across 1 month for multi-timeframe indicator strategies (e.g. NFIX).'
        },
        {
          cmd: 'freqtrade download-data --exchange binance --pairs BTC/USDT ETH/USDT SOL/USDT BNB/USDT XRP/USDT DOGE/USDT ADA/USDT AVAX/USDT SUI/USDT LINK/USDT NEAR/USDT HYPE/USDT PEPE/USDT WIF/USDT SHIB/USDT DOT/USDT ARB/USDT OP/USDT TIA/USDT INJ/USDT FET/USDT RENDER/USDT APT/USDT KAS/USDT ICP/USDT UNI/USDT LTC/USDT BCH/USDT ATOM/USDT FTM/USDT --timeframes 5m 1h --days 730',
          desc: 'Download all top 30 liquidity pairs for the past 2 years (730 days) at 5m and 1h intervals for multi-pair backtesting.'
        },
        {
          cmd: 'freqtrade list-data --config user_data/config.json',
          desc: 'List all currently downloaded historical data pairs, timeframes, and date coverage.'
        }
      ]
    },
    {
      category: '3. Strategy Development & Community Repo',
      commands: [
        {
          cmd: 'git clone https://github.com/freqtrade/freqtrade-strategies.git user_data/strategies/community',
          desc: 'Install the official community repository with 100+ proven strategies into your user_data folder.'
        },
        {
          cmd: 'cp user_data/strategies/community/user_data/strategies/NostalgiaForInfinityX.py user_data/strategies/',
          desc: 'Copy a specific community strategy (e.g., NostalgiaForInfinityX, CombinedBinHAndCluc) into the active strategy folder.'
        },
        {
          cmd: 'pip install technical finta pandas-ta',
          desc: 'Install common indicator libraries required by advanced community strategies.'
        },
        {
          cmd: 'freqtrade list-strategies',
          desc: 'Scan strategies folder and verify valid classes and syntax.'
        },
        {
          cmd: 'freqtrade backtesting --config user_data/config.json --strategy NostalgiaForInfinityX --timerange 20240101-20240401',
          desc: 'Execute backtesting simulation with community strategy over specified timerange.'
        },
        {
          cmd: 'freqtrade new-strategy --strategy MyCustomStrategy',
          desc: 'Scaffold a new python strategy skeleton in user_data/strategies/.'
        }
      ]
    },
    {
      category: '4. Hyperopt Genetic Optimization',
      commands: [
        {
          cmd: 'freqtrade hyperopt --config user_data/config.json --strategy SampleStrategy --hyperopt-loss SharpeHyperOptLoss -e 100',
          desc: 'Run 100 epochs of genetic optimization maximizing the Sharpe ratio.'
        },
        {
          cmd: 'freqtrade hyperopt-list',
          desc: 'List previous hyperopt runs, epoch metrics, and loss scores.'
        },
        {
          cmd: 'freqtrade hyperopt-show --best',
          desc: 'Print the top optimized parameters (RSI, EMA, minimal_roi, stoploss).'
        }
      ]
    },
    {
      category: '5. Running Live & Dry-Run Bot',
      commands: [
        {
          cmd: 'freqtrade trade --config user_data/config.json --strategy SampleStrategy',
          desc: 'Start trading bot in dry-run mode (paper trading with simulated wallet).'
        },
        {
          cmd: 'freqtrade trade --config user_data/config.json --strategy SampleStrategy --db-url sqlite:///tradesv3.dryrun.sqlite',
          desc: 'Start bot pointing to specific SQLite database.'
        },
        {
          cmd: 'freqtrade status',
          desc: 'Inspect status, open positions, and current P&L of running bot.'
        }
      ]
    },
    {
      category: '6. 24/7 Uptime & Background Execution (Never Shuts Off)',
      commands: [
        {
          cmd: 'tmux new -s ft_bot && freqtrade trade --config user_data/config.json --strategy SampleStrategy',
          desc: 'tmux session: Detach with Ctrl+B then D. Bot continues running 24/7 even after you close your terminal or laptop.'
        },
        {
          cmd: 'tmux attach -t ft_bot',
          desc: 'Re-attach to running background tmux bot console anytime.'
        },
        {
          cmd: 'docker compose up -d',
          desc: 'Docker Daemon: Runs Freqtrade in detached background container (-d). Keeps running 24/7 independently.'
        },
        {
          cmd: 'docker compose logs -f',
          desc: 'Stream live Docker container logs in real time. Press Ctrl+C to stop viewing without stopping the bot.'
        },
        {
          cmd: 'docker compose ps',
          desc: 'Check bot container health, uptime, and mapped ports (FreqUI 8080).'
        },
        {
          cmd: 'docker compose down',
          desc: 'Gracefully stop and remove the Freqtrade Docker container.'
        },
        {
          cmd: 'nohup freqtrade trade --config user_data/config.json --strategy SampleStrategy > bot.log 2>&1 &',
          desc: 'nohup: Runs process in background immune to hangups when terminal or SSH session closes.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-bold text-white font-sans">
          Freqtrade Command & Architecture Cheat Sheet
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Quick reference manual for command-line syntax, directory conventions, and operational workflows.
        </p>
      </div>

      {/* Grid of Command Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {commandCategories.map((cat, idx) => (
          <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-white font-sans border-b border-slate-800 pb-2">
              {cat.category}
            </h3>

            <div className="space-y-3">
              {cat.commands.map((c, cIdx) => {
                const copyKey = `${idx}_${cIdx}`;
                return (
                  <div key={cIdx} className="space-y-1">
                    <div className="flex items-start justify-between gap-2 p-2 bg-slate-950 rounded border border-slate-800/80 group">
                      <code className="text-xs font-mono text-emerald-400 break-all select-all">
                        {c.cmd}
                      </code>
                      <button
                        onClick={() => copy(c.cmd, copyKey)}
                        className="text-slate-500 hover:text-white p-1 rounded transition-colors shrink-0"
                      >
                        {copiedId === copyKey ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-1">{c.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Common Pitfalls & FAQ */}
      <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-semibold text-white font-sans">
            Frequently Encountered Issues & Expert Tips
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-white">TA-Lib "fatal error: ta_libc.h not found"</h4>
            <p className="text-slate-400">
              TA-Lib is a C library, not pure Python. You must install the underlying C library with <code className="text-slate-200 font-mono">./setup.sh -i</code>, or use the official pre-built Docker image which already contains compiled binaries.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-white">Lookahead Bias & Data Leaks</h4>
            <p className="text-slate-400">
              Never use indicators that look forward in time (e.g. <code className="text-slate-200 font-mono">dataframe['close'].shift(-1)</code>) or centered rolling windows. Freqtrade's <code className="text-slate-200 font-mono">startup_candle_count</code> ensures sufficient preceding bars before generating buy signals.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
            <h4 className="font-semibold text-white">Slippage & Exchange Fee Reality</h4>
            <p className="text-slate-400">
              In backtests, configure taker/maker fee rates realistically (e.g. 0.1% for spot, 0.04% for futures). High-frequency 1m strategies can appear profitable in backtests but lose money live due to spread and slippage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
