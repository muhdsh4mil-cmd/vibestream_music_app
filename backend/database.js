const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const USERS_FILE = path.join(__dirname, 'users.json');
const isMongoConfigured = !!process.env.MONGODB_URI;

// Initialize connection if MongoDB is configured
if (isMongoConfigured) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[Database] Connected to Cloud MongoDB successfully!'))
    .catch((err) => console.error('[Database] MongoDB connection failed:', err.message));
} else {
  console.log('[Database] MONGODB_URI not set. Using local JSON fallback (users.json).');
}

// 1. Mongoose Model (for MongoDB storage)
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);

// 2. Data Access Abstraction Methods (Works for both MongoDB and local JSON fallback!)
const db = {
  // Read all users
  async getAllUsers() {
    if (isMongoConfigured) {
      try {
        const users = await MongoUser.find({}).sort({ createdAt: -1 });
        return users.map(u => ({
          id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          password: u.password,
          createdAt: u.createdAt.toISOString()
        }));
      } catch (err) {
        console.error('[Database] MongoDB Read Error:', err);
        return [];
      }
    } else {
      try {
        if (!fs.existsSync(USERS_FILE)) {
          fs.writeFileSync(USERS_FILE, '[]', 'utf8');
          return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
      } catch (err) {
        console.error('[Database] Local JSON Read Error:', err);
        return [];
      }
    }
  },

  // Find user by email
  async findUserByEmail(email) {
    const searchEmail = email.trim().toLowerCase();
    if (isMongoConfigured) {
      try {
        const user = await MongoUser.findOne({ email: searchEmail });
        if (!user) return null;
        return {
          id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          password: user.password,
          createdAt: user.createdAt.toISOString()
        };
      } catch (err) {
        console.error('[Database] MongoDB Find Error:', err);
        return null;
      }
    } else {
      const users = await this.getAllUsers();
      return users.find(u => u.email.toLowerCase() === searchEmail) || null;
    }
  },

  // Add a new user
  async createUser(userData) {
    if (isMongoConfigured) {
      try {
        const newUser = new MongoUser({
          fullName: userData.fullName.trim(),
          email: userData.email.trim().toLowerCase(),
          password: userData.password
        });
        const saved = await newUser.save();
        return {
          id: saved._id.toString(),
          fullName: saved.fullName,
          email: saved.email,
          createdAt: saved.createdAt.toISOString()
        };
      } catch (err) {
        console.error('[Database] MongoDB Save Error:', err);
        throw new Error('Failed to save user to cloud database.');
      }
    } else {
      const users = await this.getAllUsers();
      const newUser = {
        id: require('crypto').randomBytes(16).toString('hex'),
        fullName: userData.fullName.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
        return {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          createdAt: newUser.createdAt
        };
      } catch (err) {
        console.error('[Database] Local JSON Write Error:', err);
        throw new Error('Failed to write account records to local database.');
      }
    }
  },

  // Update password (used for legacy auto-upgrades to bcrypt)
  async updateUserPassword(email, newHashedPassword) {
    const searchEmail = email.trim().toLowerCase();
    if (isMongoConfigured) {
      try {
        await MongoUser.updateOne({ email: searchEmail }, { password: newHashedPassword });
        return true;
      } catch (err) {
        console.error('[Database] MongoDB Update Error:', err);
        return false;
      }
    } else {
      const users = await this.getAllUsers();
      const idx = users.findIndex(u => u.email.toLowerCase() === searchEmail);
      if (idx !== -1) {
        users[idx].password = newHashedPassword;
        try {
          fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
          return true;
        } catch (err) {
          console.error('[Database] Local JSON Write Error on update:', err);
          return false;
        }
      }
      return false;
    }
  },

  // Delete a user
  async deleteUser(email) {
    const searchEmail = email.trim().toLowerCase();
    if (isMongoConfigured) {
      try {
        const result = await MongoUser.deleteOne({ email: searchEmail });
        return result.deletedCount > 0;
      } catch (err) {
        console.error('[Database] MongoDB Delete Error:', err);
        return false;
      }
    } else {
      const users = await this.getAllUsers();
      const initialLength = users.length;
      const filtered = users.filter(u => u.email.toLowerCase() !== searchEmail);
      if (filtered.length === initialLength) return false;
      try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
        return true;
      } catch (err) {
        console.error('[Database] Local JSON Delete Error:', err);
        return false;
      }
    }
  }
};

module.exports = db;
