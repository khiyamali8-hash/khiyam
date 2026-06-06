/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrderBlock {
  type: 'Bullish' | 'Bearish';
  range: string;
  priceApproaching: 'Approaching' | 'Inside' | 'Away';
  mitigated: boolean;
  details: string;
}

export interface FairValueGap {
  type: 'Bullish' | 'Bearish' | 'Inverse';
  range: string;
  likelyToFill: boolean;
  details: string;
}

export interface LiquidityPool {
  type: 'Buy Side (BSL)' | 'Sell Side (SSL)' | 'PDH' | 'PDL' | 'PWH' | 'PWL' | 'Other';
  location: string;
  swept: boolean;
  details: string;
}

export interface SupportResistanceLevel {
  type: 'Support' | 'Resistance' | 'Trendline';
  level: string;
  details: string;
}

export interface DemandSupplyZone {
  type: 'Demand' | 'Supply';
  range: string;
  status: string; // tested, broken, untouched
  details: string;
}

export interface ICTAnalysis {
  timeframe: string;
  imageUrl: string;
  timestamp: string;

  // Step 1
  marketStructure: {
    trend: 'Bullish' | 'Bearish' | 'Ranging';
    highsAndLows: string[];
    bosOccurred: boolean;
    bosLocation: string;
    chochOccurred: boolean;
    chochLevel: string;
    cisdFormed: boolean;
    cisdOpposingCandle: string;
    bias: 'Bullish' | 'Bearish' | 'Neutral';
  };

  // Step 2
  premiumDiscount: {
    swingHigh: string;
    swingLow: string;
    equilibriumPrice: string;
    priceZone: 'Premium' | 'Discount' | 'Equilibrium';
    goodToTrade: boolean;
    tradeLocationComment: string;
  };

  // Step 3
  orderBlocks: OrderBlock[];

  // Step 4
  fairValueGaps: FairValueGap[];

  // Step 5
  liquidity: {
    pools: LiquidityPool[];
    nextSweepTarget: string;
    details: string;
  };

  // Step 6
  supportResistance: {
    levels: SupportResistanceLevel[];
    details: string;
  };

  // Step 7
  emaAnalysis: {
    emasDetected: string[];
    dynamicLevels: string;
    alignmentWithBias: boolean;
    details: string;
  };

  // Step 8
  demandSupply: DemandSupplyZone[];

  // Step 9
  entrySetup: {
    direction: 'BUY' | 'SELL' | 'NO TRADE';
    entryZone: string;
    confirmation: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    riskRewardRatio: string;
    score: number; // 1-10 string or number
    details: string;
  };

  // Step 10
  finalSummary: {
    bias: 'Bullish' | 'Bearish' | 'Neutral';
    bestEntryZone: string;
    stopLoss: string;
    target1: string;
    target2: string;
    keyLevelToWatch: string;
    score: number; // out of 10
    recommendation: string;
  };
}

export interface SavedAnalysis {
  id: string;
  title: string;
  timestamp: string;
  image: string;
  analysis: ICTAnalysis;
}
