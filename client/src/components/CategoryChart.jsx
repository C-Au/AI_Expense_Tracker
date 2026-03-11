import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
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
};

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
  return null;
};

export default function CategoryChart({ data, onSegmentClick, activeCategory, darkMode = false, categoryColors = {} }) {
  const colors = Object.keys(categoryColors).length > 0 ? categoryColors : CATEGORY_COLORS;
  if (!data || data.length === 0) {
    return (
      <div className="card chart-card">
        <p className="card-empty">No data to display.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: item.total,
  }));

  return (
    <div className="card chart-card">
      <p className="card-title">Spending by Category</p>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            outerRadius={110}
            innerRadius={55}
            dataKey="value"
            onClick={(entry) => onSegmentClick && onSegmentClick(entry.name)}
            cursor="pointer"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={colors[entry.name] || '#adb5bd'}
                opacity={
                  activeCategory === 'All' || activeCategory === entry.name ? 1 : 0.4
                }
                stroke={activeCategory === entry.name ? '#4a6cf7' : 'none'}
                strokeWidth={activeCategory === entry.name ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
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
