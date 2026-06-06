/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { ScenarioPreset } from '../samples';

interface PresetTradingChartProps {
  preset: ScenarioPreset;
  onBase64Available: (base64: string) => void;
}

export default function PresetTradingChart({ preset, onBase64Available }: PresetTradingChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution for crisp lines
    const dpr = window.devicePixelRatio || 1;
    const width = 800;
    const height = 450;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Find min and max prices to scale Y
    const prices = preset.candles.flatMap(c => [c.high, c.low]);
    preset.annotations.forEach(ann => {
      if (ann.y) prices.push(ann.y);
      if (ann.y1) prices.push(ann.y1);
      if (ann.y2) prices.push(ann.y2);
    });
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Padding
    const padTop = 40;
    const padBottom = 40;
    const padLeft = 20;
    const padRight = 80;
    
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Coordinate conversion helpers
    const getX = (index: number) => {
      const step = plotWidth / (preset.candles.length - 1 || 1);
      return padLeft + index * step;
    };

    const getY = (price: number) => {
      const relative = (price - minPrice) / (priceRange || 1);
      return padTop + plotHeight * (1 - relative);
    };

    // 1. Draw Background
    ctx.fillStyle = '#0b0f19'; // Rich dark aesthetic for trading terminals
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Gridlines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    // Horizontal grids (5 lines)
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (priceRange * i) / 4;
      const y = getY(price);
      
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Right y-axis labels
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(price.toLocaleString(undefined, { minimumFractionDigits: preset.symbol.includes('USD/') ? 4 : 0 }), width - padRight + 10, y + 3);
      ctx.setLineDash([4, 4]);
    }

    // Vertical grids (hourly/time steps)
    const stepX = Math.ceil(preset.candles.length / 5);
    for (let i = 0; i < preset.candles.length; i += stepX) {
      const x = getX(i);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();
      
      // Bottom labels
      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.fillText(`C${i + 1}`, x, height - padBottom + 18);
      ctx.setLineDash([4, 4]);
    }
    ctx.setLineDash([]); // Reset line dash

    // 3. Draw Highlights & Boxes (FVG, Order Blocks) From Annotations
    preset.annotations.forEach(ann => {
      if (ann.type === 'box' && ann.x1 !== undefined && ann.x2 !== undefined && ann.y1 !== undefined && ann.y2 !== undefined) {
        const rx1 = getX(ann.x1);
        const rx2 = getX(ann.x2);
        const ry1 = getY(ann.y1);
        const ry2 = getY(ann.y2);
        
        ctx.fillStyle = ann.color;
        ctx.fillRect(rx1, Math.min(ry1, ry2), rx2 - rx1, Math.abs(ry2 - ry1));
        
        // Outline block
        ctx.strokeStyle = ann.color.replace('0.2', '0.6').replace('0.25', '0.7');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx1, Math.min(ry1, ry2), rx2 - rx1, Math.abs(ry2 - ry1));

        // Label on the block
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(ann.label, rx1 + 6, Math.min(ry1, ry2) + 14);
      }
    });

    // 4. Draw EMAs
    preset.emas.forEach(ema => {
      ctx.strokeStyle = ema.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      
      ema.line.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });

    // 5. Draw Annotation Lines
    preset.annotations.forEach(ann => {
      if (ann.type === 'line' && ann.y !== undefined) {
        const y = getY(ann.y);
        ctx.strokeStyle = ann.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(width - padRight, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for horizontal line
        ctx.fillStyle = ann.color;
        ctx.font = 'bold 9px JetBrains Mono, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`◂ ${ann.label}`, padLeft + 10, y - 6);
      }
    });

    // 6. Draw Candlesticks (Grid above annotations/Indicators)
    preset.candles.forEach((candle, idx) => {
      const x = getX(idx);
      const yOpen = getY(candle.open);
      const yClose = getY(candle.close);
      const yHigh = getY(candle.high);
      const yLow = getY(candle.low);
      
      const isGreen = candle.close >= candle.open;
      const bodyColor = isGreen ? '#10b981' : '#ef4444';
      const wickColor = isGreen ? '#34d399' : '#f87171';
      
      // Wick Line
      ctx.strokeStyle = wickColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Candle Body Box
      const bodyWidth = Math.max(6, plotWidth / preset.candles.length * 0.6);
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = bodyColor;
      ctx.lineWidth = 1;

      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      const bodyY = Math.min(yOpen, yClose);
      
      ctx.fillRect(x - bodyWidth / 2, bodyY, bodyWidth, bodyHeight);
      ctx.strokeRect(x - bodyWidth / 2, bodyY, bodyWidth, bodyHeight);
    });

    // 7. Write Legend / Watermark info on top left
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Space Grotesk, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${preset.symbol} / ${preset.timeframe}`, padLeft + 10, padTop - 15);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText('INNER CIRCLE TRADER (ICT) ALGORITHM ANALYSIS', padLeft + 10, padTop - 2);

    // Base64 generation after rendering complete
    onBase64Available(canvas.toDataURL('image/png'));

  }, [preset, onBase64Available]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950/60 p-1">
      <canvas
        id="preset-chart-canvas"
        ref={canvasRef}
        className="block w-full h-[450px] rounded-lg"
      />
      <div className="absolute top-4 right-20 flex space-x-2">
        <span className="flex items-center rounded-md bg-[#1e293b]/70 px-2 py-0.5 font-mono text-[9px] font-semibold text-sky-400 tracking-wider backdrop-blur-xs">
          ● SIMULATED FEED
        </span>
      </div>
    </div>
  );
}
