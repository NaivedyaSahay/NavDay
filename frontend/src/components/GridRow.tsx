import type { Habit } from '../types';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { toDateStr, isWeekend } from '../utils/dateUtils';

interface GridRowProps {
  habit: Habit;
  days: string[];
  columnWidth: number;
  onToggleDay: (habitId: string, date: string, currentStatus: string) => void;
  onDelete: (id: string) => void;
  onSelect: () => void;
}

const GridRow: React.FC<GridRowProps> = ({ 
  habit, 
  days, 
  columnWidth,
  onToggleDay, 
  onDelete,
  onSelect
}) => {
  // Map logs
  const logMap: Record<string, string> = {};
  habit.logs.forEach(l => { logMap[l.date] = l.status; });

  // Calculate streaks up to each visible day
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

  // Calculate hex to rgba for opacity
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
    if (status === 'skipped') return 'rgba(128, 128, 128, 0.3)'; // Gray for skipped
    
    // Calculate opacity based on streak for completed days
    const streak = streakMap[dateStr] || 1;
    const maxDays = 10;
    const opacity = Math.min(0.2 + (streak * (0.8 / maxDays)), 1.0);
    
    return hexToRgba(habit.color, opacity);
  };

  const totalCount = habit.logs.filter(l => l.status === 'completed').length;

  return (
    <div className="flex items-stretch gap-1 group">
      {/* Left Sidebar Habit Title (Clickable for detail view) */}
      <div className="w-44 shrink-0 flex items-center justify-between px-3 py-2 bg-[var(--bg-card)] border-r border-[var(--border-color)] text-sm font-semibold text-[var(--text-primary)] sticky left-0 z-10">
        <button 
          onClick={onSelect}
          className="flex items-center gap-2 overflow-hidden hover:opacity-85 text-left cursor-pointer flex-1"
        >
          <div className="w-3.5 h-3.5 rounded-sm shrink-0 shadow-sm border border-[var(--border-color)]" style={{ backgroundColor: habit.color }} />
          <span className="truncate hover:underline">{habit.title}</span>
        </button>
        <button 
          onClick={() => onDelete(habit._id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
          aria-label="Delete habit"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Center Day Cells */}
      <div className="flex items-center gap-[2px] flex-1 overflow-hidden">
        <div className="w-7 shrink-0" />
        <div className="flex gap-[2px] flex-1 justify-end overflow-hidden">
          {days.map(dateStr => {
            const status = logMap[dateStr] || 'none';
            const weekend = isWeekend(dateStr);
            const cellBg = getCellBackground(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => onToggleDay(habit._id, dateStr, status)}
                className={clsx(
                  "rounded-[3.5px] border-[0.5px] border-[var(--cell-border)] shrink-0 transition-all cursor-pointer",
                  "hover:scale-[1.15] hover:z-10 focus:outline-none focus:ring-1 focus:ring-accent",
                  status === 'none' && (weekend ? "bg-[var(--cell-weekend)]" : "bg-[var(--cell-empty)]")
                )}
                style={{
                  width: `${columnWidth}px`,
                  height: `${columnWidth - 4}px`, // Keep it slightly rectangular or square
                  backgroundColor: cellBg,
                }}
                title={`${dateStr}: ${status} (Streak: ${streakMap[dateStr] || 0})`}
              />
            );
          })}
        </div>
        <div className="w-7 shrink-0" />
      </div>

      {/* Right Stats Columns */}
      <div className="w-48 shrink-0 grid grid-cols-3 gap-1 items-center text-center text-xs text-[var(--text-secondary)] font-semibold border-l border-[var(--border-color)] pl-4 bg-[var(--bg-card)] sticky right-0 z-10">
        <span>{habit.currentStreak}</span>
        <span>{habit.longestStreak}</span>
        <span>{totalCount}</span>
      </div>
    </div>
  );
};

export default GridRow;
