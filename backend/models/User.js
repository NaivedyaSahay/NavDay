const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Mongoose User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

const MongooseUser = mongoose.model('User', userSchema);

// Local User database path
const USER_DB_PATH = path.join(__dirname, '../users.json');
if (!fs.existsSync(USER_DB_PATH)) {
  fs.writeFileSync(USER_DB_PATH, JSON.stringify([], null, 2));
}

function readUsersDb() {
  try {
    return JSON.parse(fs.readFileSync(USER_DB_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeUsersDb(data) {
  fs.writeFileSync(USER_DB_PATH, JSON.stringify(data, null, 2));
}

class LocalUserDocument {
  constructor(data) {
    this._id = data._id || Math.random().toString(36).substring(2, 9);
    this.name = data.name;
    this.email = data.email.toLowerCase();
    this.password = data.password;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      password: this.password,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async save() {
    const db = readUsersDb();
    const index = db.findIndex(u => u._id === this._id);
    this.updatedAt = new Date().toISOString();
    const docData = this.toObject();
    if (index >= 0) {
      db[index] = docData;
    } else {
      db.push(docData);
    }
    writeUsersDb(db);
    return this;
  }
}

class UserWrapper {
  constructor(data) {
    if (mongoose.connection.readyState === 1) {
      return new MongooseUser(data);
    } else {
      return new LocalUserDocument(data);
    }
  }

  static async findOne({ email }) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.findOne({ email });
    } else {
      const db = readUsersDb();
      const user = db.find(u => u.email === email.toLowerCase());
      if (!user) return null;
      return new LocalUserDocument(user);
    }
  }

  static async findById(id) {
    if (mongoose.connection.readyState === 1) {
      return MongooseUser.findById(id);
    } else {
      const db = readUsersDb();
      const user = db.find(u => u._id === id);
      if (!user) return null;
      return new LocalUserDocument(user);
    }
  }
}

module.exports = UserWrapper;
