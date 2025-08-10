const express = require('express');
const router = express.Router();
const pool = require('../db'); // MySQL pool connection

// Budget Summary - Shows allocated vs used budget by month
router.get('/budget-summary/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get events with their budgets and expenses grouped by month
    const [results] = await pool.query(`
      SELECT 
        DATE_FORMAT(e.start_date, '%b') as month,
        SUM(e.total_budget) as allocated,
        COALESCE(SUM(exp.amount), 0) as used
      FROM event e
      LEFT JOIN expense exp ON e.id = exp.event_id
      WHERE e.user_id = ?
      GROUP BY DATE_FORMAT(e.start_date, '%Y-%m'), DATE_FORMAT(e.start_date, '%b')
      ORDER BY DATE_FORMAT(e.start_date, '%Y-%m')
      LIMIT 12
    `, [userId]);

    // If no data, return sample data structure
    if (results.length === 0) {
      return res.json([
        { month: 'Jan', allocated: 5000, used: 3500 },
        { month: 'Feb', allocated: 7000, used: 5200 },
        { month: 'Mar', allocated: 6000, used: 4800 },
        { month: 'Apr', allocated: 8000, used: 6500 },
        { month: 'May', allocated: 5500, used: 4200 },
        { month: 'Jun', allocated: 9000, used: 7800 }
      ]);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching budget summary:', error);
    res.status(500).json({ error: 'Error fetching budget summary' });
  }
});

// Expense Analysis - Shows expenses by category
router.get('/expense-analysis/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await pool.query(`
      SELECT 
        exp.name as name,
        SUM(exp.amount) as amount
      FROM expense exp
      JOIN event e ON exp.event_id = e.id
      WHERE e.user_id = ?
      GROUP BY exp.name
      ORDER BY amount DESC
    `, [userId]);

    // If no data, return sample data
    if (results.length === 0) {
      return res.json([
        { name: 'Venue', amount: 8000 },
        { name: 'Catering', amount: 6500 },
        { name: 'Decoration', amount: 3200 },
        { name: 'Music', amount: 2800 },
        { name: 'Photography', amount: 2500 },
        { name: 'Transport', amount: 1500 },
        { name: 'Misc', amount: 1200 }
      ]);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching expense analysis:', error);
    res.status(500).json({ error: 'Error fetching expense analysis' });
  }
});

// Event Comparison - Shows budget vs actual spending for events
router.get('/event-comparison/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await pool.query(`
      SELECT 
        e.name as event,
        e.total_budget as budget,
        COALESCE(SUM(exp.amount), 0) as actual
      FROM event e
      LEFT JOIN expense exp ON e.id = exp.event_id
      WHERE e.user_id = ?
      GROUP BY e.id, e.name, e.total_budget
      ORDER BY e.start_date DESC
      LIMIT 8
    `, [userId]);

    // If no data, return sample data
    if (results.length === 0) {
      return res.json([
        { event: 'Birthday Party', budget: 5000, actual: 4200 },
        { event: 'Wedding', budget: 15000, actual: 14500 },
        { event: 'Conference', budget: 8000, actual: 7800 },
        { event: 'Anniversary', budget: 3000, actual: 2850 },
        { event: 'Graduation', budget: 4500, actual: 4100 }
      ]);
    }

    res.json(results);
  } catch (error) {
    console.error('Error fetching event comparison:', error);
    res.status(500).json({ error: 'Error fetching event comparison' });
  }
});

// Forecast - Shows quarterly forecast vs actual with practical business logic
router.get('/forecast/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get historical data for the last 2 years to calculate trends
    const [historicalData] = await pool.query(`
      SELECT 
        YEAR(e.start_date) as year,
        QUARTER(e.start_date) as quarter,
        SUM(e.total_budget) as total_budget,
        COALESCE(SUM(exp.amount), 0) as actual_spent,
        COUNT(e.id) as event_count
      FROM event e
      LEFT JOIN expense exp ON e.id = exp.event_id
      WHERE e.user_id = ? AND e.start_date >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      GROUP BY YEAR(e.start_date), QUARTER(e.start_date)
      ORDER BY YEAR(e.start_date), QUARTER(e.start_date)
    `, [userId]);

    // Get upcoming events for forecast calculation
    const [upcomingEvents] = await pool.query(`
      SELECT 
        YEAR(start_date) as year,
        QUARTER(start_date) as quarter,
        SUM(total_budget) as planned_budget,
        COUNT(id) as planned_events
      FROM event
      WHERE user_id = ? AND start_date > NOW()
      GROUP BY YEAR(start_date), QUARTER(start_date)
      ORDER BY YEAR(start_date), QUARTER(start_date)
    `, [userId]);

    // Calculate averages from historical data for forecasting
    const avgBudgetPerEvent = historicalData.length > 0 
      ? historicalData.reduce((sum, item) => sum + item.total_budget, 0) / historicalData.reduce((sum, item) => sum + item.event_count, 0)
      : 5000; // Default if no history

    const avgSpendingRate = historicalData.length > 0
      ? historicalData.reduce((sum, item) => sum + (item.actual_spent / item.total_budget), 0) / historicalData.length
      : 0.85; // Default 85% spending rate

    // Generate forecast for next 6 quarters
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentQuarter = Math.floor((currentDate.getMonth() + 3) / 3);
    
    const forecastResults = [];

    // Add historical data (actual values)
    historicalData.forEach(item => {
      const quarterLabel = `Q${item.quarter} ${item.year}`;
      const isCurrentOrPast = item.year < currentYear || 
        (item.year === currentYear && item.quarter <= currentQuarter);
      
      forecastResults.push({
        quarter: quarterLabel,
        forecast: parseFloat(item.total_budget),
        actual: isCurrentOrPast ? parseFloat(item.actual_spent) : null,
        type: 'historical'
      });
    });

    // Add forecast for future quarters
    for (let i = 0; i < 6; i++) {
      let forecastYear = currentYear;
      let forecastQuarter = currentQuarter + i + 1;
      
      // Handle year overflow
      while (forecastQuarter > 4) {
        forecastQuarter -= 4;
        forecastYear += 1;
      }
      
      const quarterLabel = `Q${forecastQuarter} ${forecastYear}`;
      
      // Check if there are planned events for this quarter
      const plannedForQuarter = upcomingEvents.find(
        item => item.year === forecastYear && item.quarter === forecastQuarter
      );
      
      let forecastBudget;
      
      if (plannedForQuarter) {
        // Use actual planned budget if events are scheduled
        forecastBudget = plannedForQuarter.planned_budget;
      } else {
        // Predict based on historical patterns with seasonal adjustments
        const seasonalMultiplier = getSeasonalMultiplier(forecastQuarter);
        const trendMultiplier = 1 + (i * 0.05); // 5% growth per quarter assumption
        
        forecastBudget = avgBudgetPerEvent * 2 * seasonalMultiplier * trendMultiplier; // Assume 2 events per quarter
      }
      
      // Calculate predicted actual spending
      const predictedActual = forecastBudget * avgSpendingRate;
      
      forecastResults.push({
        quarter: quarterLabel,
        forecast: Math.round(forecastBudget),
        actual: null, // Future quarters don't have actual data
        predicted_actual: Math.round(predictedActual),
        type: plannedForQuarter ? 'planned' : 'predicted'
      });
    }

    // If no data at all, return meaningful sample data
    if (forecastResults.length === 0) {
      return res.json([
        { quarter: 'Q3 2024', forecast: 12000, actual: 10200, type: 'historical' },
        { quarter: 'Q4 2024', forecast: 18000, actual: 15500, type: 'historical' },
        { quarter: 'Q1 2025', forecast: 15000, actual: 13800, type: 'historical' },
        { quarter: 'Q2 2025', forecast: 20000, actual: 18200, type: 'historical' },
        { quarter: 'Q3 2025', forecast: 22000, actual: null, predicted_actual: 18700, type: 'predicted' },
        { quarter: 'Q4 2025', forecast: 25000, actual: null, predicted_actual: 21250, type: 'predicted' }
      ]);
    }

    res.json(forecastResults.slice(-8)); // Return last 8 quarters
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    res.status(500).json({ error: 'Error fetching forecast data' });
  }
});

// Helper function for seasonal adjustments
function getSeasonalMultiplier(quarter) {
  // Q4 (Oct-Dec) typically has more events (holidays, end of year)
  // Q2 (Apr-Jun) has wedding season
  // Q1 (Jan-Mar) typically slower
  // Q3 (Jul-Sep) moderate activity
  switch(quarter) {
    case 1: return 0.8;  // 20% below average
    case 2: return 1.2;  // 20% above average (wedding season)
    case 3: return 1.0;  // Average
    case 4: return 1.3;  // 30% above average (holiday season)
    default: return 1.0;
  }
}

// Get spending trends for additional analysis
router.get('/spending-trends/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [results] = await pool.query(`
      SELECT 
        DATE_FORMAT(exp.expense_date, '%Y-%m') as month,
        SUM(exp.amount) as total_spent,
        COUNT(DISTINCT exp.event_id) as events_count,
        AVG(exp.amount) as avg_expense
      FROM expense exp
      JOIN event e ON exp.event_id = e.id
      WHERE e.user_id = ?
      GROUP BY DATE_FORMAT(exp.expense_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, [userId]);

    res.json(results);
  } catch (error) {
    console.error('Error fetching spending trends:', error);
    res.status(500).json({ error: 'Error fetching spending trends' });
  }
});

module.exports = router;
