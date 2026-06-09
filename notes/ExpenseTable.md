# ExpenseTable.jsx Notes

## File Overview
`client/src/components/ExpenseTable.jsx` — The main expense data table.

Shows all expenses in a sortable table. Each row lets the user:
- Change the category via a colored dropdown.
- Delete the expense.

A ✦ badge appears next to categories that have an AI rule saved, meaning the AI will remember this category on future uploads.

## Props
- `expenses` — the array of expense objects to display.
- `onDelete` — callback to call when the user clicks Delete.
- `onCategoryChange` — callback when the user picks a new category.
- `categoryColors` — `{ categoryName: hexColor }` lookup object.
- `rules` — array of AI rules (used to show the ✦ badge).

## Key Logic

### `extractMerchantName(description)`
Mirrors the server-side `extractMerchantName` logic so the ✦ badge correctly matches rules that are now keyed by merchant name rather than full description. Defined at module level (outside the component) so it is not recreated on every render.

### `ruleDescriptions` Set
Builds a `Set` of normalized merchant names that have a saved AI rule. A `Set` gives O(1) lookup — much faster than `.includes()` on an array for large lists.

Rules are now keyed by merchant name (e.g. `"chick-fil-a"`) rather than the full transaction description, so the badge check also extracts the merchant name from each expense using a local `extractMerchantName()` function (mirroring the server-side logic). It checks both the extracted name AND the full description so that older rules saved before this change still trigger the badge.

### Sorting State
- `sortField` — tracks which column header was last clicked.
- `sortDir` — `'asc'` (A→Z, 0→1) or `'desc'` (Z→A, 1→0).

### `CATEGORIES`
Builds the sorted list of category names for the dropdown. Filters out `'All'` because that's only used for the filter pills.

### `toggleSort(field)`
Called when the user clicks a column header. If they click the same column twice, it flips the direction. Defaults to ascending when switching columns.

### Sorted Array
Sorts a copy of the expenses array — never mutates the original. `[...expenses]` creates a shallow copy so `.sort()` doesn't change the original array in App.jsx.

- Amount is a number; everything else is compared as a string (lowercased).
- Standard comparator: return negative to put `a` before `b`, positive for `b` before `a`.

### `arrow(field)`
Returns an arrow indicator (`↑` or `↓`) next to the active sort column.

## JSX Notes
- Shows "No expenses to display." empty state if the expenses array is empty.
- Column headers are generated via `.map()` over `['date', 'description', 'amount', 'category']`.
- First letter of column name is capitalized for display (`col.charAt(0).toUpperCase() + col.slice(1)`).
- Empty `<th>` for the Delete button column.
- Each row uses `exp._id` as the React `key` prop (MongoDB's `_id` is perfect for this).
- `toFixed(2)` formats the amount to always show 2 decimal places.
- The category dropdown is a colored `<select>` — changing it calls `onCategoryChange`, which sends a PATCH request and saves an AI rule.
- The ✦ badge appears when either `ruleDescriptions.has(extractMerchantName(exp.description).toLowerCase().trim())` or `ruleDescriptions.has(exp.description.toLowerCase().trim())` is true. The dual check handles both new rules (keyed by merchant name) and old rules (keyed by full description).

---

## Changelog

### 2026-05-30
- Added module-level `extractMerchantName(description)` helper (mirrors the server-side version in `aiCategorizer.js`) that strips `#...` and `*...` suffixes to return just the merchant name.
- Updated the `ruleDescriptions` Set lookup and the ❖ badge check: now checks the extracted merchant name first (for new-style rules), then the full description (backward compatibility for old-style rules).
