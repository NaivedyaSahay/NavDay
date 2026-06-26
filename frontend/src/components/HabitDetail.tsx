import React, { useRef, useState } from 'react';
import type { Habit } from '../types';
import { getYearGrid, toDateStr, isWeekend } from '../utils/dateUtils';
import { ArrowLeft, Eye, EyeOff, Download } from 'lucide-react';

interface HabitDetailProps {
  habit: Habit;
  onBack: () => void;
  onToggleDay: (habitId: string, date: string, currentStatus: string) => void;
}

const HabitDetail: React.FC<HabitDetailProps> = ({ habit, onBack, onToggleDay }) => {
  const [hideStats, setHideStats] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const weeks = getYearGrid();

  // Create log map
  const logMap: Record<string, string> = {};
  habit.logs.forEach(l => { logMap[l.date] = l.status; });

  // Calculate historic streaks for heatmap cell opacity
  const streakMap: Record<string, number> = {};
  let tempStreak = 0;
  
  if (habit.logs.length > 0) {
    const sortedDates = habit.logs.map(l => l.date).sort();
    const firstDateStr = sortedDates[0];
    const todayStr = toDateStr(new Date());
    
    let currentD = new Date(firstDateStr + 'T00:00:00');
    const endD = new Date(todayStr + 'T00:00:00');
    
    while (currentD <= endD) {
      const dStr = toDateStr(currentD);
      const status = logMap[dStr] || 'none';
      
      if (status === 'completed') {
        tempStreak++;
      } else if (status === 'skipped') {
        // Streak continues
      } else {
        tempStreak = 0;
      }
      
      streakMap[dStr] = tempStreak;
      currentD.setDate(currentD.getDate() + 1);
    }
  }

  const hexToRgba = (hex: string, opacity: number) => {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const r = parseInt(c[0] + c[1], 16);
    const g = parseInt(c[2] + c[3], 16);
    const b = parseInt(c[4] + c[5], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const getCellBackground = (dateStr: string) => {
    const status = logMap[dateStr] || 'none';
    if (status === 'none') return '';
    if (status === 'skipped') return 'rgba(128, 128, 128, 0.3)';
    
    const streak = streakMap[dateStr] || 1;
    const maxDays = 10;
    const opacity = Math.min(0.2 + (streak * (0.8 / maxDays)), 1.0);
    return hexToRgba(habit.color, opacity);
  };

  const totalCompletions = habit.logs.filter(l => l.status === 'completed').length;
  
  // Calculate completion rate based on creation date or 365 days
  const daysSinceCreation = Math.max(
    1,
    Math.ceil((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  );
  const completionRate = Math.min(100, Math.round((totalCompletions / daysSinceCreation) * 100));

  // Exporter to download habit card as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 800, 360);

    // Draw logo & brand
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#059669';
    ctx.fillStyle = hexToRgba(accentColor, 0.85);
    ctx.fillRect(630, 20, 14, 14); // Left top
    ctx.fillStyle = hexToRgba(accentColor, 0.50);
    ctx.fillRect(646, 20, 14, 14); // Right top
    ctx.fillStyle = hexToRgba(accentColor, 0.65);
    ctx.fillRect(630, 36, 14, 14); // Left bottom
    ctx.fillStyle = hexToRgba(accentColor, 1.00);
    ctx.fillRect(646, 36, 14, 14); // Right bottom

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 13px ui-sans-serif, sans-serif';
    ctx.fillText('image by', 560, 33);
    ctx.fillText('NavDay.app', 670, 33);

    // Draw title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px ui-sans-serif, sans-serif';
    ctx.fillText(habit.title, 40, 50);

    // Draw habit color dot
    const titleWidth = ctx.measureText(habit.title).width;
    ctx.beginPath();
    ctx.arc(40 + titleWidth + 20, 40, 7, 0, 2 * Math.PI);
    ctx.fillStyle = habit.color;
    ctx.fill();

    // Draw separator
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 70);
    ctx.lineTo(760, 70);
    ctx.stroke();

    // Draw actual contribution board (heatmap)
    const startX = 80;
    const startY = 95;
    const cellSize = 10;
    const gap = 2.5;
    const step = cellSize + gap; // 12.5px

    // Draw Y-axis labels (Sun, Tue, Thu, Sat)
    ctx.fillStyle = '#64748b';
    ctx.font = '600 10px ui-sans-serif, sans-serif';
    ctx.fillText('Sun', 40, startY + 0 * step + 8);
    ctx.fillText('Tue', 40, startY + 2 * step + 8);
    ctx.fillText('Thu', 40, startY + 4 * step + 8);
    ctx.fillText('Sat', 40, startY + 6 * step + 8);

    // Draw month labels and columns
    weeks.forEach((week, wIdx) => {
      // Draw month label if present
      const monthDay = week.find(d => d.monthLabel);
      if (monthDay && monthDay.monthLabel) {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 9px ui-sans-serif, sans-serif';
        ctx.fillText(monthDay.monthLabel, startX + wIdx * step, startY - 8);
      }

      // Draw weekly column squares
      week.forEach((day, dIdx) => {
        const status = logMap[day.date] || 'none';
        const cellBg = getCellBackground(day.date);
        
        ctx.fillStyle = cellBg || '#ebedf0';
        // If status is 'none' and we are on a weekend, draw with a slightly shaded color like the UI
        if (status === 'none') {
          ctx.fillStyle = isWeekend(day.date) ? '#f3f4f6' : '#ebedf0';
        }
        
        // Draw the square
        ctx.fillRect(startX + wIdx * step, startY + dIdx * step, cellSize, cellSize);
      });
    });

    // Draw stats panel background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 220, 720, 95);
    ctx.strokeRect(40, 220, 720, 95);

    // Draw Stat Titles
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px ui-sans-serif, sans-serif';
    ctx.fillText('CURRENT STREAK', 55, 290);
    ctx.fillText('LONGEST STREAK', 235, 290);
    ctx.fillText('TOTAL COUNT', 425, 290);
    ctx.fillText('COMPLETION RATE', 615, 290);

    // Draw Stat Values
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px ui-sans-serif, sans-serif';
    ctx.fillText(String(habit.currentStreak), 55, 265);
    ctx.fillText(String(habit.longestStreak), 235, 265);
    ctx.fillText(String(totalCompletions), 425, 265);
    
    ctx.fillStyle = '#ef4444'; // Red color for completion rate as in screenshot
    ctx.fillText(`${completionRate}%`, 615, 265);

    // Download action
    const link = document.createElement('a');
    link.download = `${habit.title.toLowerCase().replace(/\s+/g, '-')}-everyday.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleTwitterShare = () => {
    const text = `I tracked my habit "${habit.title}" using NavDay.app! Current streak: ${habit.currentStreak} days, longest streak: ${habit.longestStreak} days.`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl mt-6 transition-all duration-300">
      {/* Hidden canvas for drawing exports */}
      <canvas ref={canvasRef} width={800} height={360} className="hidden" />

      {/* Header controls */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] font-medium text-sm transition-all"
        >
          <ArrowLeft size={16} />
          Go back
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setHideStats(!hideStats)}
            className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] transition-all cursor-pointer"
            title={hideStats ? "Show stats" : "Hide stats"}
          >
            {hideStats ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] mb-2">
              {habit.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Habit color:</span>
              <div className="w-3.5 h-3.5 rounded-full border border-[var(--border-color)]" style={{ backgroundColor: habit.color }} />
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1 text-[var(--text-secondary)] font-medium text-sm">
            <span>image by</span>
            <div className="flex items-center gap-1 ml-1 bg-[var(--bg-app)] border border-[var(--border-color)] px-2 py-1 rounded">
              <div className="grid grid-cols-2 gap-[1.5px] w-3.5 h-3.5 p-[0.5px] rounded bg-accent">
                <div className="bg-accent opacity-85 rounded-[1px]" />
                <div className="bg-accent opacity-50 rounded-[1px]" />
                <div className="bg-accent opacity-65 rounded-[1px]" />
                <div className="bg-accent opacity-100 rounded-[1px]" />
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)]">NavDay.app</span>
            </div>
          </div>
        </div>

        {/* Heatmap Graph */}
        <div className="overflow-x-auto hide-scrollbar pb-4 border-b border-[var(--border-color)] mb-6">
          <div className="min-w-[800px] flex flex-col">
            {/* Months Header Line */}
            <div className="flex pl-8 mb-2">
              {weeks.map((week, idx) => {
                const firstDayWithLabel = week.find(d => d.monthLabel);
                return (
                  <div key={idx} className="w-[14px] shrink-0 text-[10px] text-[var(--text-secondary)] font-semibold select-none">
                    {firstDayWithLabel ? firstDayWithLabel.monthLabel : ''}
                  </div>
                );
              })}
            </div>

            {/* Heatmap columns */}
            <div className="flex gap-[3px]">
              {/* Left Y-axis weekday labels */}
              <div className="flex flex-col justify-between w-8 shrink-0 text-[10px] text-[var(--text-secondary)] font-semibold pr-2 select-none py-1.5">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {/* Weekly columns of squares */}
              <div className="flex gap-[3px] flex-1">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px] w-[11px] shrink-0">
                    {week.map((day, dIdx) => {
                      const status = logMap[day.date] || 'none';
                      const cellBg = getCellBackground(day.date);
                      return (
                        <button
                          key={dIdx}
                          onClick={() => onToggleDay(habit._id, day.date, status)}
                          className={`w-[11px] h-[11px] rounded-[1.5px] border-[0.5px] border-[var(--cell-border)] transition-all cursor-pointer hover:scale-125 hover:z-10 focus:outline-none ${
                            status === 'none' 
                              ? 'bg-[var(--cell-empty)] hover:bg-[var(--text-secondary)]/30' 
                              : ''
                          }`}
                          style={{
                            backgroundColor: cellBg,
                          }}
                          title={`${day.date}: ${status === 'none' ? 'No log' : status}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        {!hideStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border-color)] rounded-xl overflow-hidden divide-x divide-y md:divide-y-0 divide-[var(--border-color)] bg-[var(--hover-bg)]/20">
            <div className="flex flex-col justify-center p-6 text-left">
              <span className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                {habit.currentStreak}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                CURRENT STREAK
              </span>
            </div>

            <div className="flex flex-col justify-center p-6 text-left">
              <span className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                {habit.longestStreak}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                LONGEST STREAK
              </span>
            </div>

            <div className="flex flex-col justify-center p-6 text-left">
              <span className="text-3xl font-extrabold text-[var(--text-primary)] mb-1">
                {totalCompletions}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                TOTAL COUNT
              </span>
            </div>

            <div className="flex flex-col justify-center p-6 text-left">
              <span className="text-3xl font-extrabold text-red-500 mb-1">
                {completionRate}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                COMPLETION RATE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Share / Download Footer */}
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors font-semibold cursor-pointer"
        >
          <Download size={16} />
          Download this image
        </button>

        <button 
          onClick={handleTwitterShare}
          className="flex items-center gap-1.5 hover:text-blue-500 transition-colors font-semibold cursor-pointer"
        >
          Share:
          <svg viewBox="0 0 24 24" width="15" height="15" className="fill-current">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HabitDetail;
