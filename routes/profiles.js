const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection
const bcrypt = require('bcryptjs');

// Get user profile by user ID
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [profiles] = await pool.query('SELECT * FROM profile WHERE user_id = ?', [userId]);
    
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Create or update user profile
router.put('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { phone, address, city, country, bio, dateOfBirth } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if profile already exists
    const [existingProfile] = await connection.query('SELECT * FROM profile WHERE user_id = ?', [userId]);

    if (existingProfile.length === 0) {
      // Create new profile
      await connection.query(
        'INSERT INTO profile (user_id, phone, address, city, country, bio, date_of_birth) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, phone, address, city, country, bio, dateOfBirth]
      );
    } else {
      // Update existing profile
      await connection.query(
        'UPDATE profile SET phone = ?, address = ?, city = ?, country = ?, bio = ?, date_of_birth = ? WHERE user_id = ?',
        [phone, address, city, country, bio, dateOfBirth, userId]
      );
    }

    await connection.commit();
    connection.release();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

module.exports = router;
