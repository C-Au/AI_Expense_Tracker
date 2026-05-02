// ---------------------------------------------------------------------------
// client/src/components/CategoryChart.jsx  —  Donut pie chart of spending.
//
// Uses the Recharts library to render an interactive pie/donut chart.
// Clicking a slice filters the expense table to that category.
//
// Recharts concepts:
//   ResponsiveContainer — makes the chart fill its parent's width.
//   PieChart           — the outer container for pie charts.
//   Pie                — the actual donut shape.
//   Cell               — one slice of the donut (one per category).
//   Tooltip            — the hover popup showing the value.
//   Legend             — the color key below the chart.
// ---------------------------------------------------------------------------
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getAllCategoryColors } from '../utils/categoryColors';

// Fallback colors used only if no categoryColors prop is passed.
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

// Custom tooltip component shown when the user hovers over a slice.
// Recharts passes { active, payload } as props automatically.
// active = true means the user is hovering; payload[0] has the hovered item's data.
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="chart-tooltip">
        <strong>{name}</strong>
        <br />
        ${Number(value).toFixed(2)}
      </div>
    );
  }
  return null; // Render nothing when not hovering.
};

// Props:
//   data           — array of { category, total } from the server.
//   onSegmentClick — called with the category name when a slice is clicked.
//   activeCategory — which category is currently selected (for highlighting).
//   darkMode       — passed through but used by CSS classes.
//   categoryColors — { categoryName: hexColor } lookup.
export default function CategoryChart({ data, onSegmentClick, activeCategory, darkMode = false, categoryColors = {} }) {
  // Use passed colors or fall back to the defaults defined above.
  const colors = Object.keys(categoryColors).length > 0 ? categoryColors : CATEGORY_COLORS;

  // Show an empty state if there's no data yet.
  if (!data || data.length === 0) {
    return (
      <div className="card chart-card">
        <p className="card-empty">No data to display.</p>
      </div>
    );
  }

  // Recharts expects data in { name, value } format.
  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total,
  }));

  return (
    <div className="card chart-card">
      <p className="card-title">Spending by Category</p>
      {/* ResponsiveContainer fills the card's full width and uses a fixed height. */}
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"         // Center X of the donut.
            cy="45%"         // Center Y (shifted up a bit to make room for the legend).
            outerRadius={110} // Outer edge of the ring.
            innerRadius={55}  // Inner hole (makes it a donut instead of a full pie).
            dataKey="value"   // Which field to use for slice sizes.
            onClick={(entry) => onSegmentClick && onSegmentClick(entry.name)}
            cursor="pointer"  // Shows a hand cursor on hover.
          >
            {/* Each Cell is one slice of the donut. */}
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={colors[entry.name] || '#adb5bd'}
                // Dim slices that aren't the active category.
                // When 'All' is selected, everything is full brightness.
                opacity={
                  activeCategory === 'All' || activeCategory === entry.name ? 1 : 0.4
                }
                // Highlight the active slice with a blue border.
                stroke={activeCategory === entry.name ? '#4a6cf7' : 'none'}
                strokeWidth={activeCategory === entry.name ? 2 : 0}
              />
            ))}
          </Pie>
          {/* Show our custom tooltip on hover. */}
          <Tooltip content={<CustomTooltip />} />
          {/* The legend below the chart. formatter wraps the label in a span for styling. */}
          <Legend
            formatter={(value) => (
              <span className="legend-text">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
