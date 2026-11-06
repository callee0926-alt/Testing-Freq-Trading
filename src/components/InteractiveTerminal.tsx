import React, { useState, useRef, useEffect } from 'react';
import { BranchType } from '../types/freqtrade';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, CornerDownLeft, Play } from 'lucide-react';

interface InteractiveTerminalProps {
  currentBranch: BranchType;
  setBranch: (b: BranchType) => void;
  isOpen: boolean;
  onClose: () => void;
  initialCommand?: string;
}

interface CommandOutput {
  id: string;
  command: string;
  output: string;
  time: string;
}

export const InteractiveTerminal: React.FC<InteractiveTerminalProps> = ({
  currentBranch,
  setBranch,
  isOpen,
  onClose,
  initialCommand
}) => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isVenvActive, setIsVenvActive] = useState(true);
  const [venvName, setVenvName] = useState('.venv');
  const [shellType, setShellType] = useState<'bash' | 'powershell'>('powershell');
  const [outputs, setOutputs] = useState<CommandOutput[]>([
    {
      id: 'init_1',
      command: 'freqtrade --version',
      output: `freqtrade 2024.12 (Python 3.11.8) on linux
Git commit: e7b231a (${currentBranch})
TA-Lib: 0.4.0 (accelerated C extensions active)`,
      time: '22:15:00'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputs, isOpen]);

  useEffect(() => {
    if (initialCommand && isOpen) {
      runCommand(initialCommand);
    }
  }, [initialCommand, isOpen]);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let result = '';

    if (trimmed === 'clear') {
      setOutputs([]);
      setInput('');
      return;
    } else if (trimmed === 'help') {
      result = `Available Freqtrade, Git & System commands:
  sudo apt-get update             Fetch latest package index
  sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl
  git clone <repo>                Clone Freqtrade repository
  git checkout stable             Switch to stable release branch
  git checkout develop            Switch to develop active branch
  git branch                      Show current branch
  freqtrade list-strategies       List all detected strategies in user_data/strategies/
  freqtrade backtesting           Run backtest simulation with current strategy
  freqtrade download-data         Download historical OHLCV candles
  freqtrade hyperopt              Execute hyperopt genetic parameter search
  freqtrade trade                 Start live/dry-run trading bot engine
  freqtrade show-trades           Display table of open & closed trades
  freqtrade profit                Print cumulative P&L stats
  freqtrade --version             Print software version & branch
  clear                           Clear terminal screen`;
    } else if (
      trimmed.includes('apt-get update') && (trimmed.includes('apt install') || trimmed.includes('apt-get install'))
    ) {
      result = `Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Hit:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease
Hit:3 http://security.ubuntu.com/ubuntu jammy-security InRelease
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
All packages are up to date.

Reading package lists... Done
Building dependency tree... Done
The following additional packages will be installed:
  python3.11-dev libpython3.11-dev python3.11-venv python3-wheel
The following NEW packages will be installed:
  curl git python3-dev python3-pandas python3-pip python3-venv
0 upgraded, 6 newly installed, 0 to remove and 0 not upgraded.
Need to get 48.6 MB of archives.
After this operation, 184 MB of additional disk space will be used.
Get:1 http://archive.ubuntu.com/ubuntu jammy/main amd64 curl amd64 [194 kB]
Get:2 http://archive.ubuntu.com/ubuntu jammy/main amd64 git amd64 [3,162 kB]
Get:3 http://archive.ubuntu.com/ubuntu jammy/main amd64 python3-dev amd64 [25.4 kB]
Get:4 http://archive.ubuntu.com/ubuntu jammy/main amd64 python3-venv amd64 [1,224 B]
Get:5 http://archive.ubuntu.com/ubuntu jammy/universe amd64 python3-pandas amd64 [14.2 MB]
Get:6 http://archive.ubuntu.com/ubuntu jammy/universe amd64 python3-pip all [1,305 kB]
Fetched 48.6 MB in 2s (24.3 MB/s)
Selecting previously unselected package python3-dev...
Setting up python3-dev (3.11.8)...
Setting up python3-venv (3.11.8)...
Setting up python3-pandas (2.1.4)...
Setting up python3-pip (23.0.1)...
Setting up git (2.34.1)...
Setting up curl (7.81.0)...
Processing triggers for man-db (2.10.2)...
Prerequisites successfully installed! System ready for Freqtrade setup.`;
    } else if (trimmed === 'sudo apt-get update' || trimmed === 'sudo apt update' || trimmed === 'apt-get update') {
      result = `Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Hit:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease
Hit:3 http://security.ubuntu.com/ubuntu jammy-security InRelease
Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
All packages are up to date.`;
    } else if (trimmed.includes('apt install') || trimmed.includes('apt-get install')) {
      result = `Reading package lists... Done
Building dependency tree... Done
Reading state information... Done
The following NEW packages will be installed:
  curl git python3-dev python3-pandas python3-pip python3-venv
0 upgraded, 6 newly installed, 0 to remove and 0 not upgraded.
Need to get 48.6 MB of archives.
After this operation, 184 MB of additional disk space will be used.
Setting up python3-pip (23.0.1)...
Setting up python3-venv (3.11.8)...
Setting up python3-dev (3.11.8)...
Setting up python3-pandas (2.1.4)...
Setting up git (2.34.1)...
Setting up curl (7.81.0)...
Dependencies installed successfully!`;
    } else if (trimmed.toLowerCase().includes('set-executionpolicy')) {
      result = `Execution Policy Change
The execution policy helps protect you from scripts that you do not trust. Changing the execution policy might expose you to the security risks described in the about_Execution_Policies help topic at https:/go.microsoft.com/fwlink/?LinkID=135170.
[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "N"): Y
ExecutionPolicy set to: Bypass (Scope: Process/CurrentUser).
Unsigned scripts (.ps1) can now run in this PowerShell session.`;
    } else if (trimmed.includes('setup.ps1')) {
      result = `=====================================================
=== Freqtrade Windows PowerShell Installer (setup.ps1) ===
=====================================================

--> Checking Windows Environment & Python...
Found Python 3.11.8 (64-bit) at C:\\Python311\\python.exe
Architecture: Windows AMD64

--> Checking / Installing TA-Lib for Windows...
Pre-compiled C-library wheel detected for Python 3.11:
Downloading TA_Lib-0.4.28-cp311-cp311-win_amd64.whl ... 100%
Installing TA-Lib wheel into temporary cache ... Done!

--> Creating virtual environment at .venv\\ ...
python -m venv .venv
Virtual environment created successfully at C:\\freqtrade\\.venv\\

--> Upgrading pip, setuptools, wheel...
Requirement already satisfied: pip in .\\.venv\\Lib\\site-packages (23.0.1)
Installing collected packages: pip (24.0), setuptools, wheel
Successfully upgraded packaging tools.

--> Installing Freqtrade in editable mode (pip install -e .)...
Running setup.py develop for freqtrade
Installing dependencies: ccxt, pandas, numpy, technical, cryptography ... Done
Installing Plotting dependencies (plotly, kaleido) ... Done
Installing Hyperopt dependencies (scipy, scikit-optimize) ... Done
Installing FreqUI web dashboard bundle ... Done

=====================================================
=== Freqtrade Windows installation was SUCCESSFUL! ===
=====================================================

To activate your virtual environment in PowerShell:
  .\\.venv\\Scripts\\Activate.ps1

To verify:
  freqtrade --version

To generate config:
  freqtrade new-config --config user_data\\config.json`;
    } else if (
      trimmed.toLowerCase().includes('activate.ps1') ||
      trimmed.toLowerCase().includes('scripts\\activate') ||
      trimmed.toLowerCase().includes('scripts/activate') ||
      trimmed.includes('. .\\.venv')
    ) {
      setShellType('powershell');
      setVenvName('.venv');
      setIsVenvActive(true);
      result = `(.venv) Windows PowerShell Virtual Environment Activated!
PATH set to: C:\\freqtrade\\.venv\\Scripts
Python binary: C:\\freqtrade\\.venv\\Scripts\\python.exe
Freqtrade binary: C:\\freqtrade\\.venv\\Scripts\\freqtrade.exe
Command prompt updated to: (.venv) PS C:\\freqtrade>`;
    } else if (trimmed.toLowerCase() === 'powershell') {
      setShellType('powershell');
      result = `Switched to Windows PowerShell (v7.4) terminal emulation.`;
    } else if (trimmed.toLowerCase() === 'bash') {
      setShellType('bash');
      result = `Switched to Linux Bash terminal emulation.`;
    } else if (trimmed === 'cd freqtrade' || trimmed === 'cd freqtrade/' || trimmed === 'cd ./freqtrade') {
      result = `Entered directory: /home/user/freqtrade (branch: ${currentBranch})`;
    } else if (trimmed === 'cd ..' || trimmed === 'cd ../') {
      result = `Entered parent directory: /home/user`;
    } else if (trimmed.startsWith('cd ')) {
      result = `Changed directory to: ${trimmed.slice(3).trim()}`;
    } else if (
      trimmed.includes('setup.sh') &&
      (trimmed.includes('-u') || trimmed.includes('--update'))
    ) {
      setShellType('bash');
      result = `----------------------------------------
--------- Updating freqtrade -----------
----------------------------------------

Checking Git repo: Freqtrade branch '${currentBranch}'
--> Fetching updates from origin...
git pull --ff-only
Already up to date / Fast-forwarded with origin/${currentBranch}.

--> Checking virtual environment...
Virtual environment detected at: /home/user/freqtrade/.env
Python binary: /home/user/freqtrade/.env/bin/python (Python 3.11.8)

--> Updating pip, setuptools, wheel...
Requirement already satisfied: pip (24.0)

--> Updating Freqtrade dependencies in editable mode...
pip install --upgrade -e .
Requirement already satisfied: ccxt (updated to 4.2.85)
Requirement already satisfied: pandas (2.2.1)
Requirement already satisfied: technical (1.4.2)
Requirement already satisfied: TA-Lib (0.4.28)
Installing collected packages: freqtrade
Running setup.py develop for freqtrade
Successfully updated freqtrade to latest commit!

--> Checking FreqUI web interface...
Updating FreqUI dashboard bundle to latest release... Done!

---------------------------------------------------------
----------- Freqtrade update was SUCCESSFUL! ------------
---------------------------------------------------------

Your existing configuration (user_data/config.json), strategies, and trades were preserved intact.
To restart your running bot with the new updates:
  docker compose restart    # (or tmux attach -t ft_bot)`;
    } else if (
      trimmed.includes('setup.sh') &&
      (trimmed.includes('-r') || trimmed.includes('--reinstall'))
    ) {
      setShellType('bash');
      result = `----------------------------------------
-------- Reinstalling freqtrade --------
----------------------------------------

--> Removing existing virtual environment (.env)...
rm -rf .env
Rebuilding environment from scratch...
python3 -m venv .env
pip install --upgrade pip
pip install -e .
Freqtrade clean reinstall complete!`;
    } else if (
      trimmed.startsWith('./setup.sh') ||
      trimmed === 'bash setup.sh' ||
      trimmed === 'setup.sh' ||
      trimmed.startsWith('scripts/setup.sh') ||
      trimmed.startsWith('./scripts/setup.sh') ||
      trimmed === 'bash scripts/setup.sh' ||
      trimmed.includes('scripts/setup.sh')
    ) {
      setShellType('bash');
      result = `----------------------------------------
-------- Installing freqtrade ----------
----------------------------------------

Checking Python version: Python 3.11.8 (Supported)
Checking OS: Linux x86_64
Checking Git repo: Freqtrade branch '${currentBranch}'

--> Checking TA-Lib installation...
TA-Lib found in /usr/lib/libta_lib.so.0.0.0 (OK)

--> Creating virtual environment in .env...
python3 -m venv .env
Using python3 (3.11.8)

--> Activating virtual environment & updating pip...
Requirement already satisfied: pip in ./.env/lib/python3.11/site-packages (23.0.1)
Collecting pip
  Downloading pip-24.0-py3-none-any.whl (2.1 MB)
Installing collected packages: pip, setuptools, wheel
Successfully installed pip-24.0 setuptools-69.2.0 wheel-0.43.0

--> Installing Freqtrade dependencies in editable mode...
pip install -e .
Obtaining file:///home/user/freqtrade
  Installing build dependencies ... done
  Checking if build backend supports build_editable ... done
  Getting requirements to build editable ... done
  Preparing editable metadata (pyproject.toml) ... done
Collecting ccxt>=4.2.0 (from freqtrade==2024.12)
Collecting numpy>=1.26.0 (from freqtrade==2024.12)
Collecting pandas>=2.2.0 (from freqtrade==2024.12)
Collecting TA-Lib>=0.4.28 (from freqtrade==2024.12)
Collecting technical>=1.4.0 (from freqtrade==2024.12)
Installing collected packages: freqtrade
Running setup.py develop for freqtrade
Successfully installed freqtrade-2024.12

--> Interactive Feature Selection:
[✓] Installing Plot dependencies (plotly, kaleido)... Done
[✓] Installing Hyperopt dependencies (scipy, scikit-optimize)... Done
[✓] Installing FreqUI web interface (latest release)... Done

---------------------------------------------------------
-------- Freqtrade installation was SUCCESSFUL! ---------
---------------------------------------------------------

To activate your virtual environment in any terminal session, run:
  source .env/bin/activate

To verify your installation:
  freqtrade --version

To start a new bot with visual guide:
  freqtrade new-config --config user_data/config.json`;
    } else if (
      trimmed.includes('bin/activate') ||
      trimmed === 'source ./.venv/bin/activate' ||
      trimmed === 'source .venv/bin/activate' ||
      trimmed === 'source .env/bin/activate' ||
      trimmed === '. ./.venv/bin/activate'
    ) {
      const detectedVenv = trimmed.includes('.venv') ? '.venv' : '.env';
      setVenvName(detectedVenv);
      setIsVenvActive(true);
      result = `(${detectedVenv}) Virtual environment activated!
Environment path: /home/user/freqtrade/${detectedVenv}
Binaries mapped:
  - python -> /home/user/freqtrade/${detectedVenv}/bin/python (Python 3.11.8)
  - pip -> /home/user/freqtrade/${detectedVenv}/bin/pip (v24.0)
  - freqtrade -> /home/user/freqtrade/${detectedVenv}/bin/freqtrade (v2024.12)${
    trimmed.startsWith('source freqtrade')
      ? '\n\nNote: You activated from the parent folder. Remember to run:\n  cd freqtrade\nso user_data/ is located correctly!'
      : ''
  }`;
    } else if (trimmed === 'deactivate') {
      setIsVenvActive(false);
      result = `Virtual environment deactivated. Back to system Python (/usr/bin/python3).`;
    } else if (trimmed === 'which freqtrade') {
      result = isVenvActive
        ? `/home/user/freqtrade/${venvName}/bin/freqtrade`
        : `freqtrade: command not found (did you activate your virtual environment? 'source ./.venv/bin/activate')`;
    } else if (trimmed === 'which python' || trimmed === 'which python3') {
      result = isVenvActive
        ? `/home/user/freqtrade/${venvName}/bin/python`
        : `/usr/bin/python3`;
    } else if (trimmed.includes('create-userdir')) {
      result = `2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/strategies
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/data
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/hyperopts
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/plot
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/logs
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/backtest_results
2024-11-05 22:34:30 - freqtrade.configuration.directory_operations - INFO - Copied sample_strategy.py into user_data/strategies/sample_strategy.py
User directory initialized successfully!`;
    } else if (trimmed.includes('new-config')) {
      result = `? Do you want to enable Dry-run (recommended for testing)? [Y/n]: Y
? Please select your trading mode (spot or futures): futures
? Please enter margin mode (cross or isolated) [cross]: cross
? Please select your stake currency (USDT, USDC, BTC, etc.) [USDT]: USDT
? Please enter the stake amount per trade (or 'unlimited'): unlimited
? Please enter the max open trades: 4
? Please select your exchange: hyperliquid
? Do you want to use dynamic pairlists (VolumePairList)? [Y/n]: Y
  - Configured VolumePairList with top 20 perpetual assets (BTC, ETH, SOL, HYPE, SUI, AVAX)
? Do you want to enable Telegram notifications? [y/N]: N
? Do you want to enable FreqUI (Web UI)? [Y/n]: Y
? Please enter FreqUI listen IP [0.0.0.0]: 0.0.0.0
? Please enter FreqUI listen port [8080]: 8080
? Please enter FreqUI username: freqtrader
Writing configuration to 'user_data/config.json' ... done!

Config summary:
  Exchange: hyperliquid (futures / cross margin)
  Dry-run: True (simulated wallet: 1,000 USDT)
  Stake: unlimited USDT (divided across 4 max concurrent trades)
  Pairlist: VolumePairList (quoteVolume top 20)
  FreqUI: Enabled at http://0.0.0.0:8080
  Telegram: Disabled`;
    } else if (trimmed.includes('plot-dataframe')) {
      result = `2024-11-05 22:34:40 - freqtrade.plot.plotting - INFO - Generating HTML candlestick & indicator plot for BTC/USDT (5m)...
2024-11-05 22:34:41 - freqtrade.plot.plotting - INFO - Stored plot in user_data/plot/freqtrade-plot-BTC_USDT-5m.html`;
    } else if (trimmed.includes('plot-profit')) {
      result = `2024-11-05 22:34:45 - freqtrade.plot.plotting - INFO - Generating cumulative profit equity plot...
2024-11-05 22:34:46 - freqtrade.plot.plotting - INFO - Stored profit curve plot in user_data/plot/freqtrade-profit-plot.html`;
    } else if (trimmed.includes('git checkout stable')) {
      setBranch('stable');
      result = `Switched to branch 'stable'
Your branch is up to date with 'origin/stable'.
HEAD is now at 8b4c20d (tag: 2024.12) Release 2024.12`;
    } else if (trimmed.includes('git checkout develop')) {
      setBranch('develop');
      result = `Switched to branch 'develop'
Your branch is up to date with 'origin/develop'.
HEAD is now at f92c10a feat(indicators): update CCXT exchange drivers & indicators`;
    } else if (trimmed === 'git branch') {
      result = currentBranch === 'stable'
        ? `* stable\n  develop`
        : `  stable\n* develop`;
    } else if (trimmed === 'git status') {
      result = `On branch ${currentBranch}
Your branch is up to date with 'origin/${currentBranch}'.

nothing to commit, working tree clean`;
    } else if (trimmed.includes('freqtrade-strategies')) {
      result = `Cloning into 'user_data/strategies/community'...
remote: Enumerating objects: 1420, done.
remote: Counting objects: 100% (1420/1420), done.
remote: Compressing objects: 100% (820/820), done.
remote: Total 1420 (delta 610), reused 1350 (delta 590)
Receiving objects: 100% (1420/1420), 12.80 MiB | 14.20 MiB/s, done.
Resolving deltas: 100% (610/610), done.
Successfully cloned 'freqtrade-strategies'!
Installed 45+ community strategies into 'user_data/strategies/':
  ★ NostalgiaForInfinityX.py (iterativ)
  ★ CombinedBinHAndCluc.py (berlinguyinca)
  ★ SMAOffsetProtectOptV1.py (hroffld)
  ★ ElliotV8.py (xmatthias)
  ★ ReinforcedAverageStrategy.py`;
    } else if (trimmed.toLowerCase().includes('theobrigitte')) {
      if (trimmed.includes('scripts/setup.sh') || trimmed.includes('setup.sh')) {
        result = `Cloning into 'freqtrade'...
remote: Enumerating objects: 65120, done.
remote: Counting objects: 100% (380/380), done.
remote: Compressing objects: 100% (195/195), done.
remote: Total 65120 (delta 240), reused 290 (delta 185)
Receiving objects: 100% (65120/65120), 42.10 MiB | 19.50 MiB/s, done.
Resolving deltas: 100% (46200/46200), done.
Fork repository: TheoBrigitte/freqtrade
Entering directory 'freqtrade'...
Executing 'scripts/setup.sh'...

----------------------------------------
-------- Installing freqtrade ----------
----------------------------------------

Checking Python version: Python 3.11.8 (Supported)
Checking OS: Linux x86_64
Checking Git repo: TheoBrigitte/freqtrade

--> Checking TA-Lib installation...
TA-Lib found in /usr/lib/libta_lib.so.0.0.0 (OK)

--> Creating virtual environment in .env...
python3 -m venv .env
Using python3 (3.11.8)

--> Installing Freqtrade dependencies in editable mode...
pip install -e .
Successfully installed freqtrade from TheoBrigitte fork!

--> Interactive Feature Selection:
[✓] Installing Plot dependencies (plotly, kaleido)... Done
[✓] Installing Hyperopt dependencies (scipy, scikit-optimize)... Done
[✓] Installing FreqUI web dashboard bundle... Done

---------------------------------------------------------
-------- Freqtrade installation was SUCCESSFUL! ---------
---------------------------------------------------------

To activate your virtual environment:
  source .env/bin/activate
To initialize your user directory:
  freqtrade create-userdir --userdir user_data`;
      } else {
        result = `Cloning into 'freqtrade'...
remote: Enumerating objects: 65120, done.
remote: Counting objects: 100% (380/380), done.
remote: Compressing objects: 100% (195/195), done.
remote: Total 65120 (delta 240), reused 290 (delta 185)
Receiving objects: 100% (65120/65120), 42.10 MiB | 19.50 MiB/s, done.
Resolving deltas: 100% (46200/46200), done.
Cloned contributor fork 'TheoBrigitte/freqtrade' successfully!
Next steps:
  cd freqtrade
  scripts/setup.sh`;
      }
    } else if (trimmed.includes('git clone')) {
      result = `Cloning into 'freqtrade'...
remote: Enumerating objects: 68420, done.
remote: Counting objects: 100% (420/420), done.
remote: Compressing objects: 100% (210/210), done.
remote: Total 68420 (delta 280), reused 310 (delta 210)
Receiving objects: 100% (68420/68420), 45.20 MiB | 18.40 MiB/s, done.
Resolving deltas: 100% (49120/49120), done.`;
    } else if (trimmed.includes('freqtrade list-strategies')) {
      result = `Strategies found in 'user_data/strategies':
  [Official Reference]
  - SampleStrategy (timeframe: 5m)
  - BbandRsiStrategy (timeframe: 5m)
  - EmaTrendCross (timeframe: 15m)
  - HyperoptableStrategy (timeframe: 5m)

  [Community: freqtrade-strategies & Repositories]
  - NostalgiaForInfinityX (timeframe: 5m) - iterativ
  - CombinedBinHAndCluc (timeframe: 5m) - berlinguyinca
  - SMAOffsetProtectOptV1 (timeframe: 5m) - hroffld
  - ElliotV8 (timeframe: 5m) - xmatthias
  - Berlinguyinca_BinHV45 (timeframe: 5m) - berlinguyinca
  - ClucMay72018 (timeframe: 5m) - cluc
  - E0V1E (timeframe: 5m) - e0v1e
  - FreqtradeStrategiesThatWork (timeframe: 5m) - multi-ma-tsl
  - ProfitersStrategy (timeframe: 5m) - profiters`;
    } else if (trimmed.includes('generate-static-pairlist') && trimmed.includes('download-data')) {
      result = `[Pipeline Step 1/4] Generating static pairlist...
2024-12-01 10:00:01 - freqtrade.pairlist.PairListManager - INFO - Using VolumePairList: ./pairlist/pairlist-volume-usdt.json
Filtered top 25 perpetual volume pairs -> pairlist.json

[Pipeline Step 2/4] Moving pairlist.json -> pairlist/new_pairlist.json
renamed 'pairlist.json' -> 'pairlist/new_pairlist.json'

[Pipeline Step 3/4] Establishing symbolic link:
'pairlist/pairlist_futures.json' -> 'new_pairlist.json'

[Pipeline Step 4/4] Multi-timeframe historical data download...
Timeframes: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 12h, 1d | Timerange: 20241201-20250101
[========================================] 100% (225 pair-timeframe datasets downloaded)
Ready for backtesting and hyperopt with full multi-timeframe indicator history!`;
    } else if (trimmed.includes('generate-static-pairlist')) {
      result = `2024-12-01 10:00:01 - freqtrade.pairlist.PairListManager - INFO - Using VolumePairList filter config: ./pairlist/pairlist-volume-usdt.json
2024-12-01 10:00:02 - freqtrade.exchange - INFO - Fetching 24h ticker metrics for USDT perpetual pairs...
2024-12-01 10:00:04 - freqtrade.pairlist.VolumePairList - INFO - Filtered top 25 volume pairs (quoteVolume > 10,000,000 USDT):
  1: BTC/USDT:USDT  ($1,420.5M 24h vol)
  2: ETH/USDT:USDT  ($980.2M 24h vol)
  3: SOL/USDT:USDT  ($640.8M 24h vol)
  4: HYPE/USDT:USDT ($310.4M 24h vol)
  5: SUI/USDT:USDT  ($215.1M 24h vol)
  ... and 20 more pairs.
Writing static pairlist to 'pairlist.json' ... done!`;
    } else if (trimmed.startsWith('mv ')) {
      const parts = trimmed.split(' ').filter(Boolean);
      const src = parts[1] || 'file';
      const dest = parts[2] || 'destination';
      result = `renamed '${src}' -> '${dest}'`;
    } else if (trimmed.startsWith('ln ') || trimmed.startsWith('ln -')) {
      result = `'pairlist/pairlist_futures.json' -> 'new_pairlist.json'
Symbolic link established: pairlist/pairlist_futures.json points to pairlist/new_pairlist.json`;
    } else if (trimmed.includes('list-data')) {
      result = `2026-11-06 09:15:00 - freqtrade.data.history.history_utils - INFO - Found historical data in user_data/data/binance/:
================================ HISTORICAL DATA INVENTORY (TOP 30 PAIRS) ================================
| Pair          | Timeframe | From (Start)        | To (End)            | Candles | Size (MB) | Format  |
|---------------|-----------|---------------------|---------------------|---------|-----------|---------|
| BTC/USDT:USDT | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 142.5 MB  | feather |
| ETH/USDT:USDT | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 138.2 MB  | feather |
| SOL/USDT:USDT | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 129.4 MB  | feather |
| BNB/USDT:USDT | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 118.0 MB  | feather |
| SUI/USDT:USDT | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 119.5 MB  | feather |
| DOGE/USDT     | 5m, 1h    | 2024-11-06 00:00:00 | 2026-11-06 00:00:00 | 210,240 | 112.8 MB  | feather |
| ... and 24 more top liquidity pairs downloaded.                                                         |
==========================================================================================================
Total: 30 pairs · Lookback: 730 Days (Past 2 Years) · Total Candles: 6,307,200 · Disk: 3.35 GB (.feather)`;
    } else if (trimmed.includes('download-data')) {
      const isTwoYears = trimmed.includes('730') || trimmed.includes('20241106') || trimmed.includes('2y');
      const hasThirtyPairs = trimmed.includes('BTC') && trimmed.includes('ETH') && (trimmed.includes('SOL') || trimmed.includes('--pairs'));

      if (isTwoYears || hasThirtyPairs) {
        result = `2026-11-06 09:10:00 - freqtrade.data.history.history_utils - INFO - Initiating CCXT download for 30 top pairs from exchange: binance
2026-11-06 09:10:01 - freqtrade.data.history.history_utils - INFO - Timerange: 20241106-20261106 (730 days / 2 years)
2026-11-06 09:10:01 - freqtrade.data.history.history_utils - INFO - Timeframes: 5m, 1h
[1/30]  Downloading BTC/USDT (5m, 1h) ... 210,240 candles [142.5 MB] -> user_data/data/binance/BTC_USDT-5m.feather (OK)
[2/30]  Downloading ETH/USDT (5m, 1h) ... 210,240 candles [138.2 MB] -> user_data/data/binance/ETH_USDT-5m.feather (OK)
[3/30]  Downloading SOL/USDT (5m, 1h) ... 210,240 candles [129.4 MB] -> user_data/data/binance/SOL_USDT-5m.feather (OK)
[4/30]  Downloading BNB/USDT (5m, 1h) ... 210,240 candles [118.0 MB] -> user_data/data/binance/BNB_USDT-5m.feather (OK)
[5/30]  Downloading XRP/USDT (5m, 1h) ... 210,240 candles [115.3 MB] -> user_data/data/binance/XRP_USDT-5m.feather (OK)
[6/30]  Downloading DOGE/USDT (5m, 1h)... 210,240 candles [112.8 MB] -> user_data/data/binance/DOGE_USDT-5m.feather (OK)
[7/30]  Downloading ADA/USDT (5m, 1h) ... 210,240 candles [108.6 MB] -> user_data/data/binance/ADA_USDT-5m.feather (OK)
[8/30]  Downloading AVAX/USDT (5m, 1h)... 210,240 candles [114.2 MB] -> user_data/data/binance/AVAX_USDT-5m.feather (OK)
[9/30]  Downloading SUI/USDT (5m, 1h) ... 210,240 candles [119.5 MB] -> user_data/data/binance/SUI_USDT-5m.feather (OK)
[10/30] Downloading LINK/USDT (5m, 1h)... 210,240 candles [109.8 MB] -> user_data/data/binance/LINK_USDT-5m.feather (OK)
... [11 to 30] Successfully fetched NEAR, HYPE, PEPE, WIF, SHIB, DOT, ARB, OP, TIA, INJ, FET, RENDER, APT, KAS, ICP, UNI, LTC, BCH, ATOM, FTM.
[==================================================] 100% (6,307,200 candles indexed)
All 30 premier pairs successfully downloaded for the past 2 years (730 days)!
Stored in: user_data/data/binance/ (3.35 GB .feather cache)`;
      } else {
        result = `2024-11-05 22:18:10 - freqtrade.data.history.history_utils - INFO - Downloading pair BTC/USDT, interval 5m...
2024-11-05 22:18:12 - freqtrade.data.history.history_utils - INFO - Downloading pair ETH/USDT, interval 5m...
2024-11-05 22:18:14 - freqtrade.data.history.history_utils - INFO - Downloaded 25,000 candles into user_data/data/binance/`;
      }
    } else if (trimmed.includes('freqtrade backtesting')) {
      const isTwoYears = trimmed.includes('20241106-20261106') || trimmed.includes('730') || trimmed.includes('2y');
      if (isTwoYears) {
        result = `2026-11-06 09:20:00 - freqtrade.optimize.backtesting - INFO - Running backtesting for Strategy: NostalgiaForInfinityX
2026-11-06 09:20:01 - freqtrade.optimize.backtesting - INFO - Loading 2-Year Feather Data: 20241106-20261106 (730 days)
2026-11-06 09:20:02 - freqtrade.optimize.backtesting - INFO - Processing 6,307,200 candles across top 30 VolumePairList pairs (5m timeframe)...
================================================== BACKTESTING SUMMARY METRICS (PAST 2 YEARS / 730 DAYS) ==================================================
| Pair          | Trades | Wins | Draw | Loss | Win% | Profit USDT | Profit % | Avg Profit % | Avg Duration | Max DD USDT | Max DD % |
|---------------|--------|------|------|------|------|-------------|----------|--------------|--------------|-------------|----------|
| BTC/USDT:USDT |     82 |   66 |    0 |   16 | 80.5 |      342.10 |    34.21 |         0.42 |       42.0 m |       45.20 |     4.52 |
| ETH/USDT:USDT |     78 |   62 |    0 |   16 | 79.5 |      315.40 |    31.54 |         0.40 |       38.5 m |       48.10 |     4.81 |
| SOL/USDT:USDT |     94 |   74 |    0 |   20 | 78.7 |      412.80 |    41.28 |         0.44 |       46.0 m |       62.40 |     6.24 |
| SUI/USDT:USDT |    106 |   82 |    0 |   24 | 77.4 |      465.30 |    46.53 |         0.44 |       52.0 m |       71.00 |     7.10 |
| DOGE/USDT     |     89 |   68 |    0 |   21 | 76.4 |      358.90 |    35.89 |         0.40 |       44.5 m |       58.60 |     5.86 |
| ... (25 more) |  1,971 |1,540 |    0 |  431 | 78.1 |    8,245.50 |   824.55 |         0.42 |       41.8 m |    1,240.00 |     8.12 |
| TOTAL         |  2,420 |1,892 |    0 |  528 | 78.2 |   10,140.00 |   101.40 |         0.42 |       42.2 m |      285.50 |     2.85 |
============================================================================================================================================================
Timerange: 20241106-20261106 (730 days) · Total Trades: 2,420 (3.3 trades/day) · Sharpe: 2.84 · Sortino: 3.65 · Profit Factor: 2.45
Exit Reasons: roi: 1,642, trailing: 421, stoploss: 182, signal: 175`;
      } else if (trimmed.includes('20241221-20241231') || trimmed.includes('10d') || trimmed.includes('10') || trimmed.includes('timerange')) {
        result = `2024-12-31 23:59:00 - freqtrade.optimize.backtesting - INFO - Running backtesting for Strategy: NostalgiaForInfinityX
2024-12-31 23:59:01 - freqtrade.optimize.backtesting - INFO - Loading data for timerange: 20241221-20241231 (10 days lookback)
2024-12-31 23:59:02 - freqtrade.optimize.backtesting - INFO - Processing 2,880 candles across 5 pairs (5m timeframe)...
================================================ BACKTESTING SUMMARY METRICS (10 DAYS) ================================================
| Pair          | Trades | Wins | Draw | Loss | Win% | Profit USDT | Profit % | Avg Profit % | Avg Duration | Max DD USDT | Max DD % |
|---------------|--------|------|------|------|------|-------------|----------|--------------|--------------|-------------|----------|
| BTC/USDT:USDT |      8 |    7 |    0 |    1 | 87.5 |       28.40 |     2.84 |         0.35 |       34.0 m |        4.10 |     0.41 |
| ETH/USDT:USDT |      7 |    6 |    0 |    1 | 85.7 |       22.10 |     2.21 |         0.31 |       29.5 m |        3.80 |     0.38 |
| SOL/USDT:USDT |      9 |    7 |    0 |    2 | 77.8 |       31.60 |     3.16 |         0.35 |       41.0 m |        6.20 |     0.62 |
| TOTAL         |     24 |   20 |    0 |    4 | 83.3 |       82.10 |     8.21 |         0.34 |       34.8 m |        7.40 |     0.74 |
=======================================================================================================================================
Timerange: 20241221-20241231 (10 days) · Sharpe: 2.48 · Sortino: 3.15 · Profit Factor: 2.82 · Exit Reasons: roi: 16, trailing: 4, stoploss: 1, signal: 3`;
      } else {
        result = `2024-11-05 22:18:20 - freqtrade.optimize.backtesting - INFO - Running backtesting for Strategy: SampleStrategy
2024-11-05 22:18:21 - freqtrade.optimize.backtesting - INFO - Loading data from 2024-01-01 to 2024-04-01 (90 days)
================================================ BACKTESTING SUMMARY METRICS ================================================
| Pair     | Trades | Wins | Draw | Loss | Win% | Profit USDT | Profit % | Avg Profit % | Avg Duration | Max DD USDT | Max DD % |
|----------|--------|------|------|------|------|-------------|----------|--------------|--------------|-------------|----------|
| BTC/USDT |     28 |   21 |    0 |    7 | 75.0 |       64.20 |     6.42 |         0.23 |       42.5 m |       14.20 |     1.42 |
| ETH/USDT |     22 |   16 |    0 |    6 | 72.7 |       48.10 |     4.81 |         0.22 |       38.0 m |       11.50 |     1.15 |
| TOTAL    |     50 |   37 |    0 |   13 | 74.0 |      112.30 |    11.23 |         0.22 |       40.5 m |       18.40 |     1.84 |
=============================================================================================================================
Sharpe: 2.14 · Sortino: 2.85 · Calmar: 6.10 · Profit Factor: 2.38 · Exit Reasons: roi: 24, trailing: 10, stoploss: 3, signal: 13`;
      }
    } else if (trimmed.includes('freqtrade hyperopt')) {
      result = `2024-11-05 22:18:40 - freqtrade.optimize.hyperopt - INFO - Starting hyperopt with 100 epochs (loss function: SharpeHyperOptLoss)
Epoch 10/100: Best result: Profit: 12.4%, Winrate: 76.5%, Sharpe: 2.18, Duration: 35m
Epoch 50/100: Best result: Profit: 14.8%, Winrate: 80.2%, Sharpe: 2.44, Duration: 32m
Epoch 100/100: Optimization completed!
Optimal parameters stored in: user_data/strategies/SampleStrategy.json
  buy_rsi: 28 (initial: 30)
  sell_rsi: 72 (initial: 70)
  fast_ema: 8  (initial: 9)
  slow_ema: 22 (initial: 21)`;
    } else if (trimmed.includes('freqtrade trade')) {
      result = `2024-11-05 22:19:00 - freqtrade.worker - INFO - Starting worker 2024.12
2024-11-05 22:19:00 - freqtrade.configuration - INFO - Dry run mode is enabled.
2024-11-05 22:19:01 - freqtrade.exchange - INFO - Connected to exchange: Binance
2024-11-05 22:19:01 - freqtrade.rpc.api_server - INFO - FreqUI Webserver started on http://0.0.0.0:8080
2024-11-05 22:19:02 - freqtrade.worker - INFO - Bot running. Strategy: SampleStrategy. Watching 6 pairs.`;
    } else if (trimmed.includes('freqtrade profit')) {
      result = `Freqtrade Profit Summary:
  Starting Balance: 1000.00 USDT
  Current Balance:  1145.20 USDT
  Total Profit:     +145.20 USDT (+14.52%)
  Daily P&L:        +29.80 USDT (+2.14%)
  Open Trades:      2 / 3`;
    } else if (trimmed.includes('freqtrade show-trades')) {
      result = `Active Trades:
  #101: BTC/USDT | Open: 67,450.00 | Current: 68,120.00 | P&L: +0.99% (+1.48 USDT)
  #102: ETH/USDT | Open: 3,480.00  | Current: 3,445.00  | P&L: -1.01% (-1.51 USDT)`;
    } else if (trimmed === 'freqtrade --version') {
      result = `freqtrade 2024.12 (Python 3.11.8) on linux
Git commit: e7b231a (${currentBranch})
TA-Lib: 0.4.0 (accelerated C extensions active)`;
    } else if (
      trimmed.includes('docker compose up -d') ||
      trimmed.includes('docker-compose up -d') ||
      trimmed === 'docker compose up' ||
      trimmed === 'docker-compose up'
    ) {
      result = `[+] Running 2/2
 ✔ Network freqtrade_default     Created
 ✔ Container freqtrade-bot-1      Started
Freqtrade bot successfully launched in detached background mode (-d).
Container ID: 9f8a4e21bc0d
Status: Running (FreqUI accessible at http://0.0.0.0:8080)
To view live logs: docker compose logs -f
To stop: docker compose down`;
    } else if (
      trimmed.includes('docker compose logs') ||
      trimmed.includes('docker-compose logs') ||
      trimmed.includes('docker logs')
    ) {
      result = `freqtrade-bot-1  | 2026-11-06 08:00:31 - freqtrade.worker - INFO - Starting worker 2024.12
freqtrade-bot-1  | 2026-11-06 08:00:31 - freqtrade.configuration - INFO - Dry run mode is enabled.
freqtrade-bot-1  | 2026-11-06 08:00:32 - freqtrade.exchange.hyperliquid - INFO - Connected to Hyperliquid Perpetuals DEX API (Agent wallet verified)
freqtrade-bot-1  | 2026-11-06 08:00:32 - freqtrade.rpc.api_server - INFO - FreqUI API webserver listening on http://0.0.0.0:8080
freqtrade-bot-1  | 2026-11-06 08:00:33 - freqtrade.pairlist.VolumePairList - INFO - Filtered top 20 perpetual pairs by 24h volume: BTC/USDT:USDT, ETH/USDT:USDT, SOL/USDT:USDT, HYPE/USDT:USDT...
freqtrade-bot-1  | 2026-11-06 08:00:34 - freqtrade.strategy.hyperoptable_strategy - INFO - Strategy loaded: HyperoptableStrategy (timeframe: 5m)
freqtrade-bot-1  | 2026-11-06 08:00:35 - freqtrade.worker - INFO - Trade iteration loop #1 active. Open trades: 0/4.
freqtrade-bot-1  | 2026-11-06 08:00:40 - freqtrade.worker - INFO - Checking buy signals across 20 pairs...`;
    } else if (trimmed.includes('docker compose down') || trimmed.includes('docker-compose down')) {
      result = `[+] Running 2/2
 ✔ Container freqtrade-bot-1      Stopped & Removed
 ✔ Network freqtrade_default     Removed
Freqtrade container gracefully terminated. Open positions retained on exchange.`;
    } else if (trimmed.includes('docker compose ps') || trimmed === 'docker ps') {
      result = `NAME              IMAGE                          COMMAND                  SERVICE     CREATED         STATUS         PORTS
freqtrade-bot-1   freqtradeorg/freqtrade:${currentBranch}  "freqtrade trade --c…"   freqtrade   12 minutes ago  Up 12 minutes  0.0.0.0:8080->8080/tcp`;
    } else if (trimmed.includes('docker compose pull')) {
      result = `[+] Pulling 1/1
 ✔ freqtrade Pulled (freqtradeorg/freqtrade:${currentBranch})
Digest: sha256:4a81f8c47b5c13e2d192cb9e1e9c20a108a3f89e227
Status: Downloaded newer image for freqtradeorg/freqtrade:${currentBranch}`;
    } else if (trimmed.includes('docker compose run')) {
      if (trimmed.includes('create-userdir')) {
        result = `2026-11-06 08:00:15 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data
2026-11-06 08:00:15 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/strategies
2026-11-06 08:00:15 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/data
2026-11-06 08:00:15 - freqtrade.configuration.directory_operations - INFO - Creating directory: user_data/hyperopts
2026-11-06 08:00:15 - freqtrade.configuration.directory_operations - INFO - Copied sample_strategy.py into user_data/strategies/sample_strategy.py
User directory initialized successfully inside mounted volume!`;
      } else {
        result = `Executing Freqtrade Docker command: ${trimmed}
Done.`;
      }
    } else {
      result = `freqtrade: command not recognized: '${trimmed}'. Type 'help' to see valid commands.`;
    }

    setOutputs((prev) => [
      ...prev,
      {
        id: `out_${Date.now()}`,
        command: trimmed,
        output: result,
        time: now
      }
    ]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(input);
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        const nextIdx = historyIndex + 1 < history.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[history.length - 1 - nextIdx] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-50 transition-all duration-200 ${
        isMaximized
          ? 'inset-4 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl flex flex-col'
          : 'bottom-4 right-4 w-full max-w-2xl h-[460px] bg-slate-950 border border-slate-800 rounded-xl shadow-2xl flex flex-col'
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 rounded-t-xl select-none">
        <div className="flex items-center gap-2">
          <TerminalIcon className={`w-4 h-4 ${shellType === 'powershell' ? 'text-blue-400' : 'text-emerald-400'}`} />
          <span className="text-xs font-mono font-medium text-slate-200">
            {shellType === 'powershell' ? 'PowerShell (v7.4)' : 'bash'} · branch: <strong className="text-emerald-400 font-bold">{currentBranch}</strong>
          </span>
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px] ml-2">
            <button
              onClick={() => setShellType('bash')}
              className={`px-2 py-0.5 rounded transition-colors ${
                shellType === 'bash' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bash
            </button>
            <button
              onClick={() => setShellType('powershell')}
              className={`px-2 py-0.5 rounded transition-colors ${
                shellType === 'powershell' ? 'bg-blue-500/20 text-blue-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              PowerShell
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
        <span className="text-slate-500 whitespace-nowrap">Quick:</span>
        <button
          onClick={() => runCommand('sudo apt-get update && sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl')}
          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/30 border border-emerald-500/30 whitespace-nowrap transition-colors"
        >
          apt install prerequisites
        </button>
        <button
          onClick={() => runCommand('./setup.sh -i')}
          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:text-white hover:bg-cyan-500/30 border border-cyan-500/30 whitespace-nowrap transition-colors"
        >
          ./setup.sh -i
        </button>
        <button
          onClick={() => runCommand('scripts/setup.sh -u')}
          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/30 border border-emerald-500/30 whitespace-nowrap transition-colors"
        >
          scripts/setup.sh -u
        </button>
        <button
          onClick={() => runCommand('. .\\setup.ps1')}
          className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 hover:text-white hover:bg-blue-500/30 border border-blue-500/30 whitespace-nowrap transition-colors"
        >
          . .\setup.ps1
        </button>
        <button
          onClick={() => runCommand('source ./.venv/bin/activate')}
          className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/30 border border-purple-500/30 whitespace-nowrap transition-colors"
        >
          source ./.venv/bin/activate
        </button>
        <button
          onClick={() => runCommand('. .\\.venv\\Scripts\\Activate.ps1')}
          className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:text-white hover:bg-indigo-500/30 border border-indigo-500/30 whitespace-nowrap transition-colors"
        >
          . .\Activate.ps1
        </button>
        <button
          onClick={() => runCommand('freqtrade create-userdir --userdir user_data')}
          className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:text-white hover:bg-amber-500/30 border border-amber-500/30 whitespace-nowrap transition-colors"
        >
          create-userdir
        </button>
        <button
          onClick={() => runCommand('freqtrade new-config --config user_data/config.json')}
          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/30 border border-emerald-500/30 whitespace-nowrap transition-colors"
        >
          new-config
        </button>
        <button
          onClick={() => runCommand('docker compose up -d')}
          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:text-white hover:bg-cyan-500/30 border border-cyan-500/30 whitespace-nowrap transition-colors"
        >
          docker compose up -d
        </button>
        <button
          onClick={() => runCommand('docker compose logs -f')}
          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:text-white hover:bg-cyan-500/30 border border-cyan-500/30 whitespace-nowrap transition-colors"
        >
          docker compose logs -f
        </button>
        <button
          onClick={() => runCommand('git clone https://github.com/freqtrade/freqtrade-strategies.git user_data/strategies/community')}
          className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:text-white hover:bg-purple-500/30 border border-purple-500/30 whitespace-nowrap transition-colors"
        >
          clone freqtrade-strategies
        </button>
        <button
          onClick={() => runCommand('freqtrade list-strategies')}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition-colors"
        >
          list-strategies
        </button>
        <button
          onClick={() => runCommand('freqtrade download-data --exchange binance --days 730 --timeframes 5m 1h --pairs BTC/USDT ETH/USDT SOL/USDT BNB/USDT XRP/USDT DOGE/USDT ADA/USDT AVAX/USDT SUI/USDT LINK/USDT')}
          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/30 border border-emerald-500/30 whitespace-nowrap transition-colors"
        >
          download 30 pairs (2 yrs)
        </button>
        <button
          onClick={() => runCommand('freqtrade list-data')}
          className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:text-white hover:bg-cyan-500/30 border border-cyan-500/30 whitespace-nowrap transition-colors"
        >
          list-data
        </button>
        <button
          onClick={() => runCommand('freqtrade backtesting --timerange 20241106-20261106')}
          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:text-white hover:bg-emerald-500/30 border border-emerald-500/30 whitespace-nowrap transition-colors"
        >
          backtest 30 pairs (2 yrs)
        </button>
        <button
          onClick={() => runCommand('freqtrade backtesting')}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition-colors"
        >
          backtesting (10d)
        </button>
        <button
          onClick={() => runCommand('freqtrade profit')}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition-colors"
        >
          profit
        </button>
        <button
          onClick={() => runCommand(`git checkout ${currentBranch === 'stable' ? 'develop' : 'stable'}`)}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition-colors"
        >
          checkout {currentBranch === 'stable' ? 'develop' : 'stable'}
        </button>
        <button
          onClick={() => runCommand('help')}
          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap transition-colors"
        >
          help
        </button>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 bg-slate-950">
        {outputs.map((item) => (
          <div key={item.id} className="space-y-1">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="font-semibold">
                {isVenvActive && <span className="text-purple-400 font-bold">({venvName}) </span>}
                {shellType === 'powershell' ? (
                  <span className="text-blue-400 font-bold">PS C:\freqtrade&gt;</span>
                ) : (
                  <span className="text-emerald-400">freqtrade@bot:~/freqtrade$</span>
                )}
              </span>
              <span className="text-white font-medium">{item.command}</span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap pl-2 border-l border-slate-800/80">
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 rounded-b-xl flex items-center gap-2 font-mono text-xs">
        <span className="font-semibold whitespace-nowrap flex items-center gap-1">
          {isVenvActive && <span className="text-purple-400 font-bold">({venvName})</span>}
          {shellType === 'powershell' ? (
            <span className="text-blue-400 font-bold">PS C:\freqtrade&gt;</span>
          ) : (
            <span className="text-emerald-400">freqtrade@bot:~/freqtrade$</span>
          )}
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="type command (e.g. 'freqtrade backtesting', 'git checkout develop', 'help')..."
          className="flex-1 bg-transparent text-white focus:outline-none placeholder:text-slate-600"
          autoFocus
        />
        <button
          onClick={() => runCommand(input)}
          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
