// ---------------------------------------------------------------------------
// client/src/components/DeleteByMonthModal.jsx  —  Delete expenses by month.
//
// Fetches the list of months that have expenses, then lets the user
// permanently delete all expenses for one month at a time.
//
// Key pattern: the month list is fetched inside a useEffect that runs
// whenever isOpen changes to true. This means the list is always fresh
// when you open the modal, without fetching unnecessarily when it's closed.
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import axios from 'axios';

// Props:
//   isOpen    — controls visibility.
//   onClose   — closes the modal.
//   onSuccess — called after deletion so App.jsx can refresh expense data.
export default function DeleteByMonthModal({ isOpen, onClose, onSuccess }) {
  const [months, setMonths] = useState([]);    // List of { month, count } objects.
  const [loading, setLoading] = useState(false); // True while fetching the month list.
  const [deleting, setDeleting] = useState(null); // The month string currently being deleted.
  const [error, setError] = useState(null);

  // useEffect runs the callback whenever one of the values in the dependency
  // array changes. Here it re-fetches months each time the modal opens.
  useEffect(() => {
    if (!isOpen) return; // Do nothing if the modal isn't open.
    setError(null);
    setLoading(true);
    axios
      .get('/api/expenses/months')
      .then((res) => setMonths(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [isOpen]); // Only re-run when isOpen changes.

  // Converts "2024-01" into "January 2024" for display.
  const formatMonth = (ym) => {
    const [year, month] = ym.split('-');
    // Number() converts the string "01" to the integer 1.
    // Month is 0-indexed in JavaScript Date, so we subtract 1.
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handleDelete = async (month) => {
    // window.confirm shows a native browser confirmation dialog.
    // If the user clicks "Cancel", the function returns early.
    if (!window.confirm(`Delete all ${months.find((m) => m.month === month)?.count ?? ''} expense(s) for ${formatMonth(month)}? This cannot be undone.`)) {
      return;
    }

    setDeleting(month); // Track which month is being deleted.
    setError(null);

    try {
      await axios.delete(`/api/expenses/by-month/${month}`);

      // Remove the deleted month from the local list without re-fetching.
      // prev.filter() returns a new array without the deleted month.
      setMonths((prev) => prev.filter((m) => m.month !== month));

      // Notify App.jsx to refresh the expense table.
      onSuccess();

      // Close automatically if that was the last month.
      if (months.length <= 1) {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Expenses by Month</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p className="delete-modal-empty">Loading months…</p>
          ) : months.length === 0 ? (
            <p className="delete-modal-empty">No expenses to delete.</p>
          ) : (
            <>
              <p className="delete-modal-hint">
                Select a month to permanently delete all its expenses from the database.
              </p>
              <ul className="delete-category-list">
                {months.map((m) => (
                  <li key={m.month} className="delete-category-item">
                    <span className="delete-month-info">
                      <span className="delete-month-label">{formatMonth(m.month)}</span>
                      {/* Pluralize "expense" correctly based on count. */}
                      <span className="delete-month-count">{m.count} expense{m.count !== 1 ? 's' : ''}</span>
                    </span>
                    <button
                      className="delete-category-btn"
                      onClick={() => handleDelete(m.month)}
                      disabled={deleting !== null} // Disable all buttons while one is deleting.
                    >
                      {deleting === m.month ? 'Deleting…' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={deleting !== null}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
