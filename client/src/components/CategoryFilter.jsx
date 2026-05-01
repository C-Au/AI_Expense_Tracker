// ---------------------------------------------------------------------------
// client/src/components/CategoryFilter.jsx  —  Row of category filter pills.
//
// Renders one colored button per category. Clicking a pill filters the
// expense table and dims non-matching chart slices.
//
// Props:
//   categories     — array of category name strings (including 'All').
//   selected       — the currently active category name.
//   onChange       — callback called with the new category name on click.
//   categoryColors — { categoryName: hexColor } lookup object.
// ---------------------------------------------------------------------------
import { getAllCategoryColors } from '../utils/categoryColors';

// Fallback colors in case the parent doesn't pass categoryColors.
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
  // Use passed colors or fall back to the defaults.
  const colors = Object.keys(categoryColors).length > 0 ? categoryColors : CATEGORY_COLORS;

  return (
    <div className="filter-bar">
      <span className="filter-label">Filter:</span>
      {/* Render one pill button for each category. */}
      {categories.map((cat) => {
        const isActive = cat === selected; // Is this the currently selected pill?
        const color = colors[cat] || '#4a6cf7';
        return (
          <button
            key={cat}
            className="filter-pill"
            // When active, give the button a colored background.
            // When inactive, the CSS class handles the default appearance.
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
