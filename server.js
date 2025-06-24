const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const path = require('path');

dotenv.config(); // Load variables from .env

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Serve cms.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cms.html'));
});

// CREATE a user
app.post('/users', async (req, res) => {
  const { usercode, userdetail } = req.body;
  try {
    await pool.query(
      'INSERT INTO "user" (usercode, userdetail) VALUES ($1, $2)',
      [usercode, userdetail]
    );
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    console.error('CREATE error:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// READ all users
app.get('/users', async (req, res) => {
  console.log('📥 GET /users hit');
  try {
    const result = await pool.query('SELECT * FROM "user" ORDER BY usercode');
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 READ error:', err);
    res.status(500).json({ error: 'Error retrieving users' });
  }
});

// UPDATE user
app.put('/users/:usercode', async (req, res) => {
  const { usercode } = req.params;
  const { userdetail } = req.body;
  try {
    await pool.query(
      'UPDATE "user" SET userdetail = $1 WHERE usercode = $2',
      [userdetail, usercode]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    console.error('UPDATE error:', err);
    res.status(500).json({ error: 'Error updating user' });
  }
});

// DELETE user
app.delete('/users/:usercode', async (req, res) => {
  const { usercode } = req.params;
  try {
    await pool.query('DELETE FROM "user" WHERE usercode = $1', [usercode]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('DELETE error:', err);
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// ✅ ADMIN SUBMISSION TOGGLE FEATURE
let submissionOpen = true;

app.post('/admin/toggle', (req, res) => {
  const { action, password } = req.body;

  const isOpen = action === 'open' && password === process.env.ADMIN_OPEN_PASS;
  const isClose = action === 'close' && password === process.env.ADMIN_CLOSE_PASS;

  if (isOpen || isClose) {
    submissionOpen = (action === 'open');
    console.log(`🔧 Submission mode set to ${submissionOpen ? 'OPEN' : 'CLOSED'}`);
    res.json({ status: 'success', mode: submissionOpen ? 'open' : 'closed' });
  } else {
    res.status(401).json({ status: 'error', message: 'Invalid admin password' });
  }
});

app.get('/admin/status', (req, res) => {
  res.json({ mode: submissionOpen ? 'open' : 'closed' });
});

// Ping route
app.get('/ping', (req, res) => {
  console.log('🔔 /ping route hit');
  res.send('pong');
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
