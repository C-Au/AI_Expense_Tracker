import { useState, useEffect } from "react";
import axios from "axios";

export default function DeleteByMonthModal({ isOpen, onClose, onSuccess }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLoading(true);
    axios
      .get("/api/expenses/months")
      .then((res) => setMonths(res.data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const formatMonth = (ym) => {
    const [year, month] = ym.split("-");

    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const handleDelete = async (month) => {
    if (
      !window.confirm(
        `Delete all ${months.find((m) => m.month === month)?.count ?? ""} expense(s) for ${formatMonth(month)}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeleting(month);
    setError(null);

    try {
      await axios.delete(`/api/expenses/by-month/${month}`);

      setMonths((prev) => prev.filter((m) => m.month !== month));

      onSuccess();

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
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <p className="delete-modal-empty">Loading months…</p>
          ) : months.length === 0 ? (
            <p className="delete-modal-empty">No expenses to delete.</p>
          ) : (
            <>
              <p className="delete-modal-hint">
                Select a month to permanently delete all its expenses from the
                database.
              </p>
              <ul className="delete-category-list">
                {months.map((m) => (
                  <li key={m.month} className="delete-category-item">
                    <span className="delete-month-info">
                      <span className="delete-month-label">
                        {formatMonth(m.month)}
                      </span>

                      <span className="delete-month-count">
                        {m.count} expense{m.count !== 1 ? "s" : ""}
                      </span>
                    </span>
                    <button
                      className="delete-category-btn"
                      onClick={() => handleDelete(m.month)}
                      disabled={deleting !== null}
                    >
                      {deleting === m.month ? "Deleting…" : "Delete"}
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
