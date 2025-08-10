import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Expense Service Functions
export const getAllExpenses = async (eventId) => {
  try {
    console.log('ExpenseService - Fetching expenses for eventId:', eventId);
    const response = await api.get(`/expenses/event/${eventId}`);
    console.log('ExpenseService - API Response:', response.data);
    return response.data; // This will return { data: [...] } format
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

export const getExpenseById = async (expenseId) => {
  try {
    console.log('ExpenseService - Fetching expense by ID:', expenseId);
    const response = await api.get(`/expenses/${expenseId}`);
    console.log('ExpenseService - Expense response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

export const createExpense = async (expenseData) => {
  try {
    console.log('ExpenseService - Creating expense:', expenseData);
    const response = await api.post('/expenses', expenseData);
    console.log('ExpenseService - Create response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const updateExpense = async (expenseId, expenseData) => {
  try {
    console.log('ExpenseService - Updating expense:', expenseId, expenseData);
    const response = await api.put(`/expenses/${expenseId}`, expenseData);
    console.log('ExpenseService - Update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    console.log('ExpenseService - Deleting expense:', expenseId);
    const response = await api.delete(`/expenses/${expenseId}`);
    console.log('ExpenseService - Delete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export default {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
};
