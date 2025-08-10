const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection

// Create event
router.post('/', async (req, res) => {
  const { name, description, location, startDate, endDate, totalBudget, user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert main event
    const [eventResult] = await connection.query(
      'INSERT INTO event (name, description, location, start_date, end_date, total_budget, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, location, startDate, endDate, totalBudget, user_id]
    );

    const eventId = eventResult.insertId;

    // Insert categories
    // if (Array.isArray(categories) && categories.length > 0) {
    //   const categoryValues = categories.map(c => [eventId, c.category, c.amount, c.notes]);
    //   await connection.query(
    //     'INSERT INTO event_categories (eventId, category, amount, notes) VALUES ?',
    //     [categoryValues]
    //   );
    // }

    await connection.commit();

    res.status(201).json({ message: 'Event created successfully', eventId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to create event' });
  } finally {
    connection.release();
  }
});

// Get events by user ID - CORRECTED VERSION
router.get('/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    console.log(`Fetching events for user_id: ${userId}`);
    const [events] = await pool.query('SELECT * FROM event WHERE user_id = ? ORDER BY start_date DESC', [userId]);
    console.log(`Found ${events.length} events for user ${userId}`);
    
    res.json({ data: events }); // Wrap in data object to match frontend expectation
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Error fetching user events' });
  }
});

// Delete event by ID - ADD THIS TO YOUR BACKEND
router.delete('/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    console.log(`Attempting to delete event with ID: ${eventId}`);
    const [result] = await pool.query('DELETE FROM event WHERE id = ?', [eventId]);
    
    console.log(`Delete result:`, result);
    
    if (result.affectedRows === 0) {
      console.log(`No event found with ID: ${eventId}`);
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log(`Successfully deleted event with ID: ${eventId}`);
    res.json({ message: 'Event deleted successfully', deletedId: eventId });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Error deleting event' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const [events] = await pool.query('SELECT * FROM event WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // const [categories] = await pool.query(
    //   'SELECT category, amount, notes FROM event_categories WHERE eventId = ?',
    //   [eventId]
    // );

    res.json(events[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching event' });
  }
});

module.exports = router;
