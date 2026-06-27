import React from 'react';
import type { Habit } from '../types';
import GridRow from './GridRow';
import { getNDaysWithOffset, getMonthName, getDayNum, getWeekdayStr, isWeekend, isToday } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Settings, Sun, Moon } from 'lucide-react';

interface BoardProps {
  habits: Habit[];
  onToggleDay: (habitId: string, date: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onSelectHabit: (habit: Habit) => void;
  columnWidth: number;
  setColumnWidth: (w: number) => void;
  startDateOffset: number;
  setStartDateOffset: (o: number) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

const Board: React.FC<BoardProps> = ({ 
  habits, 
  onToggleDay, 
  onDelete, 
  onSelectHabit,
  columnWidth,
  setColumnWidth,
  startDateOffset,
  setStartDateOffset,
  theme,
  setTheme
}) => {
  // We display 18 days in the visible window
  const visibleDaysCount = 18;
  const days = getNDaysWithOffset(visibleDaysCount, startDateOffset);

  // Calculate day completion sums
  const getDayCompletionCount = (dateStr: string) => {
    return habits.reduce((acc, habit) => {
      const log = habit.logs.find(l => l.date === dateStr);
      return acc + (log && log.status === 'completed' ? 1 : 0);
    }, 0);
  };

  const handlePageBack = () => {
    setStartDateOffset(startDateOffset + 1);
  };

  const handlePageForward = () => {
    setStartDateOffset(Math.max(0, startDateOffset - 1));
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 mt-6 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl transition-all duration-300 overflow-hidden">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <div className="w-max min-w-full pr-4 pb-2">
          {/* Board Header Grid */}
          <div className="flex items-stretch gap-1 mb-3">
            {/* Left Sidebar Header */}
            <div className="w-44 shrink-0 flex flex-col justify-between py-2 pr-2 border-r border-[var(--border-color)] sticky left-0 bg-[var(--bg-card)] z-10">
              <button className="text-accent hover:bg-accent/10 p-1.5 rounded-lg self-start transition-all cursor-pointer">
                <Settings size={18} />
              </button>
              
              <div className="text-[11px] font-bold text-[var(--text-secondary)] tracking-wider uppercase">
                ALL HABITS
              </div>
            </div>

            {/* Center Days Headers with Pagination Arrow Left */}
            <div className="flex items-center gap-[2px] flex-1 overflow-hidden select-none">
              {/* Paginate Back Arrow */}
              <button 
                onClick={handlePageBack}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] rounded transition-all cursor-pointer shrink-0"
                title="Go back 1 day"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Day Columns Headers */}
              <div className="flex gap-[2px] flex-1 justify-end overflow-hidden">
                {days.map((dateStr) => {
                  const weekend = isWeekend(dateStr);
                  const today = isToday(dateStr);
                  return (
                    <div 
                      key={dateStr}
                      style={{ width: `${columnWidth}px` }}
                      className={`shrink-0 flex flex-col items-center justify-center py-2 text-center rounded-[4px] transition-all duration-200 ${
                        today 
                          ? 'bg-accent text-white dark:text-slate-950 shadow-md font-bold' 
                          : weekend 
                            ? 'bg-[var(--cell-weekend)] text-[var(--text-secondary)] font-semibold' 
                            : 'text-[var(--text-secondary)] font-medium'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-80 select-none">
                        {getMonthName(dateStr)}
                      </span>
                      <span className="text-[15px] font-extrabold my-0.5 leading-none select-none">
                        {getDayNum(dateStr)}
                      </span>
                      <span className="text-[8px] uppercase tracking-tighter font-semibold select-none">
                        {getWeekdayStr(dateStr)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Paginate Forward Arrow */}
              <button 
                onClick={handlePageForward}
                disabled={startDateOffset === 0}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:hover:bg-transparent rounded transition-all cursor-pointer shrink-0"
                title="Go forward 1 day"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Right Stats Header */}
            <div className="w-48 shrink-0 flex flex-col justify-between py-2 pl-4 border-l border-[var(--border-color)] sticky right-0 bg-[var(--bg-card)] z-10">
              {/* Dark Mode Switcher */}
              <div className="flex items-center justify-end gap-1.5 self-end">
                {theme === 'dark' ? <Moon size={14} className="text-yellow-400" /> : <Sun size={14} className="text-amber-500" />}
                <button 
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors cursor-pointer relative ${theme === 'dark' ? 'bg-accent' : 'bg-gray-300'}`}
                  aria-label="Toggle dark mode"
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 text-[9px] font-bold text-center tracking-tight text-[var(--text-secondary)] uppercase">
                <span className="leading-tight">current streak</span>
                <span className="leading-tight">longest streak</span>
                <span className="leading-tight">total count</span>
              </div>
            </div>
          </div>

          {/* Habits Rows */}
          <div className="flex flex-col gap-[2px]">
            {habits.map(habit => (
              <GridRow 
                key={habit._id} 
                habit={habit} 
                days={days} 
                columnWidth={columnWidth}
                onToggleDay={onToggleDay} 
                onDelete={onDelete} 
                onSelect={() => onSelectHabit(habit)}
              />
            ))}

            {habits.length === 0 && (
              <div className="text-center py-16 text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-lg bg-[var(--hover-bg)]/20 my-2">
                <p className="mb-2 text-[var(--text-primary)] font-semibold">Your board is empty</p>
                <p className="text-sm">Create a habit above to start tracking your daily progress.</p>
              </div>
            )}
          </div>

          {/* Bottom Summary counts & Zoom slider */}
          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[var(--border-color)]">
            {/* Left Spacer */}
            <div className="w-44 shrink-0 text-[10px] font-semibold text-[var(--text-secondary)] pr-2 border-r border-[var(--border-color)] sticky left-0 bg-[var(--bg-card)] z-10">
              &nbsp;
            </div>

            {/* Center Completion Sums */}
            <div className="flex items-center gap-[2px] flex-1 overflow-hidden">
              <div className="w-7 shrink-0" />
              <div className="flex gap-[2px] flex-1 justify-end overflow-hidden">
                {days.map((dateStr) => {
                  const count = getDayCompletionCount(dateStr);
                  return (
                    <div 
                      key={dateStr}
                      style={{ width: `${columnWidth}px` }}
                      className="shrink-0 text-center text-xs font-bold text-[var(--text-secondary)] select-none opacity-80"
                    >
                      {count}
                    </div>
                  );
                })}
              </div>
              <div className="w-7 shrink-0" />
            </div>

            {/* Right Zoom Slider */}
            <div className="w-48 shrink-0 pl-4 border-l border-[var(--border-color)] flex items-center justify-between gap-2 sticky right-0 bg-[var(--bg-card)] z-10">
              <input 
                type="range"
                min={32}
                max={80}
                value={columnWidth}
                onChange={(e) => setColumnWidth(Number(e.target.value))}
                className="w-full h-1 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-accent focus:outline-none"
                title="Adjust column width"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;
