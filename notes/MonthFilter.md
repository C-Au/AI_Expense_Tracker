# MonthFilter

## Overview

A filter bar component that renders a row of clickable pill buttons — one for "All Months" and one for each distinct year-month value in the dataset.

---

## Props

| Prop | Type | Description |
|------|------|-------------|
| `months` | `string[]` | Array of year-month strings in `"YYYY-MM"` format (e.g. `["2025-01", "2025-02"]`) |
| `selected` | `string` | Currently active filter value (`"All"` or a `"YYYY-MM"` string) |
| `onChange` | `(value: string) => void` | Callback fired when a pill is clicked, receives the new selected value |

---

## Helper Function

### `formatMonth(ym)`

Converts a `"YYYY-MM"` string into a human-readable label using the browser's locale.

```js
formatMonth("2025-01") // → "January 2025"
```

---

## Behavior

- The first pill is always **"All Months"** (value: `"All"`).
- Subsequent pills are generated from the `months` prop in the order provided.
- The active pill (matching `selected`) is highlighted with a blue background (`#4a6cf7`) and a subtle box-shadow.
- Clicking any pill calls `onChange` with the pill's value.

---

## Styling

Uses CSS classes `filter-bar`, `filter-label`, and `filter-pill` defined in `app.css`. Active state styles are applied inline.

---

## Usage Example

```jsx
<MonthFilter
  months={["2025-01", "2025-02", "2025-03"]}
  selected={selectedMonth}
  onChange={setSelectedMonth}
/>
```
