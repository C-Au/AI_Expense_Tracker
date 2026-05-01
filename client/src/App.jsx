// ---------------------------------------------------------------------------
// client/src/App.jsx  —  The root component of the React front-end.
//
// This is the "brain" of the UI. It:
//   1. Manages all top-level state (expenses, categories, user, etc.).
//   2. Fetches data from the server and passes it down to child components.
//   3. Handles all user actions that need to talk to the server
//      (upload, delete, category change, export).
//   4. Conditionally renders the login page or the main app based on auth.
//
// React concepts you'll see here:
//   useState   — stores values that cause a re-render when they change.
//   useEffect  — runs side effects (like fetching data) after renders.
//   useCallback — memoizes functions so they don't get recreated on every render.
// ---------------------------------------------------------------------------

// React hooks we need. These are imported from the React library.
import { useState, useEffect, useCallback } from 'react';

// axios is a library that makes HTTP requests (GET, POST, etc.) easier than
// the built-in browser fetch API. It also auto-parses JSON responses.
import axios from 'axios';

// Import all child components.
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

// Firebase auth helpers and our color utility.
import { auth, onAuthStateChanged, signOutUser } from './firebase';
import { getAllCategoryColors } from './utils/categoryColors';

// Global CSS styles.
import './styles/app.css';

// ---------------------------------------------------------------------------
// The App component — the top-level component rendered by main.jsx.
// ---------------------------------------------------------------------------
export default function App() {
  // ---------------------------------------------------------------------------
  // State declarations
  // Each useState call creates a piece of state and a setter function.
  // Calling the setter causes React to re-render the component.
  // ---------------------------------------------------------------------------

  // The signed-in Firebase user object, or null if not signed in.
  const [user, setUser] = useState(null);

  // True while we're waiting to find out if a user is signed in.
  // We show a loading spinner during this time instead of flashing the login page.
  const [authLoading, setAuthLoading] = useState(true);

  // The array of expense objects currently shown in the table.
  const [expenses, setExpenses] = useState([]);

  // Summary data for the pie chart: [{ category, total, count }, ...]
  const [categoryTotals, setCategoryTotals] = useState([]);

  // Which category pill is currently active. 'All' means show everything.
  const [selectedCategory, setSelectedCategory] = useState('All');

  // True while an upload is in progress (shows a spinner on the upload button).
  const [loading, setLoading] = useState(false);

  // An error message string, or null if no error.
  const [error, setError] = useState(null);

  // True when the error is specifically a CSV format error (shows a special hint).
  const [csvParseError, setCsvParseError] = useState(false);

  // Dark mode preference. We read the saved value from localStorage so
  // the preference persists between visits. The () => ... is a "lazy initializer"
  // — it only runs once on first render, not on every re-render.
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  // List of upload batches for the Bookshelf component.
  const [batches, setBatches] = useState([]);

  // User-created custom categories from the database.
  const [customCategories, setCustomCategories] = useState([]);

  // Modal open/close flags.
  const [modalOpen, setModalOpen] = useState(false);          // Create category
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);    // Delete category
  const [deleteMonthModalOpen, setDeleteMonthModalOpen] = useState(false); // Delete by month
  const [rulesModalOpen, setRulesModalOpen] = useState(false); // AI Memory

  // The AI category rules for the current user.
  const [rules, setRules] = useState([]);

  // ---------------------------------------------------------------------------
  // Dark mode toggle
  // ---------------------------------------------------------------------------
  const toggleDark = () => {
    setDarkMode((prev) => {
      // Save the NEW value to localStorage (the opposite of the current value).
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  };

  // ---------------------------------------------------------------------------
  // Auth state listener + axios interceptor
  // ---------------------------------------------------------------------------
  // This useEffect runs once when the component first mounts (because the
  // dependency array is empty []).
  useEffect(() => {
    // onAuthStateChanged calls our callback every time the user signs in or out.
    // It returns an "unsubscribe" function we call on cleanup.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);    // null = signed out, object = signed in
      setAuthLoading(false);    // We now know the auth state — hide the splash screen.
    });

    // Axios interceptor: runs before EVERY request made anywhere in the app.
    // It attaches the Firebase ID token to the Authorization header so the
    // server's auth middleware can verify the request.
    const interceptor = axios.interceptors.request.use(async (config) => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // getIdToken() fetches a fresh token (Firebase refreshes it automatically
        // when it expires, so we always get a valid one).
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config; // Must return config so the request can proceed.
    });

    // Cleanup: runs when the component unmounts (e.g. user navigates away).
    // We must unsubscribe from Firebase and remove the interceptor to avoid
    // memory leaks.
    return () => {
      unsubscribe();
      axios.interceptors.request.eject(interceptor);
    };
  }, []); // [] = only run once on mount.

  // ---------------------------------------------------------------------------
  // Data fetching functions
  // Each one is wrapped in useCallback so it has a stable reference and can
  // safely be listed in useEffect dependency arrays without causing loops.
  // ---------------------------------------------------------------------------

  // Fetches expenses, optionally filtered by category.
  const fetchExpenses = useCallback(async (category) => {
    try {
      // Build the query string params object.
      const params = {};
      if (category && category !== 'All') params.category = category;
      const res = await axios.get('/api/expenses', { params });
      setExpenses(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }, []);

  // Fetches category totals for the pie chart.
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/categories');
      setCategoryTotals(res.data);
    } catch (err) {
      console.error('Failed to fetch category totals:', err);
    }
  }, []);

  // Fetches the list of upload batches for the Bookshelf.
  const fetchBatches = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Failed to fetch upload batches:', err);
    }
  }, []);

  // Fetches custom categories from the database.
  const fetchCustomCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/custom-categories');
      setCustomCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch custom categories:', err);
    }
  }, []);

  // Fetches the user's saved AI rules.
  const fetchRules = useCallback(async () => {
    try {
      const res = await axios.get('/api/expenses/rules');
      setRules(res.data);
    } catch (err) {
      console.error('Failed to fetch AI rules:', err);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Effects that trigger data fetches when relevant state changes.
  // Each useEffect only runs when the user is signed in (guard: if (!user) return).
  // ---------------------------------------------------------------------------

  // Re-fetch expenses when the user signs in or changes the active category.
  useEffect(() => {
    if (!user) return;
    fetchExpenses(selectedCategory);
  }, [user, selectedCategory, fetchExpenses]);

  // Re-fetch category totals whenever the expenses array changes.
  // This keeps the pie chart up to date after deletions or category changes.
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

  // ---------------------------------------------------------------------------
  // Event handlers — called by child components via callback props.
  // ---------------------------------------------------------------------------

  // Called by FileUpload after a successful upload.
  // Prepends the new expenses to the front of the list so they appear immediately.
  const handleUploadSuccess = (newExpenses) => {
    setExpenses((prev) => [...newExpenses, ...prev]);
    fetchCategories();
    fetchBatches();
    setError(null);
    setCsvParseError(false);
  };

  // Called by FileUpload when an upload fails.
  const handleUploadError = (message, isCsvError = false) => {
    setError(message);
    setCsvParseError(!!isCsvError);
  };

  // Called when the user picks a different category in the expense table dropdown.
  // Sends a PATCH request and updates the local state optimistically.
  const handleCategoryChange = async (id, newCategory) => {
    try {
      const res = await axios.patch(`/api/expenses/${id}`, { category: newCategory });
      // Replace the updated expense in the array using .map().
      // For each expense: if its _id matches, swap it with the response; otherwise keep it.
      setExpenses((prev) => prev.map((e) => (e._id === id ? res.data : e)));
      fetchCategories();
      fetchRules(); // Re-sync rules since a new rule was just created server-side.
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Called when the user clicks the Delete button in the table.
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/expenses/${id}`);
      // Remove the deleted expense from local state using .filter().
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Called when the user clicks a category pill or pie chart slice.
  // Clicking the already-active category resets the filter to 'All'.
  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? 'All' : category);
  };

  // ---------------------------------------------------------------------------
  // Derived values (computed from state, not stored separately)
  // ---------------------------------------------------------------------------

  // Merge built-in and custom category colors into one lookup object.
  const categoryColors = getAllCategoryColors(customCategories);

  // Build the category list: 'All' first, then each category that has expenses.
  const categories = ['All', ...categoryTotals.map((c) => c.category)];

  // Apply the active category filter to the full expenses array.
  const filteredExpenses =
    selectedCategory === 'All'
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  // ---------------------------------------------------------------------------
  // CSV Export
  // Builds a CSV string from the current filtered expenses, grouped by category,
  // and downloads it. Uses the modern File System Access API if available,
  // falling back to a blob download for older browsers.
  // ---------------------------------------------------------------------------
  const handleExport = async () => {
    const rows = filteredExpenses;
    if (rows.length === 0) return;

    // formatRow converts one expense object into a CSV line.
    // We wrap description and category in quotes and escape any internal quotes
    // by doubling them (standard CSV escaping: " → "").
    const formatRow = (e, total = '') => {
      const date = e.date ? new Date(e.date).toISOString().slice(0, 10) : '';
      const description = `"${String(e.description ?? '').replace(/"/g, '""')}"`;
      const amount = e.amount ?? '';
      const category = `"${String(e.category ?? '').replace(/"/g, '""')}"`;
      return `${date},${description},${amount},${category},${total}`;
    };

    // Group expenses by category using .reduce().
    // .reduce() works like a loop that builds up an accumulator (acc) object.
    const grouped = rows.reduce((acc, e) => {
      const key = e.category ?? '';
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

    // Sort category names alphabetically.
    const sortedCategories = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    // Calculate the grand total across all expenses.
    const grandTotal = rows.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // The CSV header row also includes the grand total in a separate column.
    const header = `date,description,amount,category,total,,"Grand Total",${grandTotal.toFixed(2)}`;

    const lines = [];

    // Build the body rows, grouped by category.
    sortedCategories.forEach((cat) => {
      const group = grouped[cat];
      const categoryTotal = group.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      // Only put the category subtotal in the last row of each group.
      group.forEach((e, j) => {
        lines.push(formatRow(e, j === group.length - 1 ? categoryTotal.toFixed(2) : ''));
      });
      lines.push(''); // Blank line between categories for readability.
    });

    const csvContent = [header, ...lines].join('\n');

    // Try the modern File System Access API (lets the user choose the save location).
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
          // User cancelled the save dialog — do nothing.
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
      // Fallback for browsers that don't support showSaveFilePicker.
      // Create a temporary download link and click it programmatically.
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      // Revoke the object URL to free memory after the download starts.
      URL.revokeObjectURL(url);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Show a full-screen spinner while we wait to find out if a user is signed in.
  // Without this, the login page would flash briefly for already-signed-in users.
  if (authLoading) {
    return (
      <div className={`app${darkMode ? ' dark' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="login-spinner login-spinner--large" />
      </div>
    );
  }

  // If no user is signed in, show the login page instead of the main app.
  if (!user) {
    return <LoginPage darkMode={darkMode} />;
  }

  // Main app UI — only rendered when a user is signed in.
  return (
    <div className={`app${darkMode ? ' dark' : ''}`}>
      {/* ------------------------------------------------------------------ */}
      {/* Header bar */}
      {/* ------------------------------------------------------------------ */}
      <header className="app-header">
        <button className="toggle-btn toggle-btn--corner" onClick={toggleDark}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
        <h1 className="app-title">Simple Books: AI Expense Tracker</h1>
        <p className="app-subtitle">
          Upload a CSV — AI will categorize your expenses automatically
        </p>
        <div className="user-bar">
          {/* Only render the avatar if the user has a photo URL. */}
          {user.photoURL && (
            <img src={user.photoURL} alt={user.displayName ?? 'User'} className="user-avatar" referrerPolicy="no-referrer" />
          )}
          <span className="user-name">{user.displayName ?? user.email}</span>
          <button className="ai-memory-btn" onClick={() => setRulesModalOpen(true)}>AI Memory</button>
          <button className="signout-btn" onClick={signOutUser}>Sign out</button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner — shown when something goes wrong. */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          {/* Show the reformat hint only for CSV parse errors. */}
          {csvParseError && (
            <span className="error-banner-hint">
              Please reformat your CSV to have 3 columns: <strong>date, description, amount</strong><br />
              e.g., <code>2024-01-05, Whole Foods Market, 87.43</code>
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Upload + toolbar card */}
      {/* ------------------------------------------------------------------ */}
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

      {/* Visual history of all uploads as books on a shelf. */}
      <Bookshelf batches={batches} />

      {/* ------------------------------------------------------------------ */}
      {/* Main expense grid — only rendered when there are expenses. */}
      {/* ------------------------------------------------------------------ */}
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

      {/* ------------------------------------------------------------------ */}
      {/* Modal dialogs — always in the DOM but hidden via isOpen=false. */}
      {/* ------------------------------------------------------------------ */}
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
