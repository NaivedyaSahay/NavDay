import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface HabitManagerProps {
  onAddHabit: (title: string, color: string) => void;
}

const colors = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const HabitManager: React.FC<HabitManagerProps> = ({ onAddHabit }) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(colors[4]); // default cyan

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddHabit(title, selectedColor);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-5xl mx-auto shadow-xl transition-all duration-300">
      <div className="flex-1">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What habit do you want to build? (e.g., Read for 30 minutes)"
          className="w-full bg-[var(--bg-app)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[var(--bg-app)] px-2 sm:px-4 py-2 rounded-lg border border-[var(--border-color)] justify-center">
        {colors.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => setSelectedColor(color)}
            className={`w-5 h-5 rounded-full transition-all cursor-pointer ${
              selectedColor === color 
                ? 'scale-[1.25] ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg-card)]' 
                : 'hover:scale-110 opacity-80 hover:opacity-100'
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Select color ${color}`}
          />
        ))}
      </div>
      <button 
        type="submit"
        disabled={!title.trim()}
        className="bg-accent hover:bg-accent-hover text-white dark:text-slate-950 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md cursor-pointer"
      >
        <Plus size={18} />
        Add Habit
      </button>
    </form>
  );
};

export default HabitManager;
