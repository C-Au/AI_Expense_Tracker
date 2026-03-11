import { useState } from 'react';
import axios from 'axios';

export default function CreateCategoryModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#e8d4b8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/expenses/custom-categories', {
        name: name.trim(),
        color,
      });

      // Reset form
      setName('');
      setColor('#e8d4b8');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Custom Category</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="catName">Category Name</label>
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
              <input
                id="catColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
              />
              <span className="color-display" style={{ backgroundColor: color }} />
              <span className="color-value">{color}</span>
            </div>
          </div>

          {error && <div className="modal-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
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
