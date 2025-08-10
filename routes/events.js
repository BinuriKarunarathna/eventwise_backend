const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection

// Get all events
router.get('/', async (req, res) => {
  try {
    const [events] = await pool.query('SELECT * FROM event ORDER BY start_date DESC');
    res.json({ data: events });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({ error: 'Error fetching all events' });
  }
});

// Create event
router.post('/', async (req, res) => {
  const { name, description, location, startDate, endDate, totalBudget, user_id } = req.body;

  // Check for required fields
  if (!user_id || !name || !startDate || !endDate || !totalBudget) {
    return res.status(400).json({ error: 'Missing required fields: user_id, name, startDate, endDate, totalBudget' });
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

// Update event by ID
router.put('/:id', async (req, res) => {
  const eventId = req.params.id;
  const { name, description, location, startDate, endDate, totalBudget } = req.body;

  if (!name || !startDate || !endDate || !totalBudget) {
    return res.status(400).json({ error: 'Missing required fields: name, startDate, endDate, totalBudget' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE event SET name = ?, description = ?, location = ?, start_date = ?, end_date = ?, total_budget = ? WHERE id = ?',
      [name, description, location, startDate, endDate, totalBudget, eventId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event updated successfully', updatedId: eventId });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error updating event' });
  }
});

// Get events by user ID - CORRECTED VERSION
router.get('/users/:userId', async (req, res) => {
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
