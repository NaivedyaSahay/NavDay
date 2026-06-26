export const toDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getLastNDays = (n: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(toDateStr(d));
  }
  
  return dates;
};

export const getMonthDay = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00'); // parse as local
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const getNDaysWithOffset = (n: number, offset: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  // End date is today minus offset
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - offset);
  
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(endDate.getDate() - i);
    dates.push(toDateStr(d));
  }
  
  return dates;
};

export const getMonthName = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short' });
};

export const getDayNum = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return String(d.getDate());
};

export const getWeekdayStr = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
};

export const isWeekend = (dateStr: string): boolean => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const isToday = (dateStr: string): boolean => {
  const today = new Date();
  return dateStr === toDateStr(today);
};

export interface ContributionDay {
  date: string;
  dayOfWeek: number; // 0 = Sunday, etc.
  monthLabel?: string; // e.g. "Jun" if first day of month or first week of month
}

export const getYearGrid = (): ContributionDay[][] => {
  const weeks: ContributionDay[][] = [];
  const today = new Date();
  
  // 52 weeks ago was approximately 364 days ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  // Align start date to Sunday
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);
  
  let current = new Date(startDate);
  
  for (let w = 0; w < 53; w++) {
    const week: ContributionDay[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toDateStr(current);
      
      // Determine if we should show a month label (first week of the month)
      let monthLabel: string | undefined = undefined;
      // If it's the first week of a month (day of month <= 7) and Sunday (d === 0)
      if (current.getDate() <= 7 && d === 0) {
        monthLabel = current.toLocaleDateString('en-US', { month: 'short' });
      }
      
      week.push({
        date: dateStr,
        dayOfWeek: d,
        monthLabel
      });
      
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
};
