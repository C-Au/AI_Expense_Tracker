import { useState } from 'react';
import axios from 'axios';

export default function DeleteCategoryModal({ isOpen, onClose, onSuccess, customCategories }) {
  const [loading, setLoading] = useState(null); // holds the name being deleted
  const [error, setError] = useState(null);

  const handleDelete = async (name) => {
    setLoading(name);
    setError(null);

    try {
      await axios.delete(`/api/expenses/custom-categories/${encodeURIComponent(name)}`);
      onSuccess();
      if (customCategories.length <= 1) {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Category</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {customCategories.length === 0 ? (
            <p className="delete-modal-empty">No custom categories to delete.</p>
          ) : (
            <>
              <p className="delete-modal-hint">
                Deleting a category will reassign its expenses to "Other".
              </p>
              <ul className="delete-category-list">
                {customCategories.map((cat) => (
                  <li key={cat.name} className="delete-category-item">
                    <span className="delete-category-info">
                      <span
                        className="delete-category-swatch"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <button
                      className="delete-category-btn"
                      onClick={() => handleDelete(cat.name)}
                      disabled={loading !== null}
                    >
                      {loading === cat.name ? 'Deleting…' : 'Delete'}
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
            disabled={loading !== null}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
