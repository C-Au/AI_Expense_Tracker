# CategoryFilter.jsx Notes

## File Overview
`client/src/components/CategoryFilter.jsx` — Row of category filter pills.

Renders one colored button per category. Clicking a pill filters the expense table and dims non-matching chart slices.

## Props
- `categories` — array of category name strings (including `'All'`).
- `selected` — the currently active category name.
- `onChange` — callback called with the new category name on click.
- `categoryColors` — `{ categoryName: hexColor }` lookup object.

## Fallback Colors
`CATEGORY_COLORS` is used in case the parent doesn't pass `categoryColors`.

## Rendering Logic
- Uses passed colors or falls back to the defaults.
- `isActive` — true if this pill is the currently selected one.
- When active, gives the button a colored background. When inactive, the CSS class handles the default appearance.
- `boxShadow` uses the color with `55` appended (an alpha hex value for transparency).
