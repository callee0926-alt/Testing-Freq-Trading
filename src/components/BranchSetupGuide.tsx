import React, { useState } from 'react';
import { BranchType } from '../types/freqtrade';
import { Check, Copy, Terminal, ExternalLink, ShieldCheck, Zap, Server, Package, ArrowRight, AlertTriangle, Layers, Laptop, Box } from 'lucide-react';

interface BranchSetupGuideProps {
  currentBranch: BranchType;
  setBranch: (b: BranchType) => void;
  onOpenTerminal: (initialCmd?: string) => void;
}

export const BranchSetupGuide: React.FC<BranchSetupGuideProps> = ({
  currentBranch,
  setBranch,
  onOpenTerminal
}) => {
  const [selectedOS, setSelectedOS] = useState<'ubuntu' | 'arch' | 'fedora' | 'macos'>('ubuntu');
  const [installMethod, setInstallMethod] = useState<'script' | 'powershell' | 'docker' | 'venv' | 'talib'>('script');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const powershellSnippet = `# 1. Allow running local scripts in current PowerShell session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 2. Enter downloaded repository directory
cd freqtrade

# 3. Run official Windows installation script
. .\\setup.ps1

# 4. Activate virtual environment
.\\.venv\\Scripts\\Activate.ps1

# 5. Verify installation
freqtrade --version`;

  // OS Specific Prerequisites
  const osCommands: Record<string, { title: string; updateCmd: string; installCmd: string; fullSnippet: string }> = {
    ubuntu: {
      title: 'Debian / Ubuntu / Linux Mint (apt)',
      updateCmd: 'sudo apt-get update',
      installCmd: 'sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl',
      fullSnippet: `# update repository
sudo apt-get update

# install packages
sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl`
    },
    arch: {
      title: 'Arch Linux / Manjaro (pacman)',
      updateCmd: 'sudo pacman -Syu',
      installCmd: 'sudo pacman -S --needed python python-pip python-virtualenv python-pandas git curl base-devel',
      fullSnippet: `# update repository
sudo pacman -Syu

# install packages
sudo pacman -S --needed python python-pip python-virtualenv python-pandas git curl base-devel`
    },
    fedora: {
      title: 'Fedora / RHEL / CentOS (dnf)',
      updateCmd: 'sudo dnf check-update',
      installCmd: 'sudo dnf install -y python3-pip python3-devel python3-pandas git curl gcc gcc-c++',
      fullSnippet: `# update repository
sudo dnf check-update

# install packages
sudo dnf install -y python3-pip python3-devel python3-pandas git curl gcc gcc-c++`
    },
    macos: {
      title: 'macOS (Homebrew)',
      updateCmd: 'brew update',
      installCmd: 'brew install python git curl ta-lib',
      fullSnippet: `# update repository
brew update

# install packages
brew install python git curl ta-lib`
    }
  };

  const gitCloneSnippet = `# 1. Clone repository
git clone https://github.com/freqtrade/freqtrade.git

# 2. Enter repository directory
cd freqtrade

# 3. Checkout selected branch (stable for novice, develop for advanced)
git checkout ${currentBranch}`;

  const scriptCommands = `# Run official interactive installation script
./setup.sh -i

# Activate python virtual environment
source .env/bin/activate

# Verify installation
freqtrade --version`;

  const dockerSnippet = `# Option A: Quick Docker directory bootstrap
docker run --rm -v "$(pwd)/user_data:/freqtrade/user_data" freqtradeorg/freqtrade:${currentBranch} create-userdir --userdir user_data

# Option B: Docker Compose setup
curl https://raw.githubusercontent.com/freqtrade/freqtrade/${currentBranch}/docker/docker-compose.yml -o docker-compose.yml

# Pull matching image
docker compose pull

# Start bot in detached background mode (-d)
docker compose up -d

# View live logs anytime (Ctrl+C to exit log view without stopping bot)
docker compose logs -f`;

  const venvCommands = `# Create virtual environment
python3 -m venv .env
source .env/bin/activate

# Upgrade pip & install dependencies
pip install --upgrade pip
pip install -e .

# Initialize user data directory
freqtrade create-userdir --userdir user_data`;

  const talibGuide = `# Ubuntu / Debian manual TA-Lib build:
wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz
tar -xvf ta-lib-0.4.0-src.tar.gz
cd ta-lib/
./configure --prefix=/usr
make
sudo make install
cd .. && rm -rf ta-lib*
pip install TA-Lib

# macOS (Homebrew):
brew install ta-lib
pip install TA-Lib`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Introduction */}
      <div className="border-b border-slate-800 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Freqtrade Setup & Branch Architecture
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Freqtrade is a free and open-source crypto algorithmic trading bot written in Python. Prepare system packages, configure your repository branch, compile dependencies, and initialize your bot.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenTerminal(`sudo apt-get update && sudo apt install -y python3-pip python3-venv python3-dev python3-pandas git curl`)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Simulate Apt Install in CLI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Operating System Packages & Prerequisites */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Step 1: Install Operating System Packages & Prerequisites
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Prepare your Linux/macOS host with Python 3, compilation headers, and git before cloning.
              </p>
            </div>
          </div>

          {/* OS Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedOS('ubuntu')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedOS === 'ubuntu' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ubuntu / Debian
            </button>
            <button
              onClick={() => setSelectedOS('arch')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedOS === 'arch' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arch Linux
            </button>
            <button
              onClick={() => setSelectedOS('fedora')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedOS === 'fedora' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fedora
            </button>
            <button
              onClick={() => setSelectedOS('macos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedOS === 'macos' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              macOS
            </button>
          </div>
        </div>

        {/* Command Box */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 text-xs">
            <span className="font-mono text-slate-400">{osCommands[selectedOS].title}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(osCommands[selectedOS].fullSnippet, 'os_snippet')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
              >
                {copiedIndex === 'os_snippet' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenTerminal(osCommands[selectedOS].fullSnippet)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Run in CLI</span>
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-400 bg-slate-950 overflow-x-auto leading-relaxed">
            {osCommands[selectedOS].fullSnippet}
          </pre>
        </div>

        {/* Package Anatomy Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <div className="font-mono text-cyan-400 font-semibold">python3-dev & build-essential</div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Provides C/C++ header files needed to compile high-speed native C-extensions like TA-Lib, numpy, and cryptography.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <div className="font-mono text-emerald-400 font-semibold">python3-venv & pip</div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Creates isolated virtual environments so Freqtrade libraries do not conflict with or corrupt system Python packages.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <div className="font-mono text-amber-400 font-semibold">python3-pandas & git & curl</div>
            <p className="text-slate-400 mt-1 leading-relaxed">
              Pandas enables high-speed vectorized OHLCV candlestick computations; git handles branch checkouts; curl retrieves setup assets.
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Branch Architecture Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              Step 2: Clone Freqtrade & Select Branch (Stable vs Develop)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Decide between production stability or cutting-edge features.
            </p>
          </div>
        </div>

        {/* Choice: Novice vs Advanced Branch Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Choice 1: Stable */}
          <div
            onClick={() => setBranch('stable')}
            className={`cursor-pointer rounded-xl p-6 transition-all border ${
              currentBranch === 'stable'
                ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  currentBranch === 'stable' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Choice 1: stable branch</h3>
                    <span className="text-xs text-slate-400 font-mono">git checkout stable</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium mt-0.5">Recommended for novice users & live capital</p>
                </div>
              </div>
              {currentBranch === 'stable' && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              The <code className="text-emerald-300 font-mono bg-slate-950 px-1 py-0.5 rounded">stable</code> branch points to official, thoroughly vetted tagged releases. It guarantees backwards compatibility with strategy files, stable database schemas, and rock-solid execution.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Zero untested breaking API changes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Tested CCXT exchange drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Standard for production live & dry-run trading</span>
              </div>
            </div>
          </div>

          {/* Choice 2: Develop */}
          <div
            onClick={() => setBranch('develop')}
            className={`cursor-pointer rounded-xl p-6 transition-all border ${
              currentBranch === 'develop'
                ? 'bg-slate-900/90 border-cyan-500 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  currentBranch === 'develop' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">Choice 2: develop branch</h3>
                    <span className="text-xs text-slate-400 font-mono">git checkout develop</span>
                  </div>
                  <p className="text-xs text-cyan-400 font-medium mt-0.5">Recommended for advanced users & contributors</p>
                </div>
              </div>
              {currentBranch === 'develop' && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  ACTIVE
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-4 leading-relaxed">
              The <code className="text-cyan-300 font-mono bg-slate-950 px-1 py-0.5 rounded">develop</code> branch contains the latest commits, newest indicators, bleeding-edge hyperopt features, and immediate bug fixes before official release tags.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">⚡</span>
                <span>Newest technical indicators & features</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">⚡</span>
                <span>Experimental hyperopt loss functions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400">!</span>
                <span>May occasionally receive fast-moving commits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Branch Command Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">Clone & Checkout ({currentBranch})</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(gitCloneSnippet, 'clone')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-800 rounded transition-colors"
              >
                {copiedIndex === 'clone' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy commands</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onOpenTerminal(`git clone https://github.com/freqtrade/freqtrade.git && cd freqtrade && git checkout ${currentBranch}`)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Run in CLI</span>
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs font-mono text-cyan-400 bg-slate-950 overflow-x-auto leading-relaxed">
            {gitCloneSnippet}
          </pre>
        </div>
      </div>

      {/* Step 3: Installation Pipelines */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Step 3: Dependencies & Environment Installation ({currentBranch.toUpperCase()})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose between automated installer script, Docker container, or manual virtualenv.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setInstallMethod('script')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                installMethod === 'script' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Native (setup.sh)
            </button>
            <button
              onClick={() => setInstallMethod('powershell')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                installMethod === 'powershell' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Windows (setup.ps1)
            </button>
            <button
              onClick={() => setInstallMethod('docker')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                installMethod === 'docker' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Docker Compose
            </button>
            <button
              onClick={() => setInstallMethod('venv')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                installMethod === 'venv' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Manual Venv
            </button>
            <button
              onClick={() => setInstallMethod('talib')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                installMethod === 'talib' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              TA-Lib Fixes
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {installMethod === 'script' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Interactive Setup Script (`./setup.sh -i`)</h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    --install from scratch
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  The official installer. It verifies Python 3.11+, detects or builds native C TA-Lib, bootstraps <code className="text-slate-300 font-mono">.env/</code>, and installs Freqtrade in editable mode (<code className="text-slate-300 font-mono">pip install -e .</code>).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(scriptCommands, 'script')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                >
                  {copiedIndex === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => onOpenTerminal('./setup.sh -i')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Run ./setup.sh -i</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800/80">
              {scriptCommands}
            </pre>

            {/* Interactive Questions Simulator during ./setup.sh -i */}
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/60 space-y-3">
              <span className="text-xs font-semibold text-slate-300 font-sans block">
                Prompts Encountered During `./setup.sh -i`:
              </span>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400">? Do you want to install dependencies for plotting?</span>
                    <span className="text-slate-500 block text-[11px] font-sans">Installs Plotly for candlestick visualization charts.</span>
                  </div>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-slate-950 rounded border border-slate-800 shrink-0">
                    y (Recommended)
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400">? Do you want to install dependencies for hyperopt?</span>
                    <span className="text-slate-500 block text-[11px] font-sans">Installs scipy & scikit-optimize for genetic strategy tuning.</span>
                  </div>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-slate-950 rounded border border-slate-800 shrink-0">
                    y (Recommended)
                  </span>
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400">? Do you want to install FreqUI (Web UI)?</span>
                    <span className="text-slate-500 block text-[11px] font-sans">Downloads latest pre-built web dashboard files into Freqtrade.</span>
                  </div>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 bg-slate-950 rounded border border-slate-800 shrink-0">
                    Y (Recommended)
                  </span>
                </div>
              </div>
            </div>

            {/* Flag Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-cyan-400 font-bold">./setup.sh -i</span>
                <p className="text-slate-400 font-sans text-[11px] mt-0.5">--install from scratch (builds TA-Lib & venv)</p>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-emerald-400 font-bold">./setup.sh -u</span>
                <p className="text-slate-400 font-sans text-[11px] mt-0.5">--update existing dependencies & submodules</p>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/60">
                <span className="text-purple-400 font-bold">./setup.sh -r</span>
                <p className="text-slate-400 font-sans text-[11px] mt-0.5">--reinstall (clean recreate of .env/)</p>
              </div>
            </div>
          </div>
        )}

        {installMethod === 'powershell' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white">Windows PowerShell Installer (`.\setup.ps1`)</h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Windows Native
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Official Windows installer. Handles the PowerShell execution policy, installs pre-compiled TA-Lib wheel (<code className="text-slate-300 font-mono">.whl</code>), bootstraps <code className="text-slate-300 font-mono">.venv\</code>, and installs all trading libraries.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(powershellSnippet, 'ps_code')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                >
                  {copiedIndex === 'ps_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => onOpenTerminal('Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process && . .\\setup.ps1')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-blue-400 hover:bg-blue-300 rounded shadow-sm transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Run in PowerShell</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-blue-400 overflow-x-auto leading-relaxed border border-slate-800/80">
              {powershellSnippet}
            </pre>

            {/* Windows Specific Nuances */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60 space-y-1">
                <strong className="text-white block font-sans">Why `Set-ExecutionPolicy Bypass`?</strong>
                <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                  Windows PowerShell defaults to <code className="text-slate-300 font-mono">Restricted</code>, preventing all <code className="text-slate-300 font-mono">.ps1</code> scripts from running. Bypassing the policy for the process scope unlocks the installer safely without affecting the rest of the OS.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60 space-y-1">
                <strong className="text-white block font-sans">No MSVC Visual Studio Required:</strong>
                <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
                  <code className="text-slate-300 font-mono">setup.ps1</code> automatically downloads pre-built binary wheels for TA-Lib tailored for your installed Python version, saving you from a multi-gigabyte Visual Studio C++ build tools installation.
                </p>
              </div>
            </div>
          </div>
        )}

        {installMethod === 'docker' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Docker / Docker Compose (Zero Dependency Hell)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Best for non-Linux hosts, cloud VPS, or users who do not want to install C compilers or TA-Lib manually.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(dockerSnippet, 'docker')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
              >
                {copiedIndex === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed border border-slate-800/80">
              {dockerSnippet}
            </pre>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="text-cyan-400">●</span>
              <span>Images are continuously built by GitHub Actions for branch: <strong className="text-white font-mono">{currentBranch}</strong></span>
            </div>
          </div>
        )}

        {installMethod === 'venv' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Standard Python Virtualenv (pip install -e .)</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Installs Freqtrade in editable mode (<code className="text-slate-300 font-mono">-e</code>) so any changes in the repository are immediately reflected.
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(venvCommands, 'venv')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
              >
                {copiedIndex === 'venv' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed border border-slate-800/80">
              {venvCommands}
            </pre>
          </div>
        )}

        {installMethod === 'talib' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">TA-Lib Compilation & Installation Troubleshooting</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  TA-Lib is a C-library required for technical analysis. If <code className="text-slate-300 font-mono">pip install ta-lib</code> fails with missing headers, build from source:
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(talibGuide, 'talib')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
              >
                {copiedIndex === 'talib' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-amber-300 overflow-x-auto leading-relaxed border border-slate-800/80">
              {talibGuide}
            </pre>
          </div>
        )}
      </div>

      {/* Step 4: Virtualenv Activation & Userdir Bootstrap */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
              4
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans">
                  Step 4: Activate Environment & Bootstrap Userdir
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Full Feature Suite (Yes to All)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Activate the virtual environment, scaffold <code className="text-slate-300 font-mono">user_data/</code> directories, and generate <code className="text-slate-300 font-mono">config.json</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(`# 1. Activate virtual environment
source ./.venv/bin/activate  # (or source .env/bin/activate)

# 2. Verify installation
freqtrade --version

# 3. Create user data directories
freqtrade create-userdir --userdir user_data

# 4. Generate bot configuration
freqtrade new-config --config user_data/config.json`, 'step4')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
            >
              {copiedIndex === 'step4' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
            <button
              onClick={() => onOpenTerminal('source ./.venv/bin/activate && freqtrade create-userdir --userdir user_data')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Bootstrap in CLI</span>
            </button>
          </div>
        </div>

        {/* Feature status badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold">
              ✓
            </div>
            <div>
              <span className="font-semibold text-white block">Plotting Suite Active</span>
              <span className="text-[11px] text-slate-400">Plotly & Kaleido candlestick charts</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
              ✓
            </div>
            <div>
              <span className="font-semibold text-white block">Hyperopt Optimizer Active</span>
              <span className="text-[11px] text-slate-400">Scipy genetic parameter tuning</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-bold">
              ✓
            </div>
            <div>
              <span className="font-semibold text-white block">FreqUI Web Dashboard Active</span>
              <span className="text-[11px] text-slate-400">Ready at port 8080 with JWT</span>
            </div>
          </div>
        </div>

        {/* Step 4 Command Block */}
        <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800/80">
{`# 1. Activate isolated Python virtual environment
source ./.venv/bin/activate  # Windows: . .\\.venv\\Scripts\\Activate.ps1

# 2. Check Freqtrade binary & installed modules
freqtrade --version

# 3. Create user data directories (strategies, data, hyperopts, plot, logs)
freqtrade create-userdir --userdir user_data

# 4. Generate default config.json
freqtrade new-config --config user_data/config.json`}
        </pre>

        {/* Breakdown of Step 4A and 4B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-[11px] font-mono">
                A
              </span>
              <span className="font-semibold text-white font-mono">freqtrade create-userdir</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              Scaffolds the standardized user directory tree and copies the reference <code className="text-slate-200 font-mono">sample_strategy.py</code> into <code className="text-slate-200 font-mono">user_data/strategies/</code> so you can start trading immediately.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/60 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[11px] font-mono">
                B
              </span>
              <span className="font-semibold text-white font-mono">freqtrade new-config</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans text-[11px]">
              Interactive CLI questionnaire setting up your exchange CCXT adapter, stake amount, trading mode (Spot/Futures), and FreqUI API webserver on port 8080.
            </p>
          </div>
        </div>
      </div>

      {/* Step 5: Install Community Strategies (freqtrade-strategies) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
              5
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-sans">
                  Step 5: Install Community Strategies (`freqtrade-strategies`)
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Optional Repository
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download 100+ community-built algorithmic strategies directly from <code className="text-purple-300 font-mono">github.com/freqtrade/freqtrade-strategies</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(`# 1. Clone the community repository into your user_data/strategies folder
git clone https://github.com/freqtrade/freqtrade-strategies.git user_data/strategies/community

# 2. Copy the flagship strategy into active strategies
cp user_data/strategies/community/user_data/strategies/berlinguyinca/CombinedBinHAndCluc.py user_data/strategies/
cp user_data/strategies/community/user_data/strategies/iterativ/NostalgiaForInfinityX.py user_data/strategies/

# 3. Install common indicator dependencies used by community strategies
pip install technical finta pandas-ta

# 4. List all installed strategies
freqtrade list-strategies`, 'step5')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
            >
              {copiedIndex === 'step5' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
            <button
              onClick={() => onOpenTerminal('git clone https://github.com/freqtrade/freqtrade-strategies.git user_data/strategies/community')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded shadow-sm transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Clone in CLI</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 rounded-lg text-xs font-mono text-purple-300 overflow-x-auto leading-relaxed border border-slate-800/80">
{`# 1. Clone official community strategies
git clone https://github.com/freqtrade/freqtrade-strategies.git user_data/strategies/community

# 2. Copy desired community strategies into active directory
cp user_data/strategies/community/user_data/strategies/iterativ/NostalgiaForInfinityX.py user_data/strategies/
cp user_data/strategies/community/user_data/strategies/berlinguyinca/CombinedBinHAndCluc.py user_data/strategies/

# 3. Install indicator extensions (technical, finta, pandas-ta)
pip install technical finta pandas-ta

# 4. Verify Freqtrade loads the new strategies
freqtrade list-strategies`}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <span className="font-semibold text-white font-mono block">NostalgiaForInfinityX</span>
            <span className="text-[11px] text-slate-400 font-sans">Multi-tier EMA dips, DCA, and crash protections.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <span className="font-semibold text-white font-mono block">CombinedBinHAndCluc</span>
            <span className="text-[11px] text-slate-400 font-sans">Bollinger volume breakouts & Cluc SMA mean reversion.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <span className="font-semibold text-white font-mono block">SMAOffsetProtectOptV1</span>
            <span className="text-[11px] text-slate-400 font-sans">Offset moving average dips with volatility guards.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/60">
            <span className="font-semibold text-white font-mono block">ElliotV8</span>
            <span className="text-[11px] text-slate-400 font-sans">Elliott Wave Oscillator swing momentum.</span>
          </div>
        </div>
      </div>

      {/* Directory Structure & Workflow */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-semibold text-white font-sans mb-4">
          Freqtrade Canonical Directory Hierarchy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-emerald-400 font-semibold">user_data/strategies/</span>
            <p className="text-slate-400 mt-1 font-sans">
              Contains your Python trading strategies (<code className="text-slate-300 font-mono">*.py</code>) inheriting from <code className="text-slate-300 font-mono">IStrategy</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-cyan-400 font-semibold">user_data/data/</span>
            <p className="text-slate-400 mt-1 font-sans">
              Downloaded OHLCV candlestick historical data per exchange (e.g. <code className="text-slate-300 font-mono">binance/BTC_USDT-5m.feather</code>).
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80">
            <span className="text-purple-400 font-semibold">user_data/backtest_results/</span>
            <p className="text-slate-400 mt-1 font-sans">
              Backtesting outcome JSON files, trade logs, and hyperopt parameter caches.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
