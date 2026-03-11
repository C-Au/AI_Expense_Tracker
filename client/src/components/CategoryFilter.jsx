import { getAllCategoryColors } from '../utils/categoryColors';

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
  All:              '#4a6cf7',
};

export default function CategoryFilter({ categories, selected, onChange, categoryColors = {} }) {
  const colors = Object.keys(categoryColors).length > 0 ? categoryColors : CATEGORY_COLORS;
  return (
    <div className="filter-bar">
      <span className="filter-label">Filter:</span>
      {categories.map((cat) => {
        const isActive = cat === selected;
        const color = colors[cat] || '#4a6cf7';
        return (
          <button
            key={cat}
            className="filter-pill"
            style={isActive ? { background: color, color: '#fff', boxShadow: `0 2px 8px ${color}55` } : {}}
            onClick={() => onChange(cat)}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
