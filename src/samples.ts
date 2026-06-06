/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PresetCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PresetAnnotation {
  type: 'line' | 'box' | 'text';
  color: string;
  label: string;
  // Box coordinates
  x1?: number; // Candle index 1 (0-based)
  x2?: number; // Candle index 2
  y1?: number; // Price 1
  y2?: number; // Price 2
  // Line coordinates
  y?: number; // Flat price level
}

export interface ScenarioPreset {
  id: string;
  name: string;
  symbol: string;
  timeframe: string;
  description: string;
  trend: 'Bullish' | 'Bearish' | 'Ranging';
  candles: PresetCandle[];
  annotations: PresetAnnotation[];
  emas: {
    period: number;
    color: string;
    line: number[]; // EMA values corresponding to candles
  }[];
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'eur_usd_reversal',
    name: 'EUR/USD Bullish CHOCH Reversal',
    symbol: 'EUR/USD',
    timeframe: '15M (M15)',
    description: 'A classic smart money shift: descending price sweeps a key low, breaks structure up with powerful displacement (CHOCH), and leaves a clear Bullish FVG in the discount zone.',
    trend: 'Bullish',
    candles: [
      // Downwards trend
      { open: 1.0925, high: 1.0928, low: 1.0910, close: 1.0912 },
      { open: 1.0912, high: 1.0918, low: 1.0905, close: 1.0908 },
      { open: 1.0908, high: 1.0915, low: 1.0898, close: 1.0902 },
      { open: 1.0902, high: 1.0912, low: 1.0895, close: 1.0896 },
      // Consolidating
      { open: 1.0896, high: 1.0904, low: 1.0890, close: 1.0899 },
      { open: 1.0899, high: 1.0905, low: 1.0892, close: 1.0894 },
      // Sweep Lows (liquidity hunt)
      { open: 1.0894, high: 1.0898, low: 1.0875, close: 1.0888 }, // Deep wick sweep SSL
      { open: 1.0888, high: 1.0910, low: 1.0885, close: 1.0906 }, // Strong reversal candle
      // Displacement upwards (CHOCH)
      { open: 1.0906, high: 1.0928, low: 1.0902, close: 1.0922 }, // displacement candle 1 (creates FVG)
      { open: 1.0922, high: 1.0938, low: 1.0920, close: 1.0934 }, // displacement candle 2
      { open: 1.0934, high: 1.0945, low: 1.0930, close: 1.0942 }, // CHOCH complete, breaks structure high
      // Pause / Micro pullback
      { open: 1.0942, high: 1.0944, low: 1.0932, close: 1.0936 },
      { open: 1.0936, high: 1.0939, low: 1.0918, close: 1.0924 }, // Pulling back deep towards FVG
      { open: 1.0924, high: 1.0930, low: 1.0915, close: 1.0926 }, // Tests FVG, recovers
      // Higher high continuation (BOS)
      { open: 1.0926, high: 1.0942, low: 1.0922, close: 1.0941 },
      { open: 1.0941, high: 1.0955, low: 1.0938, close: 1.0951 },
      { open: 1.0951, high: 1.0964, low: 1.0948, close: 1.0961 }, // BOS
      { open: 1.0961, high: 1.0965, low: 1.0952, close: 1.0955 },
      { open: 1.0955, high: 1.0962, low: 1.0948, close: 1.0950 },
      { open: 1.0950, high: 1.0968, low: 1.0945, close: 1.0966 }
    ],
    annotations: [
      { type: 'line', color: '#EF4444', label: 'Previous Resistance / CHOCH Trigger', y: 1.0928 },
      { type: 'line', color: '#10B981', label: 'Sell-Side Liquidity Swept', y: 1.0880 },
      { type: 'box', color: 'rgba(59, 130, 246, 0.25)', label: 'Bullish FVG (Gap candle 1-3)', x1: 7, x2: 9, y1: 1.0888, y2: 1.0920 },
      { type: 'box', color: 'rgba(16, 185, 129, 0.2)', label: 'Unmitigated Reversal Order Block', x1: 6, x2: 7, y1: 1.0875, y2: 1.0894 }
    ],
    emas: [
      { period: 20, color: '#3B82F6', line: [1.0920, 1.0918, 1.0914, 1.0910, 1.0906, 1.0903, 1.0900, 1.0898, 1.0902, 1.0908, 1.0914, 1.0918, 1.0920, 1.0921, 1.0924, 1.0929, 1.0935, 1.0940, 1.0943, 1.0947] }
    ]
  },
  {
    id: 'btc_usdt_bearish',
    name: 'BTC/USDT Bearish Mitigation & FVG Fill',
    symbol: 'BTC/USDT',
    timeframe: '4H (H4)',
    description: 'Price rallies into a premium Supply Zone / Bearish Order Block and experiences heavy rejection. A rapid cascade down breaks structure, creating multiple Bearish FVGs and drawing towards equal sell-side lows.',
    trend: 'Bearish',
    candles: [
      // Rallying up
      { open: 66500, high: 66900, low: 66400, close: 66800 },
      { open: 66800, high: 67250, low: 66700, close: 67150 },
      { open: 67150, high: 67800, low: 67100, close: 67700 },
      { open: 67700, high: 68100, low: 67600, close: 67950 },
      // Premium peaks - Bearish Order Block
      { open: 67950, high: 68450, low: 67900, close: 68350 }, // Last green candle
      { open: 68350, high: 68500, low: 67400, close: 67500 }, // Huge red rejection candle
      // Pullback/retest block
      { open: 67500, high: 68100, low: 67300, close: 67980 }, // Tests block, gets rejected
      { open: 67980, high: 68050, low: 67100, close: 67200 }, // Breakdown starts
      // Massive drop (displacements)
      { open: 67200, high: 67280, low: 65800, close: 65900 }, // Creates huge Bearish FVG
      { open: 65900, high: 66100, low: 64900, close: 65100 }, // Breaks low structure (BOS)
      { open: 65100, high: 65350, low: 64700, close: 65200 }, // Hammer support test
      // Weak corrective bounce (retests FVG)
      { open: 65200, high: 66050, low: 65100, close: 65950 }, // Corrects into Bearish FVG, fails
      { open: 65950, high: 66000, low: 64800, close: 64900 }, // Rejection continues
      // Continuation down
      { open: 64900, high: 65100, low: 63900, close: 64100 },
      { open: 64100, high: 64450, low: 63500, close: 63650 },
      { open: 63650, high: 63850, low: 62200, close: 62450 }, // Sweeps resting lows
      { open: 62450, high: 63200, low: 62100, close: 63050 },
      { open: 63050, high: 63100, low: 62600, close: 62700 }
    ],
    annotations: [
      { type: 'box', color: 'rgba(239, 68, 68, 0.25)', label: 'Bearish Supply / Mitigation Block', x1: 4, x2: 5, y1: 67900, y2: 68500 },
      { type: 'box', color: 'rgba(239, 68, 68, 0.18)', label: 'Bearish FVG (Imbalance)', x1: 7, x2: 9, y1: 65900, y2: 67200 },
      { type: 'line', color: '#3B82F6', label: '50% Range Equilibrium (65,300)', y: 65300 },
      { type: 'line', color: '#EF4444', label: 'Equal Lows (Sell Side Liquidity Target)', y: 62300 }
    ],
    emas: [
      { period: 50, color: '#F59E0B', line: [66200, 66320, 66490, 66680, 66880, 66950, 67010, 67020, 66890, 66650, 66400, 66250, 66050, 65800, 65550, 65200, 64900, 64650] }
    ]
  },
  {
    id: 'eth_usd_range',
    name: 'ETH/USD Range Play & Liquidity Sweeps',
    symbol: 'ETH/USD',
    timeframe: '1H (H1)',
    description: 'Price is caught in a rigid horizontal trading range. It performs a classic liquidity grab by wicking above equal highs (BSL) of the range, trapping breakout traders, and immediately returning to sweep equal lows (SSL).',
    trend: 'Ranging',
    candles: [
      // Within range
      { open: 3450, high: 3470, low: 3435, close: 3465 },
      { open: 3465, high: 3490, low: 3455, close: 3480 },
      { open: 3480, high: 3485, low: 3420, close: 3430 },
      { open: 3430, high: 3450, low: 3410, close: 3425 },
      { open: 3425, high: 3460, low: 3420, close: 3455 },
      { open: 3455, high: 3485, low: 3450, close: 3475 },
      // Approaching High Range (BSL)
      { open: 3475, high: 3510, low: 3470, close: 3505 }, // Touches EQH
      { open: 3505, high: 3535, low: 3495, close: 3525 }, // Breakthrough attempt
      { open: 3525, high: 3550, low: 3500, close: 3510 }, // Sweep Highs wick, closes back inside range!
      { open: 3510, high: 3515, low: 3440, close: 3450 }, // Massive bearish engulfing
      // Falling to low range
      { open: 3450, high: 3465, low: 3415, close: 3420 },
      { open: 3420, high: 3435, low: 3390, close: 3400 }, // Approaching equal lows
      { open: 3400, high: 3415, low: 3360, close: 3385 }, // Sweeping Equal Lows (SSL)
      { open: 3385, high: 3445, low: 3350, close: 3430 }, // Deep wick, high volume bounce
      // Moving back to equilibrium
      { open: 3430, high: 3460, low: 3425, close: 3448 },
      { open: 3448, high: 3465, low: 3438, close: 3455 },
      { open: 3455, high: 3462, low: 3445, close: 3451 }
    ],
    annotations: [
      { type: 'line', color: '#10B981', label: 'Range High / BSL (3,510) - Swept!', y: 3510 },
      { type: 'line', color: '#EF4444', label: 'Range Low / SSL (3,400) - Swept!', y: 3400 },
      { type: 'line', color: '#94A3B8', label: 'Mean Equilibrium (3,455)', y: 3455 }
    ],
    emas: []
  },
  {
    id: 'xau_usd_gold',
    name: 'XAU/USD Gold Judas Swing & NY Reversal',
    symbol: 'XAU/USD',
    timeframe: '5M (M5)',
    description: 'Gold sweeps Asian Session highs during London (Judas Swing) to engineer liquidity, then breaks sharply downward into a H4 Discount Bullish Order Block before an explosive New York reversal back above key targets.',
    trend: 'Bullish',
    candles: [
      { open: 2320.5, high: 2321.8, low: 2319.4, close: 2320.1 },
      { open: 2320.1, high: 2322.2, low: 2319.8, close: 2321.3 },
      { open: 2321.3, high: 2323.5, low: 2320.7, close: 2322.9 },
      { open: 2322.9, high: 2324.0, low: 2322.1, close: 2323.4 },
      // Judas Swing high sweep
      { open: 2323.4, high: 2328.6, low: 2323.0, close: 2327.9 },
      { open: 2327.9, high: 2329.5, low: 2325.2, close: 2325.8 },
      // Correction down towards daily buyer pool
      { open: 2325.8, high: 2326.4, low: 2316.5, close: 2317.2 },
      { open: 2317.2, high: 2318.0, low: 2311.2, close: 2312.5 },
      { open: 2312.5, high: 2314.1, low: 2307.8, close: 2308.5 },
      { open: 2308.5, high: 2309.2, low: 2304.5, close: 2305.2 },
      // Reversal upChoch
      { open: 2305.2, high: 2312.4, low: 2304.1, close: 2311.9 },
      { open: 2311.9, high: 2318.5, low: 2311.0, close: 2317.8 },
      { open: 2317.8, high: 2322.2, low: 2316.5, close: 2321.4 },
      // Pullback into FVG
      { open: 2321.4, high: 2321.9, low: 2313.2, close: 2314.8 },
      { open: 2314.8, high: 2316.4, low: 2312.8, close: 2315.9 },
      // Continuation
      { open: 2315.9, high: 2324.5, low: 2315.0, close: 2323.8 },
      { open: 2323.8, high: 2329.4, low: 2323.1, close: 2328.7 },
      { open: 2328.7, high: 2334.2, low: 2328.0, close: 2333.1 },
      { open: 2333.1, high: 2335.0, low: 2331.2, close: 2332.4 },
      { open: 2332.4, high: 2334.8, low: 2330.5, close: 2333.9 }
    ],
    annotations: [
      { type: 'line', color: '#F59E0B', label: 'Asian Session High (2324.0) - Swept!', y: 2324.0 },
      { type: 'line', color: '#EF4444', label: 'Key Daily Liquidity Low (2309.0)', y: 2309.0 },
      { type: 'box', color: 'rgba(16, 185, 129, 0.22)', label: 'H4 Unmitigated buyer Block', x1: 8, x2: 10, y1: 2304.0, y2: 2309.5 },
      { type: 'box', color: 'rgba(59, 130, 246, 0.22)', label: 'Bullish FVG (Gap candle 11-13)', x1: 10, x2: 12, y1: 2311.9, y2: 2317.8 }
    ],
    emas: [
      { period: 20, color: '#3B82F6', line: [2320.5, 2321.0, 2321.5, 2322.0, 2323.5, 2324.5, 2323.0, 2321.0, 2318.0, 2314.0, 2312.0, 2313.5, 2316.0, 2315.5, 2315.8, 2318.0, 2321.0, 2324.0, 2326.5, 2328.0] }
    ]
  }
];
