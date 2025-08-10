const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db'); // Import the database pool
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const reportRoutes = require('./routes/reports');
const expenseRoutes = require('./routes/expenses');
const app = express();
const port = process.env.PORT || 3001; // Use Render's port or fallback to 3001

app.use(cors());
app.use(express.json());

// Add a basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'EventWise Backend API is running!', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);

// LOGIN endpoint - Plain text password comparison
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    // Direct plain text password comparison
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ id: user.id, email: user.email, name: user.full_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REGISTER endpoint - Plain text password storage
app.post('/api/users/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Store password as plain text (NOT RECOMMENDED FOR PRODUCTION)
    await pool.query('INSERT INTO user (email, password, full_name) VALUES (?, ?, ?)', [email, password, name]);

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
