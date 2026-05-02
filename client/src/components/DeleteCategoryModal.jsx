// ---------------------------------------------------------------------------
// client/src/components/DeleteCategoryModal.jsx  —  Delete custom categories.
//
// Shows a list of all custom categories the user created. Each row has a
// Delete button. When a category is deleted, the server automatically
// moves all its expenses to "Other".
//
// Note: loading state stores the NAME being deleted (not just true/false).
// This lets us show a "Deleting…" label on the specific button clicked
// while disabling all other buttons at the same time.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import axios from 'axios';

// Props:
//   isOpen           — controls visibility.
//   onClose          — closes the modal.
//   onSuccess        — called after a deletion so App.jsx can refresh.
//   customCategories — array of { name, color } objects from the server.
export default function DeleteCategoryModal({ isOpen, onClose, onSuccess, customCategories }) {
  // loading holds the name of the category currently being deleted, or null.
  // Using the name (instead of a boolean) lets us target the exact button.
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (name) => {
    setLoading(name); // Mark this specific category as being deleted.
    setError(null);

    try {
      // encodeURIComponent converts special characters (spaces, slashes, etc.)
      // into URL-safe escape codes so the name can safely appear in the URL.
      await axios.delete(`/api/expenses/custom-categories/${encodeURIComponent(name)}`);

      // Refresh the parent's category list.
      onSuccess();

      // If that was the last custom category, close the modal automatically.
      if (customCategories.length <= 1) {
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(null); // Clear loading state regardless of success or failure.
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
              {/* React fragments (<></>) let you return multiple elements
                  without adding an extra <div> to the DOM. */}
              <p className="delete-modal-hint">
                Deleting a category will reassign its expenses to "Other".
              </p>
              <ul className="delete-category-list">
                {customCategories.map((cat) => (
                  <li key={cat.name} className="delete-category-item">
                    <span className="delete-category-info">
                      {/* A small colored square swatch for the category. */}
                      <span
                        className="delete-category-swatch"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                    <button
                      className="delete-category-btn"
                      onClick={() => handleDelete(cat.name)}
                      // Disable ALL buttons while any deletion is in progress.
                      disabled={loading !== null}
                    >
                      {/* Show 'Deleting…' only on the button that was clicked. */}
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
