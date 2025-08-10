const express = require('express');
const router = express.Router();
const pool = require('../db');

// Test database connection and data
router.get('/db', async (req, res) => {
  try {
    // Test connection
    const [connection] = await pool.query('SELECT 1 as test');
    console.log('Database connection test:', connection);

    // Check if tables exist and have data
    const [users] = await pool.query('SELECT COUNT(*) as count FROM user');
    const [events] = await pool.query('SELECT COUNT(*) as count FROM event');
    const [expenses] = await pool.query('SELECT COUNT(*) as count FROM expense');
    const [profiles] = await pool.query('SELECT COUNT(*) as count FROM profile');

    // Get sample data
    const [sampleUsers] = await pool.query('SELECT id, email, full_name FROM user LIMIT 3');
    const [sampleEvents] = await pool.query('SELECT id, name, user_id FROM event LIMIT 3');

    res.json({
      connection: 'successful',
      tables: {
        users: users[0].count,
        events: events[0].count,
        expenses: expenses[0].count,
        profiles: profiles[0].count
      },
      sampleData: {
        users: sampleUsers,
        events: sampleEvents
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database test failed', 
      details: error.message,
      stack: error.stack 
    });
  }
});

module.exports = router;