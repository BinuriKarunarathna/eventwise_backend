const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection
const bcrypt = require('bcryptjs');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, full_name FROM user');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});


// Register user
router.post('/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM user WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // Store password as plain text (NOT RECOMMENDED FOR PRODUCTION)
    await pool.query('INSERT INTO user (email, password, full_name) VALUES (?, ?, ?)', [email, password, full_name]);
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = users[0];
    // Plain text password check (NOT RECOMMENDED FOR PRODUCTION)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ id: user.id, email: user.email, full_name: user.full_name });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const [users] = await pool.query('SELECT id, email, full_name FROM user WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user' });
  }
});


// (Optional) Update user information endpoint can be added here if needed

module.exports = router;
