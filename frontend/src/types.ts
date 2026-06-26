export interface Log {
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped' | 'none';
}

export interface Habit {
  _id: string;
  title: string;
  color: string;
  logs: Log[];
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}
