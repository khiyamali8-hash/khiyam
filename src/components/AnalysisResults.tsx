/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, BarChart2, CheckCircle2, AlertTriangle, 
  Target, Shield, HelpCircle, Layers, ArrowRight, Table, Copy, Download, BookOpen
} from 'lucide-react';
import { ICTAnalysis } from '../types';

interface AnalysisResultsProps {
  analysis: ICTAnalysis;
  onReset: () => void;
}

type TabType = 'checklist' | 'structure' | 'arrays' | 'liquidity' | 'confluences';

export default function AnalysisResults({ analysis, onReset }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('checklist');
  const [copiedText, setCopiedText] = useState(false);

  const getBiasColor = (bias: string) => {
    switch (bias?.toUpperCase()) {
      case 'BULLISH': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'BEARISH': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getDirectionBadge = (dir: string) => {
    switch (dir?.toUpperCase()) {
      case 'BUY': 
        return (
          <span className="flex items-center space-x-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">
            <TrendingUp className="h-3 w-3" />
            <span>LONG SETUP (BUY)</span>
          </span>
        );
      case 'SELL': 
        return (
          <span className="flex items-center space-x-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-400 uppercase tracking-widest leading-none">
            <TrendingDown className="h-3 w-3" />
            <span>SHORT SETUP (SELL)</span>
          </span>
        );
      default: 
        return (
          <span className="flex items-center space-x-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">
            <AlertTriangle className="h-3 w-3" />
            <span>NO TRADE ZONE</span>
          </span>
        );
    }
  };

  // Convert full analysis to Markdown for copy function
  const copyAsMarkdown = () => {
    const rawMarkdown = `### ICT SMART MONEY IMAGE ANALYSIS REPORT
---
**TIMEFRAME**: ${analysis.timeframe || 'Estimated'}
**BIAS DETECTED**: ${analysis.finalSummary.bias}
**TRADE DIRECTION**: ${analysis.entrySetup.direction}
**TRADE QUALITY SCORE**: ${analysis.finalSummary.score}/10
**RECOMMENDED ENTRY**: ${analysis.finalSummary.bestEntryZone}
**STOP LOSS**: ${analysis.finalSummary.stopLoss}
**TAKE PROFIT TARGETS**: T1: ${analysis.finalSummary.target1}, T2: ${analysis.finalSummary.target2}

#### 1. MARKET STRUCTURE ANALYSIS:
- Current Trend: ${analysis.marketStructure.trend}
- Structure Points: ${analysis.marketStructure.highsAndLows.join(', ')}
- Break of Structure (BOS): ${analysis.marketStructure.bosOccurred ? 'Yes, at ' + analysis.marketStructure.bosLocation : 'No'}
- Change of Character (CHOCH): ${analysis.marketStructure.chochOccurred ? 'Yes, at ' + analysis.marketStructure.chochLevel : 'No'}
- CISD oposisition Candle: ${analysis.marketStructure.cisdFormed ? 'Opposing Candle identified as ' + analysis.marketStructure.cisdOpposingCandle : 'Not Formed'}

#### 2. PREMIUM & DISCOUNT (Swing Range):
- Swing High: ${analysis.premiumDiscount.swingHigh} | Swing Low: ${analysis.premiumDiscount.swingLow}
- 50% Equilibrium: ${analysis.premiumDiscount.equilibriumPrice}
- Current Price Zone: ${analysis.premiumDiscount.priceZone}
- Comment: ${analysis.premiumDiscount.tradeLocationComment}

#### 3. ORDER BLOCKS:
${analysis.orderBlocks.map(ob => `- [${ob.type}] OB range ${ob.range} (Price: ${ob.priceApproaching}, Mitigated: ${ob.mitigated ? 'Yes' : 'No'}). Details: ${ob.details}`).join('\n')}

#### 4. FAIR VALUE GAPS:
${analysis.fairValueGaps.map(f => `- [${f.type}] FVG range ${f.range} (Likely fill: ${f.likelyToFill ? 'Yes' : 'No'}). Details: ${f.details}`).join('\n')}

#### 5. LIQUIDITY TARGETS:
${analysis.liquidity.pools.map(p => `- ${p.type} at ${p.location} (Swept: ${p.swept ? 'Yes' : 'No'}). Details: ${p.details}`).join('\n')}
- Next Target Sweep: ${analysis.liquidity.nextSweepTarget}

#### 6. EXECUTIVE RECOMMENDATION:
"${analysis.finalSummary.recommendation}"`;

    navigator.clipboard.writeText(rawMarkdown);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Pre-calculate count of confluences for checklist visual
  const computeConfluencesCount = () => {
    let count = 0;
    if (analysis.marketStructure.trend === 'Bullish' && analysis.entrySetup.direction === 'BUY') count++;
    if (analysis.marketStructure.trend === 'Bearish' && analysis.entrySetup.direction === 'SELL') count++;
    if (analysis.marketStructure.bosOccurred) count++;
    if (analysis.marketStructure.chochOccurred) count++;
    if (analysis.premiumDiscount.goodToTrade) count++;
    if (analysis.orderBlocks.some(ob => ob.priceApproaching === 'Inside' || ob.priceApproaching === 'Approaching')) count++;
    if (analysis.fairValueGaps.length > 0) count++;
    if (analysis.liquidity.pools.some(p => p.swept)) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Information & Scorecard */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0f172a]/70 p-6 glow-blue">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 bg-emerald-500/5 rounded-full blur-2xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-400/20">
                Timeframe: {analysis.timeframe || 'Detected'}
              </span>
              {getDirectionBadge(analysis.entrySetup.direction)}
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold leading-none ${getBiasColor(analysis.finalSummary.bias)}`}>
                Structure Bias: {analysis.finalSummary.bias}
              </span>
            </div>
            <h2 className="font-sans text-2xl font-bold tracking-tight text-white mt-1">Smart Money Confluence Report</h2>
            <p className="font-sans text-sm text-slate-400 leading-relaxed max-w-2xl">
              Strictly evaluated using Inner Circle Trader algorithms. Complete market footprint mapped including structural displacements, unmitigated order blocks, and liquidity resting zones.
            </p>
          </div>

          <div className="flex items-center justify-start md:justify-end shrink-0 gap-4">
            <div className="text-center rounded-xl bg-slate-900/80 border border-slate-800 p-4 min-w-[120px]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Trade Score</div>
              <div className="font-display text-3xl font-extrabold text-blue-400 tracking-tight">
                {analysis.finalSummary.score}
                <span className="text-sm font-normal text-slate-500">/10</span>
              </div>
            </div>
            
            <div className="text-center rounded-xl bg-slate-900/80 border border-slate-800 p-4 min-w-[120px]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">Risk:Reward</div>
              <div className="font-display text-2xl font-semibold text-emerald-400 tracking-tight">
                {analysis.entrySetup.riskRewardRatio || '1:2.5'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-800/80 gap-3 flex-wrap">
          <button
            onClick={onReset}
            className="flex items-center space-x-1 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Analyze Another Chart</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={copyAsMarkdown}
              id="copy-report-markdown"
              className="flex items-center space-x-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700/60 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copiedText ? 'Copied!' : 'Copy Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE TRADING ACTION SIGNAL BANNER */}
      <div className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 ${
        analysis.entrySetup.direction === 'BUY' 
          ? 'bg-emerald-500/10 border-emerald-500/30' 
          : analysis.entrySetup.direction === 'SELL'
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-slate-900/40 border-slate-800'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold border shrink-0 ${
            analysis.entrySetup.direction === 'BUY'
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : analysis.entrySetup.direction === 'SELL'
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {analysis.entrySetup.direction === 'BUY' ? <TrendingUp className="h-6 w-6" /> :
             analysis.entrySetup.direction === 'SELL' ? <TrendingDown className="h-6 w-6" /> :
             <AlertTriangle className="h-6 w-6" />}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Executive Instant Recommendation</div>
            <div className={`font-sans text-base sm:text-lg font-black tracking-tight ${
              analysis.entrySetup.direction === 'BUY' ? 'text-emerald-400' :
              analysis.entrySetup.direction === 'SELL' ? 'text-rose-400' : 'text-slate-300'
            }`}>
              {analysis.entrySetup.direction === 'BUY' ? 'STRATEGIC BUY (LONG SETUP)' :
               analysis.entrySetup.direction === 'SELL' ? 'STRATEGIC SELL (SHORT SETUP)' :
               'HOLD POSITION (NO HIGH-PROBABILITY TRADE SETUP)'}
            </div>
            <p className="font-sans text-xs text-slate-400 mt-1">
              {analysis.entrySetup.direction === 'BUY' ? `Enter Long around ${analysis.finalSummary.bestEntryZone} targeting T1:${analysis.finalSummary.target1} and T2:${analysis.finalSummary.target2}.` :
               analysis.entrySetup.direction === 'SELL' ? `Enter Short around ${analysis.finalSummary.bestEntryZone} targeting T1:${analysis.finalSummary.target1} and T2:${analysis.finalSummary.target2}.` :
               `Wait for clear change in state of market delivery or Liquidity sweeps.`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 self-stretch sm:self-center justify-between sm:justify-end border-t sm:border-t-0 border-slate-850 pt-3 sm:pt-0">
          <div className="pr-4 border-r border-slate-850">
            <div className="text-[9px] font-mono text-slate-500 uppercase">STOP LOSS</div>
            <div className="font-mono text-xs font-bold text-rose-400">{analysis.finalSummary.stopLoss}</div>
          </div>
          <div className="pl-1">
            <div className="text-[9px] font-mono text-slate-500 uppercase">RISK LEVEL</div>
            <div className="font-sans text-xs font-bold text-sky-400">Score {analysis.finalSummary.score}/10</div>
          </div>
        </div>
      </div>

      {/* 2. Primary Tabs Selector */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto scb-invisible gap-2">
        {(['checklist', 'structure', 'arrays', 'liquidity', 'confluences'] as const).map(tab => {
          const isActive = activeTab === tab;
          let label = '';
          switch (tab) {
            case 'checklist': label = 'Executive Setup'; break;
            case 'structure': label = 'Market Structure'; break;
            case 'arrays': label = 'SMC Blocks & FVGs'; break;
            case 'liquidity': label = 'Liquidity & Levels'; break;
            case 'confluences': label = 'Confluences & Zones'; break;
          }
          return (
            <button
              key={tab}
              id={`tab-select-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 font-sans text-xs font-semibold tracking-wider transition-colors duration-150 capitalize border-b-2 whitespace-nowrap ${
                isActive 
                  ? 'text-sky-400 border-sky-400 font-bold' 
                  : 'text-slate-400 border-transparent hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents Layout */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {/* TAB 1 — EXECUTIVE CHECKLIST & SCORECARD */}
            {activeTab === 'checklist' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Scorecard Column */}
                <div className="lg:col-span-5 h-full">
                  <div id="executive-scorecard-card" className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-slate-300 font-semibold border-b border-slate-800/80 pb-3">
                        <BookOpen className="h-4 w-4 text-sky-400" />
                        <h3 className="font-sans text-sm tracking-wide uppercase">Operational Trade Plan</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pb-4">
                        <div className="space-y-1 rounded-lg bg-slate-950/60 p-3 border border-slate-800/40">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Direction</span>
                          <div className={`font-sans text-base font-bold ${
                            analysis.entrySetup.direction === 'BUY' ? 'text-emerald-400' :
                            analysis.entrySetup.direction === 'SELL' ? 'text-rose-400' : 'text-slate-400'
                          }`}>
                            {analysis.entrySetup.direction}
                          </div>
                        </div>

                        <div className="space-y-1 rounded-lg bg-slate-950/60 p-3 border border-slate-800/40">
                          <span className="font-mono text-[10px] text-slate-500 uppercase">Quality Grade</span>
                          <div className="font-sans text-base font-bold text-sky-400">
                            {analysis.finalSummary.score >= 8 ? 'Premium (A)' :
                             analysis.finalSummary.score >= 5 ? 'Standard (B)' : 'No-Trade (F)'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 font-mono text-xs">
                        <div className="flex justify-between p-2 rounded-md bg-slate-950/30 border border-slate-800/30">
                          <span className="text-slate-500">Entry Trigger Zone:</span>
                          <span className="text-white font-medium">{analysis.finalSummary.bestEntryZone}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-md bg-slate-950/30 border border-slate-800/30">
                          <span className="text-slate-500">Stop Loss Safe Limit:</span>
                          <span className="text-rose-400 font-medium">{analysis.finalSummary.stopLoss}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-md bg-slate-950/30 border border-slate-800/30">
                          <span className="text-slate-500">Target Profit T1:</span>
                          <span className="text-emerald-400 font-medium">{analysis.finalSummary.target1}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-md bg-slate-950/30 border border-slate-800/30">
                          <span className="text-slate-500">Target Profit T2 (Final):</span>
                          <span className="text-emerald-400 font-medium">{analysis.finalSummary.target2}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-md bg-slate-950/30 border border-slate-800/30">
                          <span className="text-slate-500">Key Sweep Watch:</span>
                          <span className="text-amber-400 font-semibold">{analysis.finalSummary.keyLevelToWatch}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-800 pt-4 space-y-2">
                      <div className="flex items-center space-x-1 text-slate-500 text-[10px] font-mono tracking-wider">
                        <span>CRITICAL RECOMMENDATION GUIDELINE</span>
                      </div>
                      <p className="font-sans text-slate-300 text-xs italic leading-relaxed bg-[#1e293b]/40 rounded-lg p-3 border border-slate-800/60">
                        &ldquo;{analysis.finalSummary.recommendation}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analysis Score breakdowns & Confluence check */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Confluences Card */}
                  <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4 pr-1">
                      <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                        <Target className="h-4 w-4 text-emerald-400" />
                        <h4 className="font-sans text-sm tracking-wide uppercase">Setup Confluences Matched</h4>
                      </div>
                      <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {computeConfluencesCount()} Alignment Factors
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.premiumDiscount.goodToTrade ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Equilibrium Discount/Premium</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{analysis.premiumDiscount.priceZone} location verified</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.marketStructure.bosOccurred ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Displacement / BOS</p>
                          <p className="text-[10px] text-slate-500 leading-snug">Structural clean brake: {analysis.marketStructure.bosOccurred ? 'YES' : 'NONE'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.marketStructure.chochOccurred ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Change of Character (CHOCH)</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{analysis.marketStructure.chochOccurred ? 'Confirmed level trend flip' : 'No Trend Flip yet'}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.orderBlocks.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Mitigation Arrays</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{analysis.orderBlocks.length} solid Order Block targets located</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.fairValueGaps.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Imbalances Mapping</p>
                          <p className="text-[10px] text-slate-500 leading-snug">{analysis.fairValueGaps.length} Fair Value Gaps found in path</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2.5 p-2 bg-slate-950/30 rounded-lg border border-slate-800/35">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${analysis.liquidity.pools.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-300">Liquidity Footprint mapped</p>
                          <p className="text-[10px] text-slate-500 leading-snug">Resting stops at Buy & Sell targets</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-lg border border-blue-500/10 bg-blue-500/5 p-4.5">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-4.5 w-4.5 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <h5 className="font-sans text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">Entry Strategy Recommendation</h5>
                          <p className="font-sans text-xs text-slate-400 leading-relaxed">
                            {analysis.entrySetup.details || 'Always double check higher timeframe context. If trading, wait for active candlestick validation inside the entry zone before clicking buy/sell.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2 — MARKET STRUCTURE */}
            {activeTab === 'structure' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Structure Card */}
                  <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                    <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                      Structural Breakdowns
                    </h3>
                    
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-800/45">
                        <span className="text-slate-500">Estimated Timeframe:</span>
                        <span className="text-slate-200 font-semibold">{analysis.timeframe || 'Not Visible'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/45">
                        <span className="text-slate-500">Structural Trend:</span>
                        <span className={`font-semibold ${
                          analysis.marketStructure.trend === 'Bullish' ? 'text-emerald-400' :
                          analysis.marketStructure.trend === 'Bearish' ? 'text-rose-400' : 'text-slate-400'
                        }`}>{analysis.marketStructure.trend}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/45">
                        <span className="text-slate-500">BOS Level:</span>
                        <span className="text-slate-300">{analysis.marketStructure.bosOccurred ? analysis.marketStructure.bosLocation : 'No break detected'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-800/45">
                        <span className="text-slate-500">CHOCH Trigger Price:</span>
                        <span className="text-slate-300">{analysis.marketStructure.chochOccurred ? analysis.marketStructure.chochLevel : 'None'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">CISD State of Delivery:</span>
                        <span className="text-slate-300">{analysis.marketStructure.cisdFormed ? `Opposing: ${analysis.marketStructure.cisdOpposingCandle}` : 'No opposition candle'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Swing Ranges & Equilibrium Card */}
                  <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                    <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                      Swing Ranges & Price Valuation
                    </h3>

                    <div className="space-y-4">
                      {/* Premium / Discount Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono font-medium text-slate-500">
                          <span>DISCOUNT (BUYING)</span>
                          <span>EQUILIBRIUM (50%)</span>
                          <span>PREMIUM (SELLING)</span>
                        </div>
                        
                        {/* Interactive Scale */}
                        <div className="relative h-6 rounded-md bg-slate-950 overflow-hidden border border-slate-800/65 flex">
                          <div className="w-1/2 h-full bg-emerald-500/10 cursor-default" title="Discount (ideal for Buys)" />
                          <div className="w-0.5 h-full bg-slate-700 pointer-events-none z-10" />
                          <div className="w-1/2 h-full bg-rose-500/10 cursor-default" title="Premium (ideal for Sells)" />
                          
                          {/* Slider Indicator pointer */}
                          <div 
                            className={`absolute top-0 bottom-0 w-3 border border-slate-500/50 flex items-center justify-center -ml-1.5 ${
                              analysis.premiumDiscount.priceZone === 'Discount' ? 'left-[25%] bg-emerald-500' :
                              analysis.premiumDiscount.priceZone === 'Premium' ? 'left-[75%] bg-rose-500' : 'left-[50%] bg-blue-500'
                            }`}
                          >
                            <div className="w-1 h-3 bg-white/70 rounded-full" />
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] font-mono font-bold">
                          <span className="text-emerald-400">Low: {analysis.premiumDiscount.swingLow}</span>
                          <span className="text-slate-400">EQ: {analysis.premiumDiscount.equilibriumPrice}</span>
                          <span className="text-rose-400">High: {analysis.premiumDiscount.swingHigh}</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-900/60 font-sans text-xs text-slate-400 leading-relaxed">
                        <span className="text-white font-semibold">Vapor Evaluation Zone:</span> {analysis.premiumDiscount.tradeLocationComment}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extended structural coordinates list */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
                  <h4 className="font-sans text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
                    <Table className="h-4 w-4 text-sky-400" />
                    <span>Discovered Structure Benchmarks</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {analysis.marketStructure.highsAndLows.map((point, index) => (
                      <div key={index} className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-2.5 font-mono text-xs">
                        <div className="text-slate-500 uppercase text-[9px] tracking-wide">Marker #{index + 1}</div>
                        <div className="text-slate-300 font-semibold mt-0.5">{point}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3 — SMC ARRAYS: OBs & FVGs */}
            {activeTab === 'arrays' && (
              <div className="space-y-6">
                {/* Order Blocks */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-emerald-400" />
                      <span>Order Block footprint arrays</span>
                    </h3>
                    <span className="font-mono text-xs text-slate-500">[{analysis.orderBlocks.length} located]</span>
                  </div>

                  {analysis.orderBlocks.length === 0 ? (
                    <p className="font-sans text-xs text-slate-500 italic">No clear Order Blocks identified on the current visible chart range.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full font-sans text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="pb-2.5 w-1/5">Type</th>
                            <th className="pb-2.5 w-1/4">Price Range</th>
                            <th className="pb-2.5 w-1/5">Price Status</th>
                            <th className="pb-2.5 w-1/6">Mitigated</th>
                            <th className="pb-2.5">Structural Context</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analysis.orderBlocks.map((ob, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20 transition">
                              <td className="py-3">
                                <span className={`inline-block border rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold leading-tight uppercase ${
                                  ob.type === 'Bullish' 
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' 
                                    : 'text-rose-400 bg-rose-500/10 border-rose-500/25'
                                }`}>
                                  {ob.type} OB
                                </span>
                              </td>
                              <td className="py-3 font-mono font-semibold text-slate-300">{ob.range}</td>
                              <td className="py-3">
                                <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider ${
                                  ob.priceApproaching === 'Inside' ? 'text-sky-400 bg-sky-500/10' :
                                  ob.priceApproaching === 'Approaching' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800'
                                }`}>
                                  {ob.priceApproaching}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-slate-400">
                                {ob.mitigated ? (
                                  <span className="text-slate-600 font-medium">Yes (Invalid)</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">No (Valid OB)</span>
                                )}
                              </td>
                              <td className="py-3 text-slate-400 leading-relaxed">{ob.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Fair Value Gaps */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-teal-400" />
                      <span>Fair Value Gaps & Imbalance Zones</span>
                    </h3>
                    <span className="font-mono text-xs text-slate-500">[{analysis.fairValueGaps.length} located]</span>
                  </div>

                  {analysis.fairValueGaps.length === 0 ? (
                    <p className="font-sans text-xs text-slate-500 italic">No Fair Value Gaps visible on the current chart view.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full font-sans text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <th className="pb-2.5 w-1/5">Type</th>
                            <th className="pb-2.5 w-1/4">Price Imbalance</th>
                            <th className="pb-2.5 w-1/5">Likely To Refresh</th>
                            <th className="pb-2.5">Analysis Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analysis.fairValueGaps.map((fvg, idx) => (
                            <tr key={idx} className="hover:bg-slate-950/20 transition">
                              <td className="py-3">
                                <span className={`inline-block border rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold leading-tight uppercase ${
                                  fvg.type === 'Bullish' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' :
                                  fvg.type === 'Bearish' ? 'text-rose-400 bg-rose-500/10 border-rose-500/25' :
                                  'text-cyan-400 bg-cyan-500/10 border-cyan-500/25'
                                }`}>
                                  {fvg.type} FVG
                                </span>
                              </td>
                              <td className="py-3 font-mono font-semibold text-slate-300">{fvg.range}</td>
                              <td className="py-3">
                                {fvg.likelyToFill ? (
                                  <span className="inline-block rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold text-teal-400">
                                    High Probability Fill
                                  </span>
                                ) : (
                                  <span className="inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                    Partially Filled / Mitigated
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-slate-400 leading-relaxed">{fvg.details}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4 — LIQUIDITY & S/R */}
            {activeTab === 'liquidity' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                {/* Liquidity Pools */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                    Resting Liquidity & Sweeps
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-3 flex items-start space-x-2.5">
                      <Target className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">Pending Draw on Liquidity Target</div>
                        <div className="text-[11px] text-indigo-300 font-mono font-bold mt-1 uppercase tracking-wide">
                          {analysis.liquidity.nextSweepTarget}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {analysis.liquidity.pools.map((pool, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 flex items-center justify-between font-mono text-xs gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{pool.type}</span>
                            <div className="text-slate-300 font-bold">{pool.location}</div>
                          </div>
                          
                          <div className="text-right">
                            {pool.swept ? (
                              <span className="inline-block rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 uppercase tracking-widest border border-rose-500/30">
                                SWEPT ✓
                              </span>
                            ) : (
                              <span className="inline-block rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                RESTING STOPS
                              </span>
                            )}
                            <div className="text-[9px] text-slate-500 mt-1 truncate max-w-xs">{pool.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Support & Resistance */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                    Key Historical Levels & Trendlines
                  </h3>

                  <div className="space-y-4">
                    <p className="font-sans text-xs text-slate-400 leading-relaxed">
                      {analysis.supportResistance.details}
                    </p>

                    <div className="space-y-2.5">
                      {analysis.supportResistance.levels.map((lvl, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 font-mono text-xs flex items-center justify-between">
                          <div>
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              lvl.type === 'Resistance' ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                              lvl.type === 'Support' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20':
                              'text-sky-400 bg-sky-500/10 border border-sky-400/20'
                            }`}>
                              {lvl.type}
                            </span>
                            <div className="text-slate-300 font-bold mt-1.5">{lvl.level}</div>
                          </div>
                          
                          <div className="text-right text-slate-500 text-[10px] max-w-[180px] break-words">
                            {lvl.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5 — INDICATORS & SUPPLY/DEMAND */}
            {activeTab === 'confluences' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supply & Demand Zones */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                    Supply & Demand Impulsive Origins
                  </h3>

                  <div className="space-y-3">
                    {analysis.demandSupply.length === 0 ? (
                      <p className="font-sans text-xs text-slate-500 italic">No supply or demand blocks identified.</p>
                    ) : (
                      analysis.demandSupply.map((zone, idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 font-mono text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              zone.type === 'Demand' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                            }`}>
                              {zone.type} ZONE
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{zone.status}</span>
                          </div>
                          <div className="text-slate-200 font-bold text-sm">{zone.range}</div>
                          <p className="text-[11px] text-slate-400 font-sans leading-relaxed pt-1.5 border-t border-slate-800/50">{zone.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* EMA Dynamic Indicators */}
                <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
                  <h3 className="font-sans text-sm font-bold tracking-wide uppercase text-slate-300 border-b border-slate-800/80 pb-2">
                    Dynamic Exponential Moving Averages (EMA)
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex -space-x-1 font-mono text-xs">
                        {analysis.emaAnalysis.emasDetected.length > 0 ? (
                          analysis.emaAnalysis.emasDetected.map((ema, i) => (
                            <span key={i} className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                              EMA {ema}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs italic">No traditional indicators visible</span>
                        )}
                      </div>

                      <div className="h-4 w-px bg-slate-800" />
                      
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="text-slate-500">Maturity Fit:</span>
                        <span className={`font-semibold ${analysis.emaAnalysis.alignmentWithBias ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {analysis.emaAnalysis.alignmentWithBias ? 'Standard Align' : 'Imperfect Align'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/70 p-3 rounded-lg font-sans text-xs text-slate-400 leading-relaxed space-y-1.5">
                      <div className="text-slate-300 font-mono font-bold text-[10px] uppercase tracking-wide">DYNAMIC TREND ACTION</div>
                      <p>{analysis.emaAnalysis.dynamicLevels || 'Dynamic EMAs not actively visible on the core screenshot format.'}</p>
                    </div>

                    <div className="font-sans text-xs text-slate-400 leading-relaxed pt-2">
                      <span className="text-slate-200 font-semibold">Indicator Overlay Analysis:</span> {analysis.emaAnalysis.details}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
