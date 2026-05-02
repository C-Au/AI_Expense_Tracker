// ---------------------------------------------------------------------------
// client/src/components/CategoryRulesModal.jsx  —  "AI Memory" popup.
//
// Shows all the AI category rules the user has created by reassigning
// expense categories. Users can remove individual rules here, which tells
// the AI to forget that preference on the next upload.
//
// React concepts used:
//   - useCallback: caches fetchRules so it doesn't change reference on every render,
//     which would otherwise cause the useEffect below to loop.
//   - useEffect with [isOpen, fetchRules]: re-fetches rules each time the modal opens.
// ---------------------------------------------------------------------------
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Props:
//   isOpen        — controls visibility.
//   onClose       — closes the modal.
//   onRuleDeleted — optional callback so App.jsx can refresh its local rules state.
export default function CategoryRulesModal({ isOpen, onClose, onRuleDeleted }) {
  const [rules, setRules] = useState([]);       // The list of rules from the server.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // The _id of the rule being deleted.

  // useCallback memoizes this function so it has a stable reference.
  // Without it, defining fetchRules inside the component would create a new
  // function object on every render, causing useEffect to re-run infinitely.
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/expenses/rules');
      setRules(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function never changes.

  // Fetch rules fresh every time the modal opens.
  useEffect(() => {
    if (isOpen) fetchRules();
  }, [isOpen, fetchRules]);

  const handleDelete = async (id) => {
    setDeletingId(id); // Show loading state on the specific "Remove" button.
    try {
      await axios.delete(`/api/expenses/rules/${id}`);

      // Remove the deleted rule from local state without re-fetching everything.
      setRules((prev) => prev.filter((r) => r._id !== id));

      // Notify App.jsx if it provided a callback.
      if (onRuleDeleted) onRuleDeleted();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content rules-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">AI Memory</h2>
          {/* &times; renders as the × symbol. aria-label helps screen readers. */}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="rules-modal-body">
          <p className="rules-modal-description">
            Every time you reassign a category, it's saved here. Future uploads
            will automatically apply these rules.
          </p>

          {error && <div className="modal-error">{error}</div>}

          {loading ? (
            // Show a spinner while fetching.
            <div className="rules-loading">
              <span className="login-spinner" />
            </div>
          ) : rules.length === 0 ? (
            <p className="rules-empty">
              No rules saved yet. Change a category in the expense table to create
              your first rule.
            </p>
          ) : (
            // Show the rules in a table once loaded.
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th></th> {/* Empty header for the Remove button column. */}
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id}>
                    <td className="rules-td-description">{rule.originalDescription}</td>
                    <td>
                      {/* A styled badge showing the category name. */}
                      <span className="rules-category-badge">{rule.category}</span>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(rule._id)}
                        disabled={deletingId === rule._id} // Disable while this rule is deleting.
                        aria-label={`Delete rule for ${rule.originalDescription}`}
                      >
                        {deletingId === rule._id ? '…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-actions rules-modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
