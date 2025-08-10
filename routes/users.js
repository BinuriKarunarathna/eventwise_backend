const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection
const bcrypt = require('bcryptjs');

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

// Update user information
router.put('/:userId', async (req, res) => {
  const userId = req.params.userId;
  const { email, password, fullName } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user exists
    const [existingUser] = await connection.query('SELECT * FROM user WHERE id = ?', [userId]);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email) {
      const [emailCheck] = await connection.query('SELECT id FROM user WHERE email = ? AND id != ?', [email, userId]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    // Prepare update query
    let updateQuery = 'UPDATE user SET ';
    let updateValues = [];
    let updateFields = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }

    if (fullName) {
      updateFields.push('full_name = ?');
      updateValues.push(fullName);
    }

    if (password && password.trim() !== '') {
      // Store password as plain text (NOT RECOMMENDED FOR PRODUCTION)
      updateFields.push('password = ?');
      updateValues.push(password);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateValues.push(userId);

    await connection.query(updateQuery, updateValues);

    await connection.commit();
    connection.release();
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
});

module.exports = router;
