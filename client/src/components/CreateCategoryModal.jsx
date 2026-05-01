// ---------------------------------------------------------------------------
// client/src/components/CreateCategoryModal.jsx  —  "New Category" popup.
//
// A modal dialog (overlay + card) that lets the user type a category name
// and pick a color. On submit, it POSTs to the server and then closes.
//
// Modals in React are usually just a conditionally rendered <div> that
// covers the whole screen. Clicking the overlay closes the modal;
// clicking inside the card does NOT close it (stopPropagation).
// ---------------------------------------------------------------------------
import { useState } from 'react';
import axios from 'axios';

// Props:
//   isOpen    — boolean that controls whether the modal is visible.
//   onClose   — callback to hide the modal (called when user cancels or succeeds).
//   onSuccess — callback called after a category is successfully created
//               (App.jsx uses this to refresh the categories list).
export default function CreateCategoryModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');          // The typed category name.
  const [color, setColor] = useState('#e8d4b8'); // The chosen hex color (default: tan).
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    // e.preventDefault() stops the browser from reloading the page,
    // which is the default behavior when a form is submitted.
    e.preventDefault();

    // Basic validation — name must not be empty or just spaces.
    if (!name.trim()) {
      setError('Category name required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Send the new category to the server.
      await axios.post('/api/expenses/custom-categories', {
        name: name.trim(), // .trim() removes accidental leading/trailing spaces.
        color,
      });

      // Reset the form fields back to their defaults.
      setName('');
      setColor('#e8d4b8');

      // Tell App.jsx to re-fetch the categories list so the new one appears.
      onSuccess();
      onClose();
    } catch (err) {
      // Show the server's error message (e.g. "Category already exists").
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // If isOpen is false, render nothing at all (the modal is hidden).
  if (!isOpen) return null;

  return (
    // The overlay covers the entire screen. Clicking it closes the modal.
    <div className="modal-overlay" onClick={onClose}>
      {/* e.stopPropagation() prevents clicks inside the card from bubbling
          up to the overlay's onClick and accidentally closing the modal. */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Custom Category</h2>
          {/* × is the HTML entity for the × (times) symbol. */}
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* onSubmit runs handleSubmit when the user presses Enter or clicks "Create". */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="catName">Category Name</label>
            {/* "controlled input" — React owns the value via state.
                value={name} displays the current state;
                onChange={...} updates state on every keystroke. */}
            <input
              id="catName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Subscriptions, Pet Care, ..."
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="catColor">Color</label>
            <div className="color-picker-wrapper">
              {/* type="color" shows the OS color picker widget. */}
              <input
                id="catColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
              />
              {/* A preview swatch showing the chosen color. */}
              <span className="color-display" style={{ backgroundColor: color }} />
              <span className="color-value">{color}</span>
            </div>
          </div>

          {/* Only show the error block when there is an error. */}
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"              // type="button" prevents form submission.
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"             // type="submit" triggers onSubmit.
              className="modal-btn modal-btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
