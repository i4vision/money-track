import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const defaultDbPath = join(__dirname, 'database.sqlite');
const dbPath = process.env.DB_PATH || defaultDbPath;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password TEXT,
      isAdmin BOOLEAN,
      avatarUrl TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      creatorId TEXT NOT NULL,
      counterpartyId TEXT NOT NULL,
      amount REAL,
      assetType TEXT NOT NULL,
      itemName TEXT,
      isReturned BOOLEAN,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (creatorId) REFERENCES users(id),
      FOREIGN KEY (counterpartyId) REFERENCES users(id)
    )
  `);

  // Insert default admin if users table is empty
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    if (row.count === 0) {
      const defaultAdmin = {
        id: 'admin',
        name: 'Admin',
        password: 'admin',
        isAdmin: 1,
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
      };
      db.run(
        `INSERT INTO users (id, name, password, isAdmin, avatarUrl) VALUES (?, ?, ?, ?, ?)`,
        [defaultAdmin.id, defaultAdmin.name, defaultAdmin.password, defaultAdmin.isAdmin, defaultAdmin.avatarUrl],
        (err) => {
           if (err) console.error('Error inserting default admin:', err);
           else console.log('Default Admin user created.');
        }
      );
    }
  });
});


// --- User Routes ---

// Get all users
app.get('/api/users', (req, res) => {
  db.all("SELECT * FROM users", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Convert SQLite 0/1 back to booleans
    const users = rows.map((u) => ({
      ...u,
      isAdmin: Boolean(u.isAdmin)
    }));
    res.json(users);
  });
});

// Create user
app.post('/api/users', (req, res) => {
  const { id, name, password, isAdmin, avatarUrl } = req.body;
  const isAdmInt = isAdmin ? 1 : 0;
  
  db.run(
    `INSERT INTO users (id, name, password, isAdmin, avatarUrl) VALUES (?, ?, ?, ?, ?)`,
    [id, name, password, isAdmInt, avatarUrl],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(req.body);
    }
  );
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  // Delete associated transactions first
  db.run(`DELETE FROM transactions WHERE creatorId = ? OR counterpartyId = ?`, [id, id], function (err) {
    if (err) {
       res.status(500).json({ error: err.message });
       return;
    }
    
    // Then delete the user
    db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
      if (err) {
         res.status(500).json({ error: err.message });
         return;
      }
      res.json({ success: true });
    });
  });
});



// --- Transaction Routes ---

// Get all transactions
app.get('/api/transactions', (req, res) => {
  db.all("SELECT * FROM transactions ORDER BY timestamp DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Convert 0/1 back to booleans
    const transactions = rows.map((t) => ({
      ...t,
      isReturned: t.isReturned !== null ? Boolean(t.isReturned) : undefined
    }));
    res.json(transactions);
  });
});

// Create transaction
app.post('/api/transactions', (req, res) => {
  const { id, creatorId, counterpartyId, amount, assetType, itemName, isReturned, type, status, description, timestamp } = req.body;
  
  const isRetInt = isReturned === true ? 1 : isReturned === false ? 0 : null;

  db.run(
    `INSERT INTO transactions (id, creatorId, counterpartyId, amount, assetType, itemName, isReturned, type, status, description, timestamp) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, creatorId, counterpartyId, amount, assetType, itemName, isRetInt, type, status, description, timestamp],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(req.body);
    }
  );
});

// Update transaction status
app.patch('/api/transactions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run(`UPDATE transactions SET status = ? WHERE id = ?`, [status, id], function (err) {
    if (err) {
       res.status(500).json({ error: err.message });
       return;
    }
    res.json({ id, status });
  });
});

// Mark item returned
app.patch('/api/transactions/:id/return', (req, res) => {
  const { id } = req.params;
  
  db.run(`UPDATE transactions SET isReturned = 1 WHERE id = ?`, [id], function (err) {
    if (err) {
       res.status(500).json({ error: err.message });
       return;
    }
    res.json({ id, isReturned: true });
  });
});

// Settle money balances between two users
app.patch('/api/transactions/settle/:userId/:friendId', (req, res) => {
  const { userId, friendId } = req.params;
  
  const query = `
    UPDATE transactions 
    SET isReturned = 1 
    WHERE assetType = 'MONEY' 
      AND status = 'VALIDATED'
      AND isReturned IS NOT 1
      AND (
        (creatorId = ? AND counterpartyId = ?) OR 
        (creatorId = ? AND counterpartyId = ?)
      )
  `;

  db.run(query, [userId, friendId, friendId, userId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
});

// --- Static Frontend Serving (For Docker / Production) ---
// Serve static files from the 'dist' directory
app.use(express.static(join(__dirname, 'dist')));

// Send all other requests to the React app router
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
