/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, FileImage, Cpu, AlertCircle, Sparkles, BookMarked, BarChart3, Clock, 
  Trash2, ChevronRight, CheckCircle2, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import { SCENARIO_PRESETS, ScenarioPreset } from './samples';
import PresetTradingChart from './components/PresetTradingChart';
import AnalysisResults from './components/AnalysisResults';
import { ICTAnalysis, SavedAnalysis } from './types';

// Step messages for loading screen transitions
const LOADING_STEPS = [
  "Scanning market candlestick structure & trend indices...",
  "Calculating 50% Equilibrium and mapping Range Premium/Discount...",
  "Searching for unmitigated Bullish and Bearish Order Blocks...",
  "Scanning spacing imbalances for Fair Value Gaps (FVG)...",
  "Locating Equal Highs (BSL) and Equal Lows (SSL) resting pools...",
  "Tracing active technical support lines, resistance ceilings, and trendlines...",
  "Checking Exponential Moving Averages (EMA 20/50/200) dynamic support...",
  "Locating impulsive zones of supply/demand origins...",
  "Formulating exact entry zone parameters and risk-reward ratios...",
  "Generating final executive trading scorecard report..."
];

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(SCENARIO_PRESETS[0]);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFileBase64, setCustomFileBase64] = useState<string>('');
  
  // Track currently active base64 (either uploaded or drawn by preset trading chart canvas)
  const [activeBase64, setActiveBase64] = useState<string>('');
  
  // App state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [completedAnalysis, setCompletedAnalysis] = useState<ICTAnalysis | null>(null);
  
  // Saved Journal (Persistent History)
  const [savedJournal, setSavedJournal] = useState<SavedAnalysis[]>([]);
  const [selectedJournalItem, setSelectedJournalItem] = useState<SavedAnalysis | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Load Journal on Mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ict_chart_journal');
      if (stored) {
        setSavedJournal(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load journal", e);
    }
  }, []);

  // Update step index during loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex(prev => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev; // Hold at last step
        });
      }, 550);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Convert uploaded custom file to base64
  const processCustomFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file (PNG, JPG).");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomFile(file);
      setCustomFileBase64(b64);
      setActiveBase64(b64);
      setSelectedJournalItem(null); // Clear selected journal if custom uploaded
    };
    reader.readAsDataURL(file);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCustomFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Selector
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processCustomFile(e.target.files[0]);
    }
  };

  // Switch back to Presets/Clear Custom File
  const handleClearCustomFile = () => {
    setCustomFile(null);
    setCustomFileBase64('');
    // Re-set active as current selected preset base64
    setActiveBase64('');
  };

  // Run core API analysis
  const triggerAnalysis = async () => {
    if (!activeBase64) {
      setAnalysisError("No chart model is loaded for analysis.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setCompletedAnalysis(null);

    try {
      // 1. Minimum delay promise (5.5 seconds)
      const delayPromise = new Promise(resolve => setTimeout(resolve, 5500));

      // 2. Fetch promise running in parallel
      const fetchPromise = (async () => {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            imageBase64: activeBase64,
            mimeType: customFile ? customFile.type : 'image/png'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Server returned an error during analysis.');
        }

        return await response.json();
      })();

      // 3. Wait for BOTH the API response and the 5.5s minimum animation timer to complete
      const [_, results] = await Promise.all([delayPromise, fetchPromise]);

      setCompletedAnalysis(results);

      // Save to Local History Journal
      const newJournalItem: SavedAnalysis = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        title: customFile ? customFile.name : `${selectedPreset.symbol} (${selectedPreset.timeframe})`,
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString(),
        image: activeBase64,
        analysis: results
      };

      const updatedJournal = [newJournalItem, ...savedJournal].slice(0, 20); // Keep last 20
      setSavedJournal(updatedJournal);
      localStorage.setItem('ict_chart_journal', JSON.stringify(updatedJournal));

    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || "Failed to contact analysis server. Please check your network connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Remove Journal item
  const deleteJournalItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedJournal.filter(item => item.id !== id);
    setSavedJournal(updated);
    localStorage.setItem('ict_chart_journal', JSON.stringify(updated));
    if (selectedJournalItem?.id === id) {
      setSelectedJournalItem(null);
      setCompletedAnalysis(null);
    }
  };

  // Select item from history
  const loadJournalItem = (item: SavedAnalysis) => {
    setSelectedJournalItem(item);
    setCompletedAnalysis(item.analysis);
    setActiveBase64(item.image);
    setCustomFile(null);
    setCustomFileBase64('');
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans selection:bg-blue-500/30 selection:text-blue-300">
      
      {/* GLOBAL BACKGROUND GLOWS */}
      <div className="pointer-events-none fixed top-0 left-1/4 h-[500px] w-[500px] -translate-x-1/2 bg-blue-500/[0.02] rounded-full blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 h-[500px] w-[500px] bg-emerald-500/[0.015] rounded-full blur-[150px]" />

      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-[#070b13]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display text-lg font-bold tracking-tight text-white leading-none">
                  ICT Smart Money AI
                </h1>
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-400/20 uppercase tracking-widest leading-none">
                  v2.5 Live
                </span>
              </div>
              <p className="font-sans text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">
                Full inner circle trader algorithm analysis suite
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:flex items-center space-x-1.5 text-[10px] font-mono text-slate-500">
              <span>SERVER:</span>
              <span className="text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                LIVE & SYNCED
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        
        {/* UPPER INFO GRID (SPLIT 5/7) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: CONTROLS & CHART PREVIEW (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* UPLOADER / CHANGER CARD */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/15 backdrop-blur-sm p-4.5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="font-display text-xs font-bold tracking-wider text-slate-400 uppercase">
                  1. Input Trading Chart
                </span>
                
                {customFile && (
                  <button
                    onClick={handleClearCustomFile}
                    className="font-mono text-[10px] text-red-400 hover:text-red-300 transition"
                  >
                    Clear custom file
                  </button>
                )}
              </div>

              {/* Standard File Upload Area */}
              {!customFile ? (
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition cursor-pointer ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-500/5' 
                        : 'border-slate-850 bg-slate-950/20 hover:bg-slate-950/40 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="file"
                      id="chart-file-uploader"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-7 w-7 text-slate-500 mb-2" />
                    <span className="font-sans text-xs font-semibold text-slate-300">
                      Drag & Drop chart image here
                    </span>
                    <span className="font-sans text-[10px] text-slate-500 mt-1">
                      Support PNG, JPG, or Screenshots
                    </span>
                  </div>

                  {/* Scenarios Section */}
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wide">
                      Or select a standard ICT simulation scenario:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SCENARIO_PRESETS.map(preset => {
                        const isChosen = !customFile && selectedPreset.id === preset.id;
                        return (
                          <button
                            key={preset.id}
                            id={`scenario-select-${preset.id}`}
                            onClick={() => {
                              setSelectedPreset(preset);
                              setCustomFile(null);
                              setSelectedJournalItem(null); // Clear loaded journal
                            }}
                            className={`rounded-lg px-2 py-3 text-left border transition ${
                              isChosen 
                                ? 'bg-blue-600/10 border-blue-500/40' 
                                : 'bg-slate-950/30 border-slate-900 hover:border-slate-800 hover:bg-slate-950/60'
                            }`}
                          >
                            <div className={`font-mono text-[9px] font-bold tracking-wider leading-none ${isChosen ? 'text-blue-400' : 'text-slate-500'}`}>
                              {preset.symbol}
                            </div>
                            <div className="font-sans text-[10.5px] font-semibold text-slate-300 mt-1 truncate">
                              {preset.name.replace(/.*?\s/, '')}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3 rounded-lg border border-slate-850 bg-slate-950/40 p-3">
                  <div className="rounded-md bg-blue-500/10 p-2 border border-blue-500/15 text-blue-400">
                    <FileImage className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-xs font-bold text-slate-200 truncate">
                      {customFile.name}
                    </div>
                    <div className="font-mono text-[9px] text-slate-500 mt-0.5">
                      {(customFile.size / 1024).toFixed(0)} KB • Custom uploaded image
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* PREVIEW CONTAINER CARD */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pl-1">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                  Active Chart Canvas Feed
                </span>
                {customFile && (
                  <span className="rounded-sm bg-lime-500/10 border border-lime-500/20 px-1 py-0.5 font-mono text-[8.5px] font-medium text-lime-400 uppercase tracking-widest leading-none">
                    Uploaded file active
                  </span>
                )}
              </div>

              {!customFile ? (
                // Draw preset to canvas
                <PresetTradingChart 
                  preset={selectedPreset} 
                  onBase64Available={setActiveBase64} 
                />
              ) : (
                // Preview uploaded file
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-1">
                  <img
                    id="uploaded-preview-img"
                    src={customFileBase64}
                    alt="Custom upload preview"
                    className="block w-full h-[320px] object-contain rounded-lg"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400 uppercase tracking-wider backdrop-blur-xs">
                      Live Preview Verified
                    </span>
                  </div>
                </div>
              )}

              {/* ACTION ANALYSIS BAR CONSOLE */}
              <div className="pt-2">
                <button
                  onClick={triggerAnalysis}
                  id="run-analysis-button"
                  disabled={isAnalyzing || !activeBase64}
                  className={`relative w-full overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 font-sans text-sm font-bold tracking-wide text-white py-4.5 text-center shadow-lg transition duration-200 cursor-pointer flex items-center justify-center space-x-2 ${
                    isAnalyzing ? 'shadow-none' : 'shadow-blue-500/[0.08] hover:shadow-blue-500/[0.12] hover:scale-[1.01]'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white/80" />
                      <span>ANALYZING WITH SMART MONEY AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5 text-emerald-300" />
                      <span>RUN ICT AI ANALYSIS REPORT</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* JOURNAL HISTORY TRADING LOGS */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800pb-2 pb-2">
                <span className="font-display text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                  <BookMarked className="h-4 w-4 text-sky-400" />
                  <span>Trading Journal History</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {savedJournal.length} logged
                </span>
              </div>

              {savedJournal.length === 0 ? (
                <div className="text-center py-6">
                  <Clock className="h-6 w-6 text-slate-700 mx-auto mb-2" />
                  <p className="font-sans text-xs text-slate-500 italic">No past analyses saved in this browser yet.</p>
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-0.5">
                  {savedJournal.map(item => {
                    const isSelected = selectedJournalItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`journal-logs-select-${item.id}`}
                        onClick={() => loadJournalItem(item)}
                        className={`w-full rounded-lg px-2.5 py-2 text-left flex items-center justify-between text-xs transition select-none cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-600/10 border border-blue-500/25 text-blue-300' 
                            : 'border border-slate-900/60 bg-slate-950/20 hover:bg-slate-950/50 hover:border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium truncate text-slate-300">{item.title}</div>
                          <div className="font-mono text-[9px] text-slate-500 mt-0.5">{item.timestamp}</div>
                        </div>
                        
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {isSelected && <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded leading-none">LOADED</span>}
                          <button
                            onClick={(e) => deleteJournalItem(item.id, e)}
                            className="text-slate-600 hover:text-red-400 p-1 rounded hover:bg-slate-900/80 transition"
                            title="Delete past analysis log"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: CORE DASHBOARD REPORT OUTPUTS (7 cols) */}
          <div className="lg:col-span-7 h-full">

            {/* ERROR VIEW */}
            {analysisError && (
              <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-start space-x-4 animate-glow-red">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1 z-10">
                  <h4 className="font-sans text-sm font-bold text-red-400 uppercase tracking-wide">Analysis Engine Failure</h4>
                  <p className="font-sans text-xs text-slate-300 leading-relaxed">
                    {analysisError}
                  </p>
                  <p className="font-sans text-xs text-slate-400 pt-2 border-t border-slate-900/40 mt-2">
                    <span className="font-semibold text-slate-300">Troubleshoot advice:</span> If you received a raw JSON error, verify that your <span className="font-mono text-slate-300 font-semibold">GEMINI_API_KEY</span> is fully valid and has appropriate tokens available. Configure this under the <span className="font-semibold">Settings</span> icon at the top right of the workspace.
                  </p>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* CURRENTLY ANALYZING LOADING STEPPERS MOCK STATE */}
              {isAnalyzing && (
                <motion.div
                  key="loading-panel"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-slate-800 bg-[#080d19]/60 p-12 text-center flex flex-col items-center justify-center min-h-[500px]"
                >
                  <div className="relative mb-6">
                    {/* Ring animated */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-2 border-t-blue-500 animate-spin" />
                    <div className="h-16 w-16 rounded-full bg-slate-950 flex items-center justify-center p-3">
                      <Cpu className="h-8 w-8 text-blue-400 animate-pulse" />
                    </div>
                  </div>

                  <h3 className="font-display text-base font-bold text-white tracking-wide uppercase">
                    Executing Real-Time ICT Pipeline
                  </h3>
                  
                  {/* Progress Counter */}
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-widest mt-2">
                    Step {loadingStepIndex + 1} of 10
                  </span>

                  {/* Progressive loading texts details */}
                  <p className="font-sans text-xs text-slate-400 leading-relaxed max-w-md mt-6 h-10">
                    &ldquo;{LOADING_STEPS[loadingStepIndex]}&rdquo;
                  </p>

                  <div className="w-full max-w-xs bg-slate-950 h-1.5 rounded-full overflow-hidden mt-6 border border-slate-900 pr-0.5 pl-0.5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${((loadingStepIndex + 1) / LOADING_STEPS.length) * 100}%` }}
                    />
                  </div>

                  <p className="font-sans text-[10px] text-slate-600 mt-2">
                    Multi-modal Vision models are parsing structural coordinates...
                  </p>
                </motion.div>
              )}

              {/* SUCCESS RESULTS COMPONENT FOR ANALYZED METRIC */}
              {!isAnalyzing && completedAnalysis && (
                <motion.div
                  key="analysis-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnalysisResults 
                    analysis={completedAnalysis} 
                    onReset={() => {
                      setCompletedAnalysis(null);
                      setSelectedJournalItem(null);
                    }} 
                  />
                </motion.div>
              )}

              {/* DEFAULT INITIAL PLACEHOLDER AND NO ANALYSIS STATE */}
              {!isAnalyzing && !completedAnalysis && (
                <motion.div
                  key="placeholder-panel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-slate-850 bg-slate-900/10 p-10 text-center flex flex-col items-center justify-center min-h-[500px] border-dashed"
                >
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-500 mb-4 bg-gradient-to-b from-slate-950 to-slate-900">
                    <BarChart3 className="h-10 w-10 text-slate-650" />
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-350 tracking-wide uppercase">
                    Awaiting Trading Chart Input
                  </h3>
                  <p className="font-sans text-xs text-slate-500 leading-relaxed max-w-md mt-2">
                    Upload your custom trading candlestick screenshot directly or select any of our native standard ICT scenarios to start mapping real-time unmitigated institutional pools.
                  </p>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg w-full text-left">
                    <div className="bg-slate-950/20 border border-slate-900 p-3 rounded-lg flex items-start space-x-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-350 uppercase">Base Trend</div>
                        <div className="text-[10px] text-slate-500 tracking-normal mt-0.5 leading-normal">BOS, CHOCH, and Delivery indexes mapped.</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/20 border border-slate-900 p-3 rounded-lg flex items-start space-x-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-350 uppercase">SMC Arrays</div>
                        <div className="text-[10px] text-slate-500 tracking-normal mt-0.5 leading-normal">Displacement order block wicks & FVG ranges.</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/20 border border-slate-900 p-3 rounded-lg flex items-start space-x-2.5">
                      <CheckCircle2 className="h-4.5 w-4.5 text-teal-500 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-slate-350 uppercase">Trade Card</div>
                        <div className="text-[10px] text-slate-500 tracking-normal mt-0.5 leading-normal">Premium Entry Zone, limits, and score values.</div>
                      </div>
                    </div>
                  </div>

                  {/* Fast Action Tip */}
                  <div className="mt-8 flex items-center space-x-2 rounded-lg bg-blue-500/5 px-3 py-1.5 border border-blue-500/10">
                    <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-400 font-semibold select-none">
                      Tip: Tap EUR/USD preset & click 'RUN ICT AI ANALYSIS' for instant view!
                    </span>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* FOOTER METADATA */}
      <footer className="border-t border-slate-900 bg-slate-950/20 py-8 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; 2026 google ai studio build • smart money ict chart analysis agent
          </div>
          <div className="flex space-x-4 font-mono">
            <span>MODEL: GEMINI-3.5-FLASH</span>
            <span>API REVISION: @GOOGLE/GENAI SDK 2.4</span>
            <span>PERSISTENCE: LOCALSTORAGE JOURNALING</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
