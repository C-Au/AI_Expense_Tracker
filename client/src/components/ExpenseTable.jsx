import { useState } from "react";
import { getAllCategoryColors } from "../utils/categoryColors";

export default function ExpenseTable({
  expenses,
  onDelete,
  onCategoryChange,
  categoryColors = {},
  rules = [],
}) {
  const ruleDescriptions = new Set(rules.map((r) => r.description));

  const [sortField, setSortField] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const colors =
    Object.keys(categoryColors).length > 0
      ? categoryColors
      : getAllCategoryColors();

  const CATEGORIES = Object.keys(colors)
    .filter((cat) => cat !== "All")
    .sort();

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sorted = [...expenses].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "amount") {
      valA = Number(valA);
      valB = Number(valB);
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const arrow = (field) =>
    sortField === field ? (
      <span className="sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>
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
            {["date", "description", "amount", "category"].map((col) => (
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

              <td className="amount-cell">${Number(exp.amount).toFixed(2)}</td>
              <td>
                <div className="category-cell">
                  <select
                    className="category-select"
                    value={exp.category}
                    style={{ background: colors[exp.category] || "#adb5bd" }}
                    onChange={(e) => onCategoryChange(exp._id, e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {ruleDescriptions.has(
                    exp.description.toLowerCase().trim(),
                  ) && (
                    <span
                      className="rule-indicator"
                      title="AI will remember this category"
                    >
                      ✦
                    </span>
                  )}
                </div>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => onDelete(exp._id)}
                >
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
