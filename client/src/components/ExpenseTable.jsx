import { useState } from 'react';

const CATEGORY_COLORS = {
  'Food & Dining':  '#ff6b6b',
  Transport:        '#ffa94d',
  Housing:          '#51cf66',
  Utilities:        '#339af0',
  Healthcare:       '#cc5de8',
  Entertainment:    '#f06595',
  Shopping:         '#ffd43b',
  Travel:           '#20c997',
  Education:        '#748ffc',
  Other:            '#adb5bd',
};

export default function ExpenseTable({ expenses, onDelete }) {
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...expenses].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (sortField === 'amount') {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const arrow = (field) =>
    sortField === field ? (
      <span className="sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

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
            {['date', 'description', 'amount', 'category'].map((col) => (
              <th key={col} onClick={() => toggleSort(col)}>
                {col.charAt(0).toUpperCase() + col.slice(1)}
                {arrow(col)}
              </th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((exp) => (
            <tr key={exp._id}>
              <td>{exp.date}</td>
              <td>{exp.description}</td>
              <td className="amount-cell">
                ${Number(exp.amount).toFixed(2)}
              </td>
              <td>
                <span
                  className="category-badge"
                  style={{ background: CATEGORY_COLORS[exp.category] || '#adb5bd' }}
                >
                  {exp.category}
                </span>
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
