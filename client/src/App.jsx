import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ExpenseTable from './components/ExpenseTable';
import CategoryFilter from './components/CategoryFilter';
import CategoryChart from './components/CategoryChart';
import './styles/app.css';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const toggleDark = () => {
    setDarkMode((prev) => {
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  };

  const fetchExpenses = useCallback(async (category) => {
    try {
      const params = {};
      if (category && category !== 'All') params.category = category;
      const res = await axios.get('/api/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/categories');
      setCategoryTotals(res.data);
    } catch (err) {
      console.error('Failed to fetch category totals:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpenses(selectedCategory);
  }, [selectedCategory, fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [expenses, fetchCategories]);

  const handleUploadSuccess = (newExpenses) => {
    setExpenses((prev) => [...newExpenses, ...prev]);
    fetchCategories();
    setError(null);
  };

  const handleCategoryChange = async (id, newCategory) => {
    try {
      const res = await axios.patch(`/api/expenses/${id}`, { category: newCategory });
      setExpenses((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? 'All' : category);
  };

  const categories = ['All', ...categoryTotals.map((c) => c.category)];
  const filteredExpenses =
    selectedCategory === 'All'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      <header className="app-header">
        <h1 className="app-title">Simple Books AI Expense Tracker</h1>
        <p className="app-subtitle">
          Upload a CSV — AI will categorize your expenses automatically
        </p>
        <button className="toggle-btn" onClick={toggleDark}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      {error && <div className="error-banner">Error: {error}</div>}

      <FileUpload
        onUploadSuccess={handleUploadSuccess}
        onError={setError}
        loading={loading}
        setLoading={setLoading}
        darkMode={darkMode}
      />

      {expenses.length > 0 && (
        <div className="expense-grid">
          <div className="full-width">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
              darkMode={darkMode}
            />
          </div>

          <CategoryChart
            data={categoryTotals}
            onSegmentClick={handleCategoryClick}
            activeCategory={selectedCategory}
            darkMode={darkMode}
          />

          <ExpenseTable
            expenses={filteredExpenses}
            onDelete={handleDelete}
            onCategoryChange={handleCategoryChange}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}
