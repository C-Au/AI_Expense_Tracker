# CategoryChart.jsx Notes

## File Overview
`client/src/components/CategoryChart.jsx` — Donut pie chart of spending.

Uses the Recharts library to render an interactive pie/donut chart. Clicking a slice filters the expense table to that category.

## Recharts Concepts
- `ResponsiveContainer` — makes the chart fill its parent's width.
- `PieChart` — the outer container for pie charts.
- `Pie` — the actual donut shape.
- `Cell` — one slice of the donut (one per category).
- `Tooltip` — the hover popup showing the value.
- `Legend` — the color key below the chart.

## Fallback Colors
`CATEGORY_COLORS` is used only if no `categoryColors` prop is passed.

## `CustomTooltip` Component
Custom tooltip component shown when the user hovers over a slice. Recharts passes `{ active, payload }` as props automatically. `active = true` means the user is hovering; `payload[0]` has the hovered item's data. Returns `null` (renders nothing) when not hovering.

## Props
- `data` — array of `{ category, total }` from the server.
- `onSegmentClick` — called with the category name when a slice is clicked.
- `activeCategory` — which category is currently selected (for highlighting).
- `darkMode` — passed through but used by CSS classes.
- `categoryColors` — `{ categoryName: hexColor }` lookup.

## Rendering Logic
- Uses passed colors or falls back to the defaults if nothing was passed.
- Shows an empty state if there's no data yet.
- Recharts expects data in `{ name, value }` format — maps from `{ category, total }`.

## Pie Configuration
- `cx="50%"` — Center X of the donut.
- `cy="45%"` — Center Y (shifted up a bit to make room for the legend).
- `outerRadius={110}` — Outer edge of the ring.
- `innerRadius={55}` — Inner hole (makes it a donut instead of a full pie).
- `dataKey="value"` — Which field to use for slice sizes.
- `cursor="pointer"` — Shows a hand cursor on hover.

## Cell (Slice) Logic
- Dims slices that aren't the active category. When `'All'` is selected, everything is full brightness.
- Highlights the active slice with a blue border (`stroke="#4a6cf7"`).

## Legend
The `formatter` prop wraps the label in a `<span>` for styling.
