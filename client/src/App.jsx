import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FileUpload from './components/FileUpload';
import ExpenseTable from './components/ExpenseTable';
import CategoryFilter from './components/CategoryFilter';
import CategoryChart from './components/CategoryChart';
import Bookshelf from './components/Bookshelf';
import CreateCategoryModal from './components/CreateCategoryModal';
import DeleteCategoryModal from './components/DeleteCategoryModal';
import DeleteByMonthModal from './components/DeleteByMonthModal';
import { getAllCategoryColors } from './utils/categoryColors';
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
  const [batches, setBatches] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMonthModalOpen, setDeleteMonthModalOpen] = useState(false);

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

  const fetchBatches = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Failed to fetch upload batches:', err);
    }
  }, []);

  const fetchCustomCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/custom-categories');
      setCustomCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch custom categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchExpenses(selectedCategory);
  }, [selectedCategory, fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [expenses, fetchCategories]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  useEffect(() => {
    fetchCustomCategories();
  }, [fetchCustomCategories]);

  const handleUploadSuccess = (newExpenses) => {
    setExpenses((prev) => [...newExpenses, ...prev]);
    fetchCategories();
    fetchBatches();
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

  const categoryColors = getAllCategoryColors(customCategories);
  const categories = ['All', ...categoryTotals.map((c) => c.category)];
  const filteredExpenses =
    selectedCategory === 'All'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  const handleExport = async () => {
    const rows = filteredExpenses;
    if (rows.length === 0) return;

    const header = 'date,description,amount,category';

    const formatRow = (e) => {
      const date = e.date ? new Date(e.date).toISOString().slice(0, 10) : '';
      const description = `"${String(e.description ?? '').replace(/"/g, '""')}"`;
      const amount = e.amount ?? '';
      const category = `"${String(e.category ?? '').replace(/"/g, '""')}"`;
      return `${date},${description},${amount},${category}`;
    };

    const grouped = rows.reduce((acc, e) => {
      const key = e.category ?? '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    const lines = [];
    sortedCategories.forEach((cat, i) => {
      grouped[cat].forEach((e) => lines.push(formatRow(e)));
      if (i < sortedCategories.length - 1) lines.push('');
    });

    const csvContent = [header, ...lines].join('\n');

    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: 'expenses.csv',
          types: [{ description: 'CSV File', accept: { 'text/csv': ['.csv'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
      } catch (err) {
        if (err.name === 'AbortError') {
          // user cancelled — do nothing
        } else if (
          err.name === 'NoModificationAllowedError' ||
          err.name === 'NotAllowedError' ||
          (err.message && err.message.toLowerCase().includes('open'))
        ) {
          setError('Cannot save: the file is open in another application. Close it and try again.');
        } else {
          setError('Export failed: ' + err.message);
        }
      }
    } else {
      // Fallback: trigger browser download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      <header className="app-header">
        <button className="toggle-btn toggle-btn--corner" onClick={toggleDark}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <h1 className="app-title">Simple Books: AI Expense Tracker</h1>
        <p className="app-subtitle">
          Upload a CSV — AI will categorize your expenses automatically
        </p>
      </header>

      {error && <div className="error-banner">Error: {error}</div>}

      <FileUpload
        onUploadSuccess={handleUploadSuccess}
        onError={setError}
        loading={loading}
        setLoading={setLoading}
        darkMode={darkMode}
        onNewCategory={() => setModalOpen(true)}
        onDeleteCategory={() => setDeleteModalOpen(true)}
        onExport={handleExport}
        hasExpenses={expenses.length > 0}
        onDeleteByMonth={() => setDeleteMonthModalOpen(true)}
      />

      <Bookshelf batches={batches} />

      {expenses.length > 0 && (
        <div className="expense-grid">
          <div className="full-width">
            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
              darkMode={darkMode}
              categoryColors={categoryColors}
            />
          </div>

          <CategoryChart
            data={categoryTotals}
            onSegmentClick={handleCategoryClick}
            activeCategory={selectedCategory}
            darkMode={darkMode}
            categoryColors={categoryColors}
          />

          <ExpenseTable
            expenses={filteredExpenses}
            onDelete={handleDelete}
            onCategoryChange={handleCategoryChange}
            darkMode={darkMode}
            categoryColors={categoryColors}
          />
        </div>
      )}

      <CreateCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCustomCategories}
      />

      <DeleteCategoryModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={() => { fetchCustomCategories(); fetchExpenses(selectedCategory); }}
        customCategories={customCategories}
      />

      <DeleteByMonthModal
        isOpen={deleteMonthModalOpen}
        onClose={() => setDeleteMonthModalOpen(false)}
        onSuccess={() => { fetchExpenses(selectedCategory); fetchBatches(); }}
      />
    </div>
  );
}
