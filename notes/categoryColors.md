# categoryColors.js Notes

## File Overview
`client/src/utils/categoryColors.js` — Color lookup for categories.

Every category needs a color for the pie chart, filter pills, and category dropdowns. This file defines the built-in colors and provides helper functions to look up a color by category name.

## `BUILT_IN_COLORS`
The default colors for the built-in categories as hex color codes (e.g. `'#ff6b6b'` is a red).

> Do not change the keys here unless you also update the category names in the Expense model on the server.

| Category | Color |
|---|---|
| Food & Dining | `#ff6b6b` |
| Transport | `#ffa94d` |
| Housing | `#51cf66` |
| Utilities | `#339af0` |
| Healthcare | `#cc5de8` |
| Entertainment | `#f06595` |
| Shopping | `#ffd43b` |
| Travel | `#20c997` |
| Education | `#748ffc` |
| Other | `#adb5bd` |
| All | `#4a6cf7` (special entry: used for the "All" filter pill) |

## Exported Functions

### `getCategoryColor(categoryName, customCategories)`
Returns the hex color for a single category name. Checks built-in colors first, then custom categories from the database.

- Uses `BUILT_IN_COLORS[categoryName]` first.
- Falls back to searching the `customCategories` array with `.find()` — returns the first item that satisfies the condition, or `undefined`.
- If nothing matched, returns `'#adb5bd'` (neutral grey) as the fallback.

### `getAllCategoryColors(customCategories)`
Merges built-in and custom category colors into one flat object. Used by components that need to look up colors quickly by name.

- Starts with a copy of `BUILT_IN_COLORS` using the spread operator (`...`).
- Adds (or overrides) with any custom categories using `forEach`.
- Returns an object like `{ 'Food & Dining': '#ff6b6b', 'MyCategory': '#abc123', ... }`.

## Default Export
`BUILT_IN_COLORS` is exported as the default export.
