import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function CategoryRulesModal({ isOpen, onClose, onRuleDeleted }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
  }, []);

  useEffect(() => {
    if (isOpen) fetchRules();
  }, [isOpen, fetchRules]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/expenses/rules/${id}`);
      setRules((prev) => prev.filter((r) => r._id !== id));
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
            <div className="rules-loading">
              <span className="login-spinner" />
            </div>
          ) : rules.length === 0 ? (
            <p className="rules-empty">
              No rules saved yet. Change a category in the expense table to create
              your first rule.
            </p>
          ) : (
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id}>
                    <td className="rules-td-description">{rule.originalDescription}</td>
                    <td>
                      <span className="rules-category-badge">{rule.category}</span>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(rule._id)}
                        disabled={deletingId === rule._id}
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
