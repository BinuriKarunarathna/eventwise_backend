import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAllEvents } from './services/EventService';
import { getAllExpenses } from './services/ExpenseService';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fixed user ID - you can make this dynamic later
  const userId = 14;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching dashboard data...');
        
        // Fetch events
        const eventsResponse = await getAllEvents(userId);
        console.log('Events response:', eventsResponse);
        const eventsData = eventsResponse.data || [];
        setEvents(eventsData);

        // Fetch expenses for each event
        let allExpenses = [];
        for (const event of eventsData) {
          try {
            const expensesResponse = await getAllExpenses(event.id);
            console.log(`Expenses for event ${event.id}:`, expensesResponse);
            const eventExpenses = expensesResponse.data || [];
            allExpenses = [...allExpenses, ...eventExpenses];
          } catch (expenseError) {
            console.error(`Error fetching expenses for event ${event.id}:`, expenseError);
            // Continue with other events even if one fails
          }
        }
        setExpenses(allExpenses);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]); // Only re-run when userId changes

  // Calculate statistics
  const totalEvents = events.length;
  const totalBudget = events.reduce((sum, event) => sum + (event.total_budget || 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const remainingBudget = totalBudget - totalExpenses;

  // Prepare chart data
  const eventBudgetData = events.map(event => ({
    name: event.name,
    budget: event.total_budget || 0,
    id: event.id
  }));

  // Expense by category data (mock categories since your table has id, amount, name, event_id)
  const expenseByCategory = expenses.reduce((acc, expense) => {
    // Since your expense table has 'name' field, we'll use that as category
    const category = expense.name || 'Other';
    acc[category] = (acc[category] || 0) + (expense.amount || 0);
    return acc;
  }, {});

  const categoryData = Object.entries(expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Events</h3>
          <p className="text-3xl font-bold">{totalEvents}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Budget</h3>
          <p className="text-3xl font-bold">Rs. {totalBudget}</p>
        </div>
        <div className="bg-red-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Expenses</h3>
          <p className="text-3xl font-bold">Rs. {totalExpenses}</p>
        </div>
        <div className="bg-purple-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Remaining Budget</h3>
          <p className="text-3xl font-bold">Rs. {remainingBudget}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Event Budget Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Event Budgets</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={eventBudgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`Rs. ${value}`, 'Budget']} />
              <Bar dataKey="budget" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Category Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: Rs. ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`Rs. ${value}`, 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Events List */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs. {event.total_budget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
