# Bookshelf.jsx Notes

## File Overview
`client/src/components/Bookshelf.jsx` — Visual upload history as books.

Each CSV upload is represented as a colorful book on a shelf. The book's color, height, and tilt are deterministically generated from the batch UUID, so the same upload always looks the same. The newest book gets a subtle "new" CSS animation.

## Color Palette
`DUSTY_PALETTE` is a curated palette of muted, earthy colors for the book spines.

## Helper Functions

### `strHash(str)`
A simple non-cryptographic hash function. Converts a string into a stable integer so we can pick a consistent color and size for each batch without storing those values.

- `Math.imul` = 32-bit integer multiplication (keeps results from overflowing).
- `| 0` = truncates to a 32-bit integer.
- `Math.abs` = makes the result positive so we can use it as an index.

### `formatSpineDate(dateStr)`
Formats a date string like `"2024-01-15"` into `"Jan 15"` for the book spine. If the date is invalid, returns a safe fallback. `isNaN(d)` checks if the Date object is invalid (e.g. bad format).

## Props
- `batches` — array of `{ uploadBatch, date, count }` objects from the server.

## `useMemo` Usage
`useMemo` computes the books array and caches the result. It only recomputes when the `batches` array changes — avoids redoing the hash math on every render.

### Per-book computed values
- `color` — pick from palette using hash modulo palette length.
- `height` — 60–95 px tall (`60 + (h % 36)`).
- `width` — 22–38 px wide (`22 + ((h >> 4) % 17)`). `>> 4` = divide by 16.
- `tilt` — −2 to +2 degrees of lean (`(h % 5) - 2`).
- `isNew` — true if this is the most recent upload (last index in `batches`).

## JSX Notes
- `'book--new'` triggers a CSS pop-in animation for the latest upload.
- `--book-tilt` is a CSS custom property used in the stylesheet to apply a rotation transform.
- The `title` attribute on each book div creates a tooltip shown on hover with upload details.
- The date label is printed sideways on the book spine via `.book-spine-text`.
- The wooden shelf plank sits at the bottom of all the books via `.shelf-plank`.
