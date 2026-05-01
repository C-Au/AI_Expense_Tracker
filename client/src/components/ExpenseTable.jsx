// ---------------------------------------------------------------------------
// client/src/components/ExpenseTable.jsx  —  The main expense data table.
//
// Shows all expenses in a sortable table. Each row lets the user:
//   - Change the category via a colored dropdown.
//   - Delete the expense.
//
// A ✦ badge appears next to categories that have an AI rule saved,
// meaning the AI will remember this category on future uploads.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { getAllCategoryColors } from '../utils/categoryColors';

// Props received from App.jsx:
//   expenses       — the array of expense objects to display.
//   onDelete       — callback to call when the user clicks Delete.
//   onCategoryChange — callback when the user picks a new category.
//   categoryColors — { categoryName: hexColor } lookup object.
//   rules          — array of AI rules (used to show the ✦ badge).
export default function ExpenseTable({ expenses, onDelete, onCategoryChange, categoryColors = {}, rules = [] }) {
  // Build a Set of normalized descriptions that have a saved AI rule.
  // A Set gives O(1) lookup (much faster than .includes() on an array for large lists).
  const ruleDescriptions = new Set(rules.map((r) => r.description));

  // sortField tracks which column header was last clicked.
  // sortDir is 'asc' (A→Z, 0→1) or 'desc' (Z→A, 1→0).
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Use the passed-in colors or fall back to the defaults if nothing was passed.
  const colors = Object.keys(categoryColors).length > 0 ? categoryColors : getAllCategoryColors();

  // Build the sorted list of category names for the dropdown.
  // We filter out 'All' because that's only used for the filter pills.
  const CATEGORIES = Object.keys(colors).filter((cat) => cat !== 'All').sort();

  // Called when the user clicks a column header.
  // If they click the same column twice, it flips the direction.
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc'); // Default to ascending when switching columns.
    }
  };

  // Sort a copy of the expenses array (— we never mutate the original).
  // The spread [...expenses] creates a shallow copy so .sort() doesn't
  // change the original array in App.jsx.
  const sorted = [...expenses].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Amount is a number; everything else is compared as a string.
    if (sortField === 'amount') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    // Standard comparator: return negative to put a before b, positive for b before a.
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Returns an arrow indicator next to the active sort column.
  const arrow = (field) =>
    sortField === field ? (
      <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  // Show an empty state message if there are no expenses to display.
  if (expenses.length === 0) {
    return (
      <div className="card table-card">
        <p className="card-empty">No expenses to display.</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <p className="card-title">Expenses ({expenses.length})</p>
      <table className="expense-table">
        <thead>
          <tr>
            {/* Render a sortable header for each column. */}
            {['date', 'description', 'amount', 'category'].map((col) => (
              <th key={col} onClick={() => toggleSort(col)}>
                {/* Capitalize the first letter of the column name for display. */}
                {col.charAt(0).toUpperCase() + col.slice(1)}
                {arrow(col)}
              </th>
            ))}
            {/* Empty header for the Delete button column. */}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((exp) => (
            // Each row needs a unique key prop so React can track it.
            // MongoDB's _id field is perfect for this.
            <tr key={exp._id}>
              <td>{exp.date}</td>
              <td>{exp.description}</td>
              {/* toFixed(2) formats the number to always show 2 decimal places. */}
              <td className="amount-cell">
                ${Number(exp.amount).toFixed(2)}
              </td>
              <td>
                <div className="category-cell">
                  {/* Colored category dropdown. Changing it calls onCategoryChange,
                      which sends a PATCH request and saves an AI rule. */}
                  <select
                    className="category-select"
                    value={exp.category}
                    style={{ background: colors[exp.category] || '#adb5bd' }}
                    onChange={(e) => onCategoryChange(exp._id, e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {/* Show the ✦ badge if there is a saved AI rule for this description. */}
                  {ruleDescriptions.has(exp.description.toLowerCase().trim()) && (
                    <span className="rule-indicator" title="AI will remember this category">✦</span>
                  )}
                </div>
              </td>
              <td>
                <button className="delete-btn" onClick={() => onDelete(exp._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
