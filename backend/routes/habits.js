const express = require('express');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');
const router = express.Router();

const toDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateStreaks = (logs) => {
  if (!logs || logs.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  const logMap = {};
  logs.forEach(l => { logMap[l.date] = l.status; });

  const sortedDates = logs.map(l => l.date).sort();
  const firstDateStr = sortedDates[0];
  
  const todayStr = toDateStr(new Date());

  // Check if first logged date is after today (shouldn't happen, but just in case)
  if (firstDateStr > todayStr) return { currentStreak: 0, longestStreak: 0 };

  const dates = [];
  let currentD = new Date(firstDateStr + 'T00:00:00'); // Use local time parsed from string
  const endD = new Date(todayStr + 'T00:00:00');

  while (currentD <= endD) {
    dates.push(toDateStr(currentD));
    currentD.setDate(currentD.getDate() + 1);
  }

  let longest = 0;
  let tempStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const status = logMap[date] || 'none';

    if (status === 'completed') {
      tempStreak++;
      if (tempStreak > longest) longest = tempStreak;
    } else if (status === 'skipped') {
      // Temp streak continues
    } else {
      // "none"
      if (date === todayStr) {
        // do not reset tempStreak if today hasn't been filled yet
      } else {
        tempStreak = 0;
      }
    }
  }

  return { currentStreak: tempStreak, longestStreak: longest };
};

// GET all habits (scoped to user)
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: 1 });
    
    // Add streak info to each habit
    const habitsWithStreaks = habits.map(habit => {
      const { currentStreak, longestStreak } = calculateStreaks(habit.logs);
      return {
        ...habit.toObject(),
        currentStreak,
        longestStreak
      };
    });

    res.json(habitsWithStreaks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new habit
router.post('/', auth, async (req, res) => {
  const { title, color } = req.body;
  const habit = new Habit({ userId: req.user._id, title, color, logs: [] });
  try {
    const newHabit = await habit.save();
    res.status(201).json({ ...newHabit.toObject(), currentStreak: 0, longestStreak: 0 });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update log status
router.put('/:id/logs', auth, async (req, res) => {
  const { date, status } = req.body;
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });
    
    // Authorization check
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this habit' });
    }

    const existingLogIndex = habit.logs.findIndex(l => l.date === date);
    if (existingLogIndex >= 0) {
      if (status === 'none') {
        habit.logs.splice(existingLogIndex, 1);
      } else {
        habit.logs[existingLogIndex].status = status;
      }
    } else {
      if (status !== 'none') {
        habit.logs.push({ date, status });
      }
    }

    await habit.save();
    const { currentStreak, longestStreak } = calculateStreaks(habit.logs);
    
    res.json({ ...habit.toObject(), currentStreak, longestStreak });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found' });

    // Authorization check
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this habit' });
    }

    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted Habit' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
