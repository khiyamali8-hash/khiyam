/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Verify GEMINI_API_KEY
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. Set it to perform live chart analysis.");
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const app = express();
const PORT = 3000;

// Increase request size to handle base64 image uploads comfortably
app.use(express.json({ limit: '20mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Helper function to call Gemini with exponential backoff for transient limit / high-demand errors (e.g. 503, 429)
async function generateWithRetry(params: any, retries = 3, delay = 800): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const errStr = String(err.message || err.stack || err || "").toLowerCase();
    const isTransient = 
      err.status === 503 || 
      err.status === 429 || 
      err.statusCode === 503 ||
      err.statusCode === 429 ||
      errStr.includes("503") || 
      errStr.includes("unavailable") || 
      errStr.includes("high demand") ||
      errStr.includes("429") ||
      errStr.includes("resource_exhausted") ||
      errStr.includes("demand") ||
      errStr.includes("spikes in demand");

    if (isTransient && retries > 0) {
      console.warn(`Gemini API busy (503/429/Unavailable). Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return generateWithRetry(params, retries - 1, delay * 1.5);
    }
    throw err;
  }
}

// Main Analysis API
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'Gemini API Key is not configured. Please add GEMINI_API_KEY under Settings > Secrets in AI Studio.' 
      });
    }

    // Clean up base64 prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const systemInstruction = `You are an expert ICT (Inner Circle Trader) trading analyst and smart money specialist. When a user uploads any trading chart image, you must perform a complete, structured, professional analysis using the full ICT methodology. Never give vague or generic answers. Be precise, specific, and actionable.

CRITICAL SPEED & CONCISENESS RULES:
- Keep ALL descriptive explanations, "details", "comment", and text fields extremely direct, clean, and concise (Strictly 1 to 2 short sentences maximum).
- Never add verbose introductory boilerplate, fluff, or excessive descriptors. Focus purely on price levels, trends, and exact technical reasons.
- This extreme concisness is required to reduce token footprint and accelerate response speed under 3 seconds.

TRADING RULES:
- Analyze the highest timeframe visible first, then zoom into detail. Mention which timeframe the chart is on.
- Never recommend a trade without at least 3 confluences lining up.
- If the chart is unclear or not a trading chart, state this in your summary and return a 'NO TRADE' evaluation.
- If no valid setup exists, clearly say "No Trade - Wait for better confluence".
- Be honest, not optimistic - protect capital first.
- Support sizes, levels, and price tags as visible on the chart. If exact prices are unreadable, estimate logically based on chart scale.`;

    const promptText = `Perform a complete ICT analysis on this chart image following these ten steps:

1. MARKET STRUCTURE ANALYSIS:
- Identfy current trend: Bullish, Bearish, or Ranging.
- Find visible Higher Highs (HH), Higher Lows (HL), Lower Highs (LH), Lower Lows (LL).
- Check if Break of Structure (BOS) occurred and where.
- Check if Change of Character (CHOCH) occurred and level.
- Check if Change in State of Delivery (CISD) formed.
- Determine Overall bias.

2. PREMIUM & DISCOUNT ARRAY IDENTIFICATION:
- Recents swing High and Low.
- Calculate 50% equilibrium.
- Is price in Premium (above 50%), Discount (below 50%), or Equilibrium?
- State whether location is favorable to trade.

3. ORDER BLOCKS:
- List all Bullish and Bearish Order Blocks with exact range and mitigation status.

4. FAIR VALUE GAPS (FVG):
- Define FVG ranges, likelihood of getting filled, and any Inverse FVGs.

5. LIQUIDITY ANALYSIS:
- List equal high/low pools, previous day/week highs/lows.
- Identify sweeps that occurred or target next sweeps.

6. SUPPORT & RESISTANCE / TRENDLINES:
- Identify key levels or active trendlines.

7. EMA ANALYSIS:
- Dynamic support/resistance and alignment of EMAs (20, 50, 200) if visible.

8. SUPPLY & DEMAND ZONES:
- Identify strong Supply and Demand zones, testing status.

9. ENTRY SETUP EVALUATION:
- Trade setup direction (BUY, SELL, or NO TRADE), entry zone, confirmation needed, stop loss, targets (take profits), risk-reward ratio, and Trade Quality Score (1-10).

10. FINAL SUMMARY:
- Create a neat trade scorecard, best entry, targets, and practical one-line advice.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data
      }
    };

    const textPart = {
      text: promptText
    };

    console.log("Sending query to Gemini Model gemini-3.5-flash with automated structural retry backoff...");

    const response = await generateWithRetry({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            timeframe: { type: Type.STRING, description: "Estimate of the chart's timeframe (e.g. '1H', '15M', '4H', 'Daily', or 'Unknown')" },
            marketStructure: {
              type: Type.OBJECT,
              properties: {
                trend: { type: Type.STRING, description: "Bullish, Bearish, or Ranging" },
                highsAndLows: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific visible structure points like Higher High, Lower Low, etc. with prices" },
                bosOccurred: { type: Type.BOOLEAN, description: "Whether a Break of Structure has occurred" },
                bosLocation: { type: Type.STRING, description: "Description or level of the BOS" },
                chochOccurred: { type: Type.BOOLEAN, description: "Whether a Change of Character has occurred" },
                chochLevel: { type: Type.STRING, description: "Price level or description of CHOCH" },
                cisdFormed: { type: Type.BOOLEAN, description: "Whether a Change in State of Delivery is visible" },
                cisdOpposingCandle: { type: Type.STRING, description: "Identify the first opposing candle of the CISD" },
                bias: { type: Type.STRING, description: "Overall market structural bias: Bullish, Bearish, or Neutral" }
              },
              required: ["trend", "highsAndLows", "bosOccurred", "bosLocation", "chochOccurred", "chochLevel", "cisdFormed", "cisdOpposingCandle", "bias"]
            },
            premiumDiscount: {
              type: Type.OBJECT,
              properties: {
                swingHigh: { type: Type.STRING, description: "Most recent swing high price/level" },
                swingLow: { type: Type.STRING, description: "Most recent swing low price/level" },
                equilibriumPrice: { type: Type.STRING, description: "Calculated 50% equilibrium level" },
                priceZone: { type: Type.STRING, description: "Premium, Discount, or Equilibrium" },
                goodToTrade: { type: Type.BOOLEAN, description: "Whether the position relative to equilibrium is favorable" },
                tradeLocationComment: { type: Type.STRING, description: "Detailed check on buy-in-discount or sell-in-premium" }
              },
              required: ["swingHigh", "swingLow", "equilibriumPrice", "priceZone", "goodToTrade", "tradeLocationComment"]
            },
            orderBlocks: {
              type: Type.ARRAY,
              description: "Visible Order Blocks on the chart",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Bullish or Bearish" },
                  range: { type: Type.STRING, description: "Price range of block (high to low)" },
                  priceApproaching: { type: Type.STRING, description: "Approaching, Inside, or Away" },
                  mitigated: { type: Type.BOOLEAN, description: "Whether price already tested/mitigated the OB" },
                  details: { type: Type.STRING, description: "General visual and structural notes on the block" }
                },
                required: ["type", "range", "priceApproaching", "mitigated", "details"]
              }
            },
            fairValueGaps: {
              type: Type.ARRAY,
              description: "Fair Value Gaps (FVG) found on the chart",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Bullish, Bearish, or Inverse" },
                  range: { type: Type.STRING, description: "Price range of the gap" },
                  likelyToFill: { type: Type.BOOLEAN, description: "Whether price is anticipated to fill this gap" },
                  details: { type: Type.STRING, description: "Additional notes" }
                },
                required: ["type", "range", "likelyToFill", "details"]
              }
            },
            liquidity: {
              type: Type.OBJECT,
              properties: {
                pools: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Buy Side (BSL), Sell Side (SSL), PDH, PDL, PWH, PWL, or Other" },
                      location: { type: Type.STRING, description: "Price level or description of pool" },
                      swept: { type: Type.BOOLEAN },
                      details: { type: Type.STRING }
                    },
                    required: ["type", "location", "swept", "details"]
                  }
                },
                nextSweepTarget: { type: Type.STRING, description: "Where price is expected to grab liquidity next" },
                details: { type: Type.STRING, description: "General liquidity context" }
              },
              required: ["pools", "nextSweepTarget", "details"]
            },
            supportResistance: {
              type: Type.OBJECT,
              properties: {
                levels: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Support, Resistance, or Trendline" },
                      level: { type: Type.STRING, description: "Price level or trendline coordinates" },
                      details: { type: Type.STRING }
                    },
                    required: ["type", "level", "details"]
                  }
                },
                details: { type: Type.STRING }
              },
              required: ["levels", "details"]
            },
            emaAnalysis: {
              type: Type.OBJECT,
              properties: {
                emasDetected: { type: Type.ARRAY, items: { type: Type.STRING }, description: "EMAs identified (e.g. 20, 50, 200)" },
                dynamicLevels: { type: Type.STRING, description: "Whether EMAs act as dynamic levels or not" },
                alignmentWithBias: { type: Type.BOOLEAN, description: "True if EMAs align with overall structural bias" },
                details: { type: Type.STRING }
              },
              required: ["emasDetected", "dynamicLevels", "alignmentWithBias", "details"]
            },
            demandSupply: {
              type: Type.ARRAY,
              description: "Strongest Supply and Demand zones",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Demand or Supply" },
                  range: { type: Type.STRING, description: "Price level range" },
                  status: { type: Type.STRING, description: "Tested, broken, untouched, or flipped" },
                  details: { type: Type.STRING }
                },
                required: ["type", "range", "status", "details"]
              }
            },
            entrySetup: {
              type: Type.OBJECT,
              properties: {
                direction: { type: Type.STRING, description: "BUY, SELL, or NO TRADE" },
                entryZone: { type: Type.STRING },
                confirmation: { type: Type.STRING, description: "Confluence confirmation rules required" },
                stopLoss: { type: Type.STRING },
                takeProfit1: { type: Type.STRING },
                takeProfit2: { type: Type.STRING },
                riskRewardRatio: { type: Type.STRING },
                score: { type: Type.INTEGER, description: "Trade quality score from 1 to 10" },
                details: { type: Type.STRING }
              },
              required: ["direction", "entryZone", "confirmation", "stopLoss", "takeProfit1", "takeProfit2", "riskRewardRatio", "score", "details"]
            },
            finalSummary: {
              type: Type.OBJECT,
              properties: {
                bias: { type: Type.STRING, description: "Final structural bias: Bullish, Bearish, or Neutral" },
                bestEntryZone: { type: Type.STRING },
                stopLoss: { type: Type.STRING },
                target1: { type: Type.STRING },
                target2: { type: Type.STRING },
                keyLevelToWatch: { type: Type.STRING },
                score: { type: Type.INTEGER, description: "Setup quality rating out of 10" },
                recommendation: { type: Type.STRING, description: "A plain-language clear conclusion and recommendation" }
              },
              required: ["bias", "bestEntryZone", "stopLoss", "target1", "target2", "keyLevelToWatch", "score", "recommendation"]
            }
          },
          required: [
            "timeframe",
            "marketStructure",
            "premiumDiscount",
            "orderBlocks",
            "fairValueGaps",
            "liquidity",
            "supportResistance",
            "emaAnalysis",
            "demandSupply",
            "entrySetup",
            "finalSummary"
          ]
        }
      }
    });

    const parsedResponse = response.text ? JSON.parse(response.text) : null;
    if (!parsedResponse) {
      throw new Error("Failed to receive a valid JSON output from Gemini API.");
    }

    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Analysis failed:", error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while analyzing the chart.' 
    });
  }
});

// Configure Vite or Static Asset delivery
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Use Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("Vite Development Server middleware mounted.");
  } else {
    // Production Mode: static distribution folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files server mounted at:", distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
