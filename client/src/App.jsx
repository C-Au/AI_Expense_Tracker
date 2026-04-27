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
import LoginPage from './components/LoginPage';
import CategoryRulesModal from './components/CategoryRulesModal';
import { auth, onAuthStateChanged, signOutUser } from './firebase';
import { getAllCategoryColors } from './utils/categoryColors';
import './styles/app.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csvParseError, setCsvParseError] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );
  const [batches, setBatches] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMonthModalOpen, setDeleteMonthModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rules, setRules] = useState([]);

  const toggleDark = () => {
    setDarkMode((prev) => {
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  };

  // Auth state listener + axios token interceptor
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    // Attach Firebase ID token to every request
    const interceptor = axios.interceptors.request.use(async (config) => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      unsubscribe();
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

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

  const fetchRules = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/rules');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch AI rules:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchExpenses(selectedCategory);
  }, [user, selectedCategory, fetchExpenses]);

  useEffect(() => {
    if (!user) return;
    fetchCategories();
  }, [user, expenses, fetchCategories]);

  useEffect(() => {
    if (!user) return;
    fetchBatches();
  }, [user, fetchBatches]);

  useEffect(() => {
    if (!user) return;
    fetchCustomCategories();
  }, [user, fetchCustomCategories]);

  useEffect(() => {
    if (!user) return;
    fetchRules();
  }, [user, fetchRules]);

  const handleUploadSuccess = (newExpenses) => {
    setExpenses((prev) => [...newExpenses, ...prev]);
    fetchCategories();
    fetchBatches();
    setError(null);
    setCsvParseError(false);
  };

  const handleUploadError = (message, isCsvError = false) => {
    setError(message);
    setCsvParseError(!!isCsvError);
  };

  const handleCategoryChange = async (id, newCategory) => {
    try {
      const res = await axios.patch(`/api/expenses/${id}`, { category: newCategory });
      setExpenses((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      fetchCategories();
      fetchRules(); // keep rules state in sync after auto-save
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

    const formatRow = (e, total = '') => {
      const date = e.date ? new Date(e.date).toISOString().slice(0, 10) : '';
      const description = `"${String(e.description ?? '').replace(/"/g, '""')}"`;
      const amount = e.amount ?? '';
      const category = `"${String(e.category ?? '').replace(/"/g, '""')}"`;
      return `${date},${description},${amount},${category},${total}`;
    };

    const grouped = rows.reduce((acc, e) => {
      const key = e.category ?? '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    const grandTotal = rows.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const header = `date,description,amount,category,total,,"Grand Total",${grandTotal.toFixed(2)}`;

    const lines = [];

    sortedCategories.forEach((cat) => {
      const group = grouped[cat];
      const categoryTotal = group.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      group.forEach((e, j) => {
        lines.push(formatRow(e, j === group.length - 1 ? categoryTotal.toFixed(2) : ''));
      });
      lines.push('');
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

  // Auth loading splash
  if (authLoading) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="login-spinner login-spinner--large" />
      </div>
    );
  }

  // Not signed in → show login page
  if (!user) {
    return <LoginPage darkMode={darkMode} />;
  }

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
        <div className="user-bar">
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName ?? 'User'} className="user-avatar" referrerPolicy="no-referrer" />
          )}
          <span className="user-name">{user.displayName ?? user.email}</span>
          <button className="ai-memory-btn" onClick={() => setRulesModalOpen(true)}>AI Memory</button>
          <button className="signout-btn" onClick={signOutUser}>Sign out</button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          {csvParseError && (
            <span className="error-banner-hint">
              Please reformat your CSV to have 3 columns: <strong>date, description, amount</strong><br />
              e.g., <code>2024-01-05, Whole Foods Market, 87.43</code>
            </span>
          )}
        </div>
      )}

      <FileUpload
        onUploadSuccess={handleUploadSuccess}
        onError={handleUploadError}
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
            rules={rules}
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

      <CategoryRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onRuleDeleted={fetchRules}
      />
    </div>
  );
}
