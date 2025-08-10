const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection

// Get expense by ID
router.get('/:expenseId', async (req, res) => {
  const expenseId = req.params.expenseId;

  try {
    const [expenses] = await pool.query('SELECT * FROM expense WHERE id = ?', [expenseId]);
    
    if (expenses.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ data: expenses[0] });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Error fetching expense' });
  }
});

// Get all expenses for an event
router.get('/event/:eventId', async (req, res) => {
  const eventId = req.params.eventId;

  try {
    const [expenses] = await pool.query('SELECT * FROM expense WHERE event_id = ? ORDER BY id DESC', [eventId]);
    res.json({ data: expenses }); // Wrap in data object to match frontend expectation
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});

// Create new expense
router.post('/', async (req, res) => {
  const { event_id, name, amount } = req.body;

  if (!event_id || !name || !amount) {
    return res.status(400).json({ error: 'Event ID, name, and amount are required' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO expense (event_id, name, amount) VALUES (?, ?, ?)',
      [event_id, name, amount]
    );

    res.status(201).json({ message: 'Expense created successfully', expenseId: result.insertId });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Update expense
router.put('/:expenseId', async (req, res) => {
  const expenseId = req.params.expenseId;
  const { name, amount } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE expense SET name = ?, amount = ? WHERE id = ?',
      [name, amount, expenseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// Delete expense
router.delete('/:expenseId', async (req, res) => {
  const expenseId = req.params.expenseId;

  try {
    const [result] = await pool.query('DELETE FROM expense WHERE id = ?', [expenseId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
