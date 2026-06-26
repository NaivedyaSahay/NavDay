import { useEffect, useState } from 'react';
import Board from './components/Board';
import HabitManager from './components/HabitManager';
import HabitDetail from './components/HabitDetail';
import Auth from './components/Auth';
import type { Habit } from './types';
import * as api from './api';
import { Trophy, ChevronDown, User, LogOut, Sparkles } from 'lucide-react';

interface Quote {
  text: string;
  author: string;
  source?: string;
}

const quotes: Quote[] = [
  { text: "If you don't like your destiny, don't accept it. Instead have the courage to change it the way you want it to be.", author: "Naruto Uzumaki", source: "Naruto" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "If you don't take risks, you can't create a future!", author: "Monkey D. Luffy", source: "One Piece" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", author: "Kenshin Himura", source: "Rurouni Kenshin" },
  { text: "Arise, awake, and stop not until the goal is reached.", author: "Swami Vivekananda" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "No matter how hard or impossible it is, never lose sight of your goal.", author: "Monkey D. Luffy", source: "One Piece" },
  { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "Sometimes you must hurt in order to know, fall in order to grow, lose in order to gain because life's greatest lessons are learnt through pain.", author: "Pain", source: "Naruto" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Power is not will, it is the phenomenon of physically making things happen.", author: "Madara Uchiha", source: "Naruto" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" }
];

function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('navday_theme') as 'light' | 'dark') || 'light'
  );
  const [columnWidth, setColumnWidth] = useState(48);
  const [startDateOffset, setStartDateOffset] = useState(0);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('navday_token'));
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(
    localStorage.getItem('navday_user') ? JSON.parse(localStorage.getItem('navday_user')!) : null
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Motivational Quote State
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    // Pick a random quote on mount
    setQuoteIdx(Math.floor(Math.random() * quotes.length));
  }, []);

  // Sync theme with HTML document element class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('navday_theme', theme);
  }, [theme]);

  // Load habits when token changes
  useEffect(() => {
    if (token) {
      loadHabits();
    } else {
      setHabits([]);
      setLoading(false);
    }
  }, [token]);

  const loadHabits = async () => {
    setLoading(true);
    try {
      const data = await api.fetchHabits();
      setHabits(data);
    } catch (error) {
      console.error('Failed to load habits:', error);
      // If unauthorized, clear session
      if ((error as any).response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (token: string, user: { id: string; name: string; email: string }) => {
    localStorage.setItem('navday_token', token);
    localStorage.setItem('navday_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('navday_token');
    localStorage.removeItem('navday_user');
    setToken(null);
    setUser(null);
    setSelectedHabitId(null);
    setHabits([]);
    setShowProfileMenu(false);
  };

  const handleAddHabit = async (title: string, color: string) => {
    try {
      const newHabit = await api.createHabit(title, color);
      setHabits(prev => [...prev, newHabit]);
    } catch (error) {
      console.error('Failed to create habit:', error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await api.deleteHabit(id);
      setHabits(prev => prev.filter(h => h._id !== id));
      if (selectedHabitId === id) {
        setSelectedHabitId(null);
      }
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const handleToggleDay = async (habitId: string, date: string, currentStatus: string) => {
    let newStatus: 'completed' | 'skipped' | 'none' = 'completed';
    if (currentStatus === 'completed') newStatus = 'skipped';
    else if (currentStatus === 'skipped') newStatus = 'none';

    // Optimistic update
    setHabits(prev => prev.map(habit => {
      if (habit._id !== habitId) return habit;
      
      const logs = [...habit.logs];
      const index = logs.findIndex(l => l.date === date);
      if (index >= 0) {
        if (newStatus === 'none') logs.splice(index, 1);
        else logs[index].status = newStatus;
      } else if (newStatus !== 'none') {
        logs.push({ date, status: newStatus });
      }

      return { ...habit, logs };
    }));

    try {
      const updatedHabit = await api.updateLogStatus(habitId, date, newStatus);
      // Sync with backend state (which includes updated streaks)
      setHabits(prev => prev.map(h => h._id === habitId ? updatedHabit : h));
    } catch (error) {
      console.error('Failed to update status:', error);
      loadHabits(); // Revert on failure
    }
  };

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % quotes.length);
  };

  const totalCompletions = habits.reduce((acc, habit) => {
    return acc + habit.logs.filter(l => l.status === 'completed').length;
  }, 0);

  const selectedHabit = habits.find(h => h._id === selectedHabitId);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300 py-6 px-4 md:px-8 font-sans selection:bg-accent/30">
      {/* Top Navigation Bar */}
      <header className="max-w-5xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
        {/* Brand logo & name */}
        <div 
          onClick={() => setSelectedHabitId(null)}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          {/* Custom Everyday Logo */}
          <div className="grid grid-cols-2 gap-[2px] w-6 h-6 p-[2px] rounded bg-accent shadow-sm transition-transform group-hover:scale-105">
            <div className="bg-accent opacity-85 rounded-sm" />
            <div className="bg-accent opacity-50 rounded-sm" />
            <div className="bg-accent opacity-65 rounded-sm" />
            <div className="bg-accent opacity-100 rounded-sm" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            NavDay
          </span>
        </div>

        {/* Right Nav Icons */}
        {token && user && (
          <div className="flex items-center gap-6 text-sm font-semibold text-[var(--text-secondary)] relative">
            <div className="flex items-center gap-1.5 cursor-help" title="Total completed tasks">
              <Trophy size={16} className="text-accent" />
              <span>{totalCompletions}</span>
            </div>

            <div 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1 hover:text-[var(--text-primary)] cursor-pointer select-none py-1.5"
            >
              <User size={16} />
              <span className="max-w-[100px] truncate">{user.name}</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl py-1.5 z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-[var(--hover-bg)] font-bold transition-all text-left cursor-pointer"
                >
                  <LogOut size={14} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main routing rendering */}
      {!token ? (
        /* Render Signup / Login Screen */
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : loading ? (
        /* Loading Spinner */
        <div className="flex justify-center mt-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
        </div>
      ) : selectedHabitId && selectedHabit ? (
        /* Render detailed habit view */
        <HabitDetail 
          habit={selectedHabit}
          onBack={() => setSelectedHabitId(null)}
          onToggleDay={handleToggleDay}
        />
      ) : (
        /* Render main board view */
        <div className="space-y-6">
          {/* Motivational Quotes Banner */}
          <div className="w-full max-w-5xl mx-auto p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-md flex items-start gap-4 transition-all duration-300 relative overflow-hidden group">
            <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0 pr-16">
              <p className="text-sm italic font-medium leading-relaxed text-[var(--text-primary)] mb-1.5">
                "{quotes[quoteIdx].text}"
              </p>
              <p className="text-xs font-bold text-[var(--text-secondary)]">
                — {quotes[quoteIdx].author} 
                {quotes[quoteIdx].source && <span className="font-normal opacity-85"> ({quotes[quoteIdx].source})</span>}
              </p>
            </div>

            <button 
              onClick={nextQuote}
              className="absolute right-4 top-4 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] shadow-sm transition-all cursor-pointer"
            >
              Get Motivated
            </button>
          </div>

          <HabitManager onAddHabit={handleAddHabit} />
          
          <Board 
            habits={habits} 
            onToggleDay={handleToggleDay} 
            onDelete={handleDeleteHabit}
            onSelectHabit={(h) => setSelectedHabitId(h._id)}
            columnWidth={columnWidth}
            setColumnWidth={setColumnWidth}
            startDateOffset={startDateOffset}
            setStartDateOffset={setStartDateOffset}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
      )}
    </div>
  );
}

export default App;
