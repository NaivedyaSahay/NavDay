const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mongoose Schema and Model
const logSchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'skipped', 'none'],
    default: 'none',
  }
}, { _id: false });

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
  },
  logs: [logSchema]
}, { timestamps: true });

const MongooseHabit = mongoose.model('Habit', habitSchema);

// Local File-based Database implementation
const DB_PATH = path.join(__dirname, '../db.json');

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

class LocalHabitDocument {
  constructor(data) {
    this._id = data._id || Math.random().toString(36).substring(2, 9);
    this.userId = data.userId;
    this.title = data.title;
    this.color = data.color;
    this.logs = data.logs || [];
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toObject() {
    return {
      _id: this._id,
      userId: this.userId,
      title: this.title,
      color: this.color,
      logs: this.logs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save() {
    const db = readDb();
    const index = db.findIndex(h => h._id === this._id);
    this.updatedAt = new Date().toISOString();
    
    const docData = this.toObject();
    if (index >= 0) {
      db[index] = docData;
    } else {
      db.push(docData);
    }
    writeDb(db);
    return this;
  }
}

// Wrapper/Proxy class that delegates based on Mongoose connection state
class HabitWrapper {
  constructor(data) {
    if (mongoose.connection.readyState === 1) {
      return new MongooseHabit(data);
    } else {
      return new LocalHabitDocument(data);
    }
  }

  static find(filter = {}) {
    if (mongoose.connection.readyState === 1) {
      return MongooseHabit.find(filter);
    } else {
      const db = readDb();
      let habits = db.map(h => new LocalHabitDocument(h));
      
      if (filter.userId) {
        habits = habits.filter(h => h.userId === filter.userId);
      }
      
      const query = {
        sort(sortObj) {
          const keys = Object.keys(sortObj);
          if (keys.length > 0) {
            const key = keys[0];
            const order = sortObj[key];
            habits.sort((a, b) => {
              if (a[key] < b[key]) return -1 * order;
              if (a[key] > b[key]) return 1 * order;
              return 0;
            });
          }
          return query;
        },
        then(resolve, reject) {
          resolve(habits);
        }
      };
      return query;
    }
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseHabit.findById(id);
    } else {
      const db = readDb();
      const data = db.find(h => h._id === id);
      if (!data) return null;
      return new LocalHabitDocument(data);
    }
  }

  static async findByIdAndDelete(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseHabit.findByIdAndDelete(id);
    } else {
      let db = readDb();
      const data = db.find(h => h._id === id);
      db = db.filter(h => h._id !== id);
      writeDb(db);
      return data ? new LocalHabitDocument(data) : null;
    }
  }
}

module.exports = HabitWrapper;
