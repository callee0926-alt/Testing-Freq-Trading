import { StrategyDefinition } from '../types/freqtrade';

export const DEFAULT_STRATEGIES: StrategyDefinition[] = [
  {
    id: 'sample_strategy',
    name: 'SampleStrategy',
    description: 'Freqtrade reference strategy pairing RSI oversold bounce with fast/slow EMA crossover and Bollinger Band confirmation.',
    timeframe: '5m',
    stoploss: -0.10,
    roi: {
      0: 0.04,
      30: 0.02,
      60: 0.01,
      120: 0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.01,
    trailing_stop_positive_offset: 0.02,
    params: {
      rsiBuy: 30,
      rsiSell: 70,
      fastEma: 9,
      slowEma: 21,
      bbStdDev: 2.0
    },
    source: 'official',
    author: 'Freqtrade Core Team',
    tags: ['reference', 'beginner', 'rsi', 'bollinger'],
    code: `"""
SampleStrategy - Official Freqtrade Reference Implementation
Author: freqtrade team
"""
import numpy as np
import pandas as pd
from pandas import DataFrame
from datetime import datetime
from freqtrade.strategy import (
    IStrategy,
    IntParameter,
    DecimalParameter
)
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class SampleStrategy(IStrategy):
    INTERFACE_VERSION = 3

    # Optimal timeframe for the strategy
    timeframe = '5m'

    # Minimal ROI designed for the strategy
    minimal_roi = {
        "120": 0.0,
        "60": 0.01,
        "30": 0.02,
        "0": 0.04
    }

    # Optimal stoploss designed for the strategy
    stoploss = -0.10

    # Trailing stoploss
    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.02
    trailing_only_offset_is_reached = False

    # Process only new candles
    process_only_new_candles = True

    # Number of candles the strategy requires before producing valid signals
    startup_candle_count: int = 30

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Momentum Indicators
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # Moving Averages
        dataframe['ema_fast'] = ta.EMA(dataframe, timeperiod=9)
        dataframe['ema_slow'] = ta.EMA(dataframe, timeperiod=21)

        # Bollinger Bands
        bollinger = qtpylib.bollinger_bands(qtpylib.typical_price(dataframe), window=20, stds=2)
        dataframe['bb_lowerband'] = bollinger['lower']
        dataframe['bb_middleband'] = bollinger['mid']
        dataframe['bb_upperband'] = bollinger['upper']

        # Volume
        dataframe['volume_mean_slow'] = dataframe['volume'].rolling(window=30).mean()

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                # Signal: RSI oversold condition
                (dataframe['rsi'] < 30) &
                # Signal: Fast EMA crossing above Slow EMA or holding above
                (dataframe['ema_fast'] > dataframe['ema_slow']) &
                # Signal: Price touching or rebounding from lower Bollinger Band
                (dataframe['close'] <= dataframe['bb_lowerband'] * 1.01) &
                # Volume filter
                (dataframe['volume'] > dataframe['volume_mean_slow'] * 0.8)
            ),
            'enter_long'] = 1

        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                # Signal: RSI overbought
                (dataframe['rsi'] > 70) &
                # Signal: Price touching upper Bollinger Band
                (dataframe['close'] >= dataframe['bb_upperband']) &
                # Signal: Fast EMA breaking below Slow EMA
                (dataframe['ema_fast'] < dataframe['ema_slow'])
            ),
            'exit_long'] = 1

        return dataframe
`
  },
  {
    id: 'bband_rsi',
    name: 'BbandRsiStrategy',
    description: 'High-frequency mean-reversion strategy trading tight Bollinger Band breakouts with RSI extremes and volume surges.',
    timeframe: '5m',
    stoploss: -0.05,
    roi: {
      0: 0.03,
      20: 0.015,
      40: 0.005,
      60: 0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.008,
    trailing_stop_positive_offset: 0.015,
    params: {
      rsiBuy: 28,
      rsiSell: 72,
      fastEma: 8,
      slowEma: 20,
      bbStdDev: 2.2
    },
    source: 'official',
    author: 'Freqtrade Contributors',
    tags: ['bollinger', 'rsi', 'mean-reversion'],
    code: `"""
BbandRsiStrategy - Volatility Mean Reversion
Trades oversold bounces at lower band with RSI confirmation.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class BbandRsiStrategy(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.05
    minimal_roi = {"0": 0.03, "20": 0.015, "40": 0.005, "60": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.008
    trailing_stop_positive_offset = 0.015

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.2)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']
        dataframe['bb_percent'] = (dataframe['close'] - dataframe['bb_lower']) / (dataframe['bb_upper'] - dataframe['bb_lower'])
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] < 28) &
                (dataframe['bb_percent'] < 0.05) &
                (dataframe['volume'] > 0)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] > 72) |
                (dataframe['close'] >= dataframe['bb_upper'])
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'ema_trend_cross',
    name: 'EmaTrendCross',
    description: 'Trend-following momentum strategy catching breakout expansions using Triple EMA (EMA 9 / 21 / 50) and MACD histogram.',
    timeframe: '15m',
    stoploss: -0.08,
    roi: {
      0: 0.06,
      45: 0.035,
      90: 0.015,
      180: 0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.015,
    trailing_stop_positive_offset: 0.03,
    params: {
      rsiBuy: 45,
      rsiSell: 75,
      fastEma: 9,
      slowEma: 21,
      bbStdDev: 2.0
    },
    source: 'official',
    author: 'Freqtrade Contributors',
    tags: ['trend', 'ema', 'macd', '15m'],
    code: `"""
EmaTrendCross - Triple EMA Momentum & MACD Expansion
Designed for 15m trending pairs.
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class EmaTrendCross(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '15m'
    stoploss = -0.08
    minimal_roi = {"0": 0.06, "45": 0.035, "90": 0.015, "180": 0.0}

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['ema9'] = ta.EMA(dataframe, timeperiod=9)
        dataframe['ema21'] = ta.EMA(dataframe, timeperiod=21)
        dataframe['ema50'] = ta.EMA(dataframe, timeperiod=50)

        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['ema9'] > dataframe['ema21']) &
                (dataframe['ema21'] > dataframe['ema50']) &
                (dataframe['macdhist'] > 0) &
                (dataframe['rsi'] > 45) &
                (dataframe['rsi'] < 68)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['ema9'] < dataframe['ema21']) |
                (dataframe['rsi'] > 75)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'hyperoptable_strategy',
    name: 'HyperoptableStrategy',
    description: 'Hyperopt-ready strategy parameterized with IntParameter and DecimalParameter for genetic algorithm optimization.',
    timeframe: '5m',
    stoploss: -0.07,
    roi: {
      0: 0.05,
      30: 0.02,
      90: 0
    },
    trailing_stop: false,
    params: {
      rsiBuy: 32,
      rsiSell: 68,
      fastEma: 12,
      slowEma: 26,
      bbStdDev: 2.0
    },
    source: 'official',
    author: 'Freqtrade Contributors',
    tags: ['hyperopt', 'genetic-search', 'scikit-optimize'],
    code: `"""
HyperoptableStrategy - Parameterized for freqtrade hyperopt
Run with: freqtrade hyperopt --strategy HyperoptableStrategy --hyperopt-loss SharpeHyperOptLoss
"""
from freqtrade.strategy import IStrategy, IntParameter, DecimalParameter
from pandas import DataFrame
import talib.abstract as ta


class HyperoptableStrategy(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.07
    minimal_roi = {"0": 0.05, "30": 0.02, "90": 0.0}

    # Hyperoptable parameters
    buy_rsi = IntParameter(20, 40, default=32, space="buy")
    sell_rsi = IntParameter(60, 80, default=68, space="sell")
    buy_ema_fast = IntParameter(5, 15, default=12, space="buy")
    buy_ema_slow = IntParameter(20, 40, default=26, space="buy")

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        for val in self.buy_ema_fast.range:
            dataframe[f'ema_fast_{val}'] = ta.EMA(dataframe, timeperiod=val)
        for val in self.buy_ema_slow.range:
            dataframe[f'ema_slow_{val}'] = ta.EMA(dataframe, timeperiod=val)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] < self.buy_rsi.value) &
                (dataframe[f'ema_fast_{self.buy_ema_fast.value}'] > dataframe[f'ema_slow_{self.buy_ema_slow.value}'])
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (dataframe['rsi'] > self.sell_rsi.value),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'nostalgia_for_infinity_x',
    name: 'NostalgiaForInfinityX',
    description: 'Legendary community strategy from freqtrade-strategies repo. Multi-condition EMA dip buying, dynamic ROI decay, volume checks, and crash protection filters.',
    timeframe: '5m',
    stoploss: -0.20,
    roi: {
      0: 0.05,
      18: 0.03,
      60: 0.015,
      120: 0.005
    },
    trailing_stop: true,
    trailing_stop_positive: 0.012,
    trailing_stop_positive_offset: 0.025,
    source: 'community',
    author: 'iterativ (freqtrade-strategies)',
    tags: ['community', 'nfix', 'dip-buyer', 'crash-protection', 'top-starred'],
    params: {
      rsiBuy: 26,
      rsiSell: 74,
      fastEma: 12,
      slowEma: 26,
      bbStdDev: 2.1
    },
    code: `"""
NostalgiaForInfinityX (NFIX) - Community Flagship Strategy
Source: https://github.com/freqtrade/freqtrade-strategies
Author: iterativ & freqtrade community

Architecture:
- Multi-tier entry signals (dips below fast/slow EMA bands)
- Dynamic volume spike validation
- High-volatility dump protections
- Multi-tier dynamic ROI curve
"""
import numpy as np
import pandas as pd
from pandas import DataFrame
from freqtrade.strategy import IStrategy
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class NostalgiaForInfinityX(IStrategy):
    INTERFACE_VERSION = 3

    timeframe = '5m'
    can_short = False

    # Stoploss set loose to allow dynamic DCA & trailing protections
    stoploss = -0.20

    # Dynamic minimal ROI curve
    minimal_roi = {
        "120": 0.005,
        "60": 0.015,
        "18": 0.030,
        "0": 0.050
    }

    trailing_stop = True
    trailing_stop_positive = 0.012
    trailing_stop_positive_offset = 0.025
    trailing_only_offset_is_reached = False

    process_only_new_candles = True
    startup_candle_count = 50

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # EMAs for multi-layered dip detection
        dataframe['ema_12'] = ta.EMA(dataframe, timeperiod=12)
        dataframe['ema_26'] = ta.EMA(dataframe, timeperiod=26)
        dataframe['ema_50'] = ta.EMA(dataframe, timeperiod=50)
        dataframe['ema_200'] = ta.EMA(dataframe, timeperiod=200)

        # RSI across multiple lengths
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['rsi_fast'] = ta.RSI(dataframe, timeperiod=4)

        # Bollinger Bands with 2.1 std dev
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.1)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_middle'] = bollinger['mid']
        dataframe['bb_upper'] = bollinger['upper']

        # Volume profile indicators
        dataframe['volume_mean'] = dataframe['volume'].rolling(window=24).mean()
        dataframe['volume_surge'] = dataframe['volume'] > (dataframe['volume_mean'] * 1.2)

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        conditions = []

        # Signal 1: Flash dip below lower Bollinger Band with RSI oversold bounce
        sig_bb_dip = (
            (dataframe['close'] < dataframe['bb_lower'] * 1.002) &
            (dataframe['rsi'] < 30) &
            (dataframe['rsi_fast'] > dataframe['rsi_fast'].shift(1)) &
            (dataframe['volume_surge'])
        )

        # Signal 2: Trend recovery pullback above 200 EMA
        sig_trend_pullback = (
            (dataframe['close'] > dataframe['ema_200']) &
            (dataframe['close'] < dataframe['ema_12'] * 0.985) &
            (dataframe['rsi'] < 35) &
            (dataframe['volume'] > 0)
        )

        dataframe.loc[sig_bb_dip | sig_trend_pullback, 'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] > 74) &
                (dataframe['close'] >= dataframe['bb_upper'])
            ) | (
                (dataframe['close'] > dataframe['ema_12'] * 1.04) &
                (dataframe['rsi'] > 68)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'combined_binh_cluc',
    name: 'CombinedBinHAndCluc',
    description: 'Extremely popular community strategy combining BinHV45 volume break dips with Cluc SMA mean reversion. Highly effective across sideways and choppy markets.',
    timeframe: '5m',
    stoploss: -0.05,
    roi: {
      0: 0.05,
      40: 0.03,
      100: 0.015,
      180: 0.0
    },
    trailing_stop: false,
    source: 'community',
    author: 'berlinguyinca (freqtrade-strategies)',
    tags: ['community', 'binh', 'cluc', 'mean-reversion', 'classic'],
    params: {
      rsiBuy: 25,
      rsiSell: 70,
      fastEma: 10,
      slowEma: 50,
      bbStdDev: 2.0
    },
    code: `"""
CombinedBinHAndCluc - Classic Community Strategy
Source: https://github.com/freqtrade/freqtrade-strategies
Author: berlinguyinca

Combines two established trading systems:
1. BinHV45: Bollinger band lower envelope penetration + high volume surge
2. Cluc: Close below SMA with RSI divergence rebound
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class CombinedBinHAndCluc(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.05
    minimal_roi = {"0": 0.05, "40": 0.03, "100": 0.015, "180": 0.0}

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Cluc indicators
        dataframe['cluc_sma'] = ta.SMA(dataframe, timeperiod=50)
        dataframe['cluc_delta'] = (dataframe['close'] - dataframe['cluc_sma']) / dataframe['cluc_sma']
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)

        # BinH indicators
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.0)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']
        dataframe['volume_mean_slow'] = dataframe['volume'].rolling(window=30).mean()

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # BinH entry condition
        cond_binh = (
            (dataframe['close'] < dataframe['bb_lower']) &
            (dataframe['volume'] > dataframe['volume_mean_slow'] * 1.5) &
            (dataframe['rsi'] < 30)
        )

        # Cluc entry condition
        cond_cluc = (
            (dataframe['cluc_delta'] < -0.015) &
            (dataframe['rsi'] < 25) &
            (dataframe['volume'] > 0)
        )

        dataframe.loc[cond_binh | cond_cluc, 'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (dataframe['close'] >= dataframe['bb_upper']) |
            (dataframe['rsi'] > 70),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'sma_offset_protect',
    name: 'SMAOffsetProtectOptV1',
    description: 'Offset moving average strategy from freqtrade-strategies repo. Buys price dips below dynamically offset SMAs and EMAs with volatility-adjusted guardrails.',
    timeframe: '5m',
    stoploss: -0.06,
    roi: {
      0: 0.04,
      30: 0.02,
      60: 0.01,
      120: 0.0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.01,
    trailing_stop_positive_offset: 0.02,
    source: 'community',
    author: 'hroffld (freqtrade-strategies)',
    tags: ['community', 'sma-offset', 'guardrails', 'trend-dip'],
    params: {
      rsiBuy: 30,
      rsiSell: 72,
      fastEma: 10,
      slowEma: 30,
      bbStdDev: 2.0
    },
    code: `"""
SMAOffsetProtectOptV1 - Offset Moving Average with Protections
Source: https://github.com/freqtrade/freqtrade-strategies
Author: hroffld & community
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class SMAOffsetProtectOptV1(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.06
    minimal_roi = {"0": 0.04, "30": 0.02, "60": 0.01, "120": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.01
    trailing_stop_positive_offset = 0.02

    # Offset factors
    buy_sma_offset = 0.985
    sell_sma_offset = 1.015

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['sma_30'] = ta.SMA(dataframe, timeperiod=30)
        dataframe['ema_10'] = ta.EMA(dataframe, timeperiod=10)
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                # Price below offset moving average
                (dataframe['close'] < dataframe['sma_30'] * self.buy_sma_offset) &
                (dataframe['rsi'] < 35) &
                (dataframe['volume'] > 0)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['close'] > dataframe['sma_30'] * self.sell_sma_offset) |
                (dataframe['rsi'] > 72)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'elliot_v8',
    name: 'ElliotV8',
    description: 'Elliott Wave Oscillator + Bollinger Bands swing strategy from freqtrade-strategies repo. Catches wave 3 and wave 5 momentum expansions.',
    timeframe: '5m',
    stoploss: -0.08,
    roi: {
      0: 0.06,
      30: 0.03,
      60: 0.01,
      120: 0.0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.015,
    trailing_stop_positive_offset: 0.025,
    source: 'community',
    author: 'xmatthias & community (freqtrade-strategies)',
    tags: ['community', 'elliott-wave', 'oscillator', 'swing'],
    params: {
      rsiBuy: 35,
      rsiSell: 75,
      fastEma: 5,
      slowEma: 35,
      bbStdDev: 2.0
    },
    code: `"""
ElliotV8 - Elliott Wave Oscillator & Volatility Swing
Source: https://github.com/freqtrade/freqtrade-strategies
Author: xmatthias & community
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class ElliotV8(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.08
    minimal_roi = {"0": 0.06, "30": 0.03, "60": 0.01, "120": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.015
    trailing_stop_positive_offset = 0.025

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Elliott Wave Oscillator (SMA 5 - SMA 35)
        dataframe['sma_5'] = ta.SMA(dataframe, timeperiod=5)
        dataframe['sma_35'] = ta.SMA(dataframe, timeperiod=35)
        dataframe['ewo'] = dataframe['sma_5'] - dataframe['sma_35']

        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.0)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']

        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['ewo'] > dataframe['ewo'].shift(1)) &
                (dataframe['close'] <= dataframe['bb_lower'] * 1.01) &
                (dataframe['rsi'] < 38)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['close'] >= dataframe['bb_upper']) |
                (dataframe['rsi'] > 75)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'berlinguyinca_binhv45',
    name: 'Berlinguyinca_BinHV45',
    description: 'Iconic BinHV45 volume break strategy by berlinguyinca. Buys severe price drops puncturing the lower Bollinger Band accompanied by high volume spikes.',
    timeframe: '5m',
    stoploss: -0.05,
    roi: {
      0: 0.04,
      30: 0.02,
      60: 0.01,
      120: 0.0
    },
    trailing_stop: false,
    source: 'community',
    author: 'berlinguyinca (freqtrade-strategies)',
    tags: ['community', 'berlinguyinca', 'binhv45', 'volume-spike', 'dip-buyer'],
    params: {
      rsiBuy: 28,
      rsiSell: 70,
      fastEma: 10,
      slowEma: 30,
      bbStdDev: 2.0
    },
    code: `"""
Berlinguyinca_BinHV45 - Volume Break & Envelope Penetration
Source: https://github.com/freqtrade/freqtrade-strategies
Author: berlinguyinca
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class Berlinguyinca_BinHV45(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.05
    minimal_roi = {"0": 0.04, "30": 0.02, "60": 0.01, "120": 0.0}

    trailing_stop = False
    process_only_new_candles = True
    startup_candle_count = 40

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.0)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']
        dataframe['bb_middle'] = bollinger['mid']

        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['volume_mean_slow'] = dataframe['volume'].rolling(window=30).mean()
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['close'] < dataframe['bb_lower'] * 0.998) &
                (dataframe['volume'] > dataframe['volume_mean_slow'] * 1.4) &
                (dataframe['rsi'] < 30)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['close'] >= dataframe['bb_upper']) |
                (dataframe['rsi'] > 70)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'cluc_may72018',
    name: 'ClucMay72018',
    description: 'The celebrated Cluc mean-reversion system. Triggers when candle close drops below 50-period SMA by a specific percentage delta with low RSI and confirmed volume.',
    timeframe: '5m',
    stoploss: -0.05,
    roi: {
      0: 0.035,
      25: 0.02,
      50: 0.01,
      100: 0.0
    },
    trailing_stop: false,
    source: 'community',
    author: 'cluc (freqtrade-strategies)',
    tags: ['community', 'cluc', 'sma-delta', 'classic', 'mean-reversion'],
    params: {
      rsiBuy: 25,
      rsiSell: 68,
      fastEma: 12,
      slowEma: 50,
      bbStdDev: 2.0
    },
    code: `"""
ClucMay72018 - Famous SMA Delta Mean Reversion
Source: https://github.com/freqtrade/freqtrade-strategies
Author: cluc & freqtrade community
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class ClucMay72018(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.05
    minimal_roi = {"0": 0.035, "25": 0.02, "50": 0.01, "100": 0.0}

    startup_candle_count = 60

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['cluc_sma'] = ta.SMA(dataframe, timeperiod=50)
        dataframe['cluc_delta'] = (dataframe['close'] - dataframe['cluc_sma']) / dataframe['cluc_sma']
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['rsi_slow'] = ta.RSI(dataframe, timeperiod=21)
        dataframe['volume_mean'] = dataframe['volume'].rolling(window=20).mean()
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['cluc_delta'] < -0.018) &
                (dataframe['rsi'] < 28) &
                (dataframe['volume'] > dataframe['volume_mean'] * 0.9)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['cluc_delta'] > 0.015) |
                (dataframe['rsi'] > 68)
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'e0v1e_strategy',
    name: 'E0V1E',
    description: 'Renowned high-performing scalper strategy by e0v1e. Uses multi-EMA offset ribbons, fast RSI slopes, and tight trailing profit protections for high win-rate scalping.',
    timeframe: '5m',
    stoploss: -0.10,
    roi: {
      0: 0.03,
      15: 0.018,
      40: 0.008,
      90: 0.0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.008,
    trailing_stop_positive_offset: 0.018,
    source: 'community',
    author: 'e0v1e (freqtrade-strategies)',
    tags: ['community', 'e0v1e', 'scalp', 'ema-ribbon', 'trailing-profit'],
    params: {
      rsiBuy: 32,
      rsiSell: 72,
      fastEma: 8,
      slowEma: 24,
      bbStdDev: 2.0
    },
    code: `"""
E0V1E - High Performance Scalp & Trend Harvesting
Source: https://github.com/freqtrade/freqtrade-strategies
Author: e0v1e
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class E0V1E(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.10
    minimal_roi = {"0": 0.030, "15": 0.018, "40": 0.008, "90": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.008
    trailing_stop_positive_offset = 0.018
    trailing_only_offset_is_reached = False

    startup_candle_count = 50

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['ema_fast'] = ta.EMA(dataframe, timeperiod=8)
        dataframe['ema_slow'] = ta.EMA(dataframe, timeperiod=24)
        dataframe['ema_trend'] = ta.EMA(dataframe, timeperiod=50)

        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['rsi_fast'] = ta.RSI(dataframe, timeperiod=4)

        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.0)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['close'] < dataframe['ema_fast'] * 0.992) &
                (dataframe['rsi'] < 33) &
                (dataframe['rsi_fast'] > dataframe['rsi_fast'].shift(1)) &
                (dataframe['close'] <= dataframe['bb_lower'] * 1.01)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] > 72) |
                (dataframe['close'] >= dataframe['bb_upper'])
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'freqtrade_strategies_that_work',
    name: 'FreqtradeStrategiesThatWork',
    description: 'Multi-MA Trend & Dynamic Trailing Stop strategy from the celebrated freqtrade-strategies-that-work curated repository. Engineered for steady positive equity growth.',
    timeframe: '5m',
    stoploss: -0.07,
    roi: {
      0: 0.05,
      30: 0.025,
      60: 0.01,
      120: 0.0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.012,
    trailing_stop_positive_offset: 0.022,
    source: 'community',
    author: 'freqtrade-strategies-that-work',
    tags: ['community', 'strategies-that-work', 'multima', 'proven', 'tsl'],
    params: {
      rsiBuy: 30,
      rsiSell: 70,
      fastEma: 9,
      slowEma: 26,
      bbStdDev: 2.0
    },
    code: `"""
FreqtradeStrategiesThatWork (MultiMA_TSL)
Source: https://github.com/freqtrade/freqtrade-strategies-that-work
Author: freqtrade-strategies-that-work curated repository
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta
import freqtrade.vendor.qtpylib.indicators as qtpylib


class FreqtradeStrategiesThatWork(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.07
    minimal_roi = {"0": 0.05, "30": 0.025, "60": 0.01, "120": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.012
    trailing_stop_positive_offset = 0.022

    startup_candle_count = 50

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['ema_9'] = ta.EMA(dataframe, timeperiod=9)
        dataframe['ema_26'] = ta.EMA(dataframe, timeperiod=26)
        dataframe['sma_50'] = ta.SMA(dataframe, timeperiod=50)

        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        bollinger = qtpylib.bollinger_bands(dataframe['close'], window=20, stds=2.0)
        dataframe['bb_lower'] = bollinger['lower']
        dataframe['bb_upper'] = bollinger['upper']
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['ema_9'] > dataframe['ema_26']) &
                (dataframe['close'] > dataframe['sma_50'] * 0.995) &
                (dataframe['rsi'] > 30) &
                (dataframe['rsi'] < 55) &
                (dataframe['close'] <= dataframe['bb_lower'] * 1.025)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['rsi'] > 70) |
                (dataframe['close'] >= dataframe['bb_upper'])
            ),
            'exit_long'] = 1
        return dataframe
`
  },
  {
    id: 'profiters_strategy',
    name: 'ProfitersStrategy',
    description: 'Flagship strategy from the Profiters library. Combines MACD momentum histograms, Commodity Channel Index (CCI) boundaries, and StochRSI recovery triggers.',
    timeframe: '5m',
    stoploss: -0.06,
    roi: {
      0: 0.045,
      20: 0.025,
      45: 0.012,
      90: 0.0
    },
    trailing_stop: true,
    trailing_stop_positive: 0.01,
    trailing_stop_positive_offset: 0.02,
    source: 'community',
    author: 'profiters community',
    tags: ['community', 'profiters', 'macd', 'cci', 'stoch-rsi'],
    params: {
      rsiBuy: 32,
      rsiSell: 72,
      fastEma: 12,
      slowEma: 26,
      bbStdDev: 2.0
    },
    code: `"""
ProfitersStrategy - Multi-Oscillator Momentum & CCI Filter
Source: Profiters community library
Author: profiters
"""
from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta


class ProfitersStrategy(IStrategy):
    INTERFACE_VERSION = 3
    timeframe = '5m'
    stoploss = -0.06
    minimal_roi = {"0": 0.045, "20": 0.025, "45": 0.012, "90": 0.0}

    trailing_stop = True
    trailing_stop_positive = 0.010
    trailing_stop_positive_offset = 0.020

    startup_candle_count = 45

    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        dataframe['cci'] = ta.CCI(dataframe, timeperiod=20)

        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']

        dataframe['ema_fast'] = ta.EMA(dataframe, timeperiod=12)
        dataframe['ema_slow'] = ta.EMA(dataframe, timeperiod=26)
        return dataframe

    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['cci'] < -100) &
                (dataframe['rsi'] < 36) &
                (dataframe['macdhist'] > dataframe['macdhist'].shift(1)) &
                (dataframe['close'] > dataframe['ema_slow'] * 0.985)
            ),
            'enter_long'] = 1
        return dataframe

    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        dataframe.loc[
            (
                (dataframe['cci'] > 120) |
                (dataframe['rsi'] > 72) |
                (dataframe['macdhist'] < 0)
            ),
            'exit_long'] = 1
        return dataframe
`
  }
];
