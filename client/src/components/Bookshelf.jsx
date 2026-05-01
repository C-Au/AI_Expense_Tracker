// ---------------------------------------------------------------------------
// client/src/components/Bookshelf.jsx  —  Visual upload history as books.
//
// Each CSV upload is represented as a colorful book on a shelf.
// The book's color, height, and tilt are deterministically generated from
// the batch UUID, so the same upload always looks the same.
// The newest book gets a subtle "new" CSS animation.
// ---------------------------------------------------------------------------
import { useMemo } from 'react';

// A curated palette of muted, earthy colors for the book spines.
const DUSTY_PALETTE = [
  '#7b8fa1', // slate blue-grey
  '#8a9e7e', // sage green
  '#b87a5e', // burnt sienna
  '#a07a96', // dusty mauve
  '#9e8a5e', // warm tan
  '#6b8fa3', // steel blue
  '#a0896e', // dusty brown
  '#7a9e8a', // muted teal
  '#a98a6e', // caramel
  '#8a7aa0', // soft purple
  '#9e7a7a', // dusty rose
  '#7a8a7a', // moss green
];

/**
 * A simple non-cryptographic hash function.
 * Converts a string into a stable integer so we can pick a consistent
 * color and size for each batch without storing those values.
 *
 * Math.imul = 32-bit integer multiplication (keeps results from overflowing).
 * | 0 = truncates to a 32-bit integer.
 * Math.abs = makes the result positive so we can use it as an index.
 */
function strHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Formats a date string like "2024-01-15" into "Jan 15" for the book spine.
 * If the date is invalid, returns a safe fallback.
 */
function formatSpineDate(dateStr) {
  if (!dateStr) return '?';
  const d = new Date(dateStr);
  // isNaN(d) checks if the Date object is invalid (e.g. bad format).
  if (isNaN(d)) return dateStr.slice(0, 6);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Props:
//   batches — array of { uploadBatch, date, count } objects from the server.
export default function Bookshelf({ batches = [] }) {
  // useMemo computes the books array and caches the result.
  // It only recomputes when the batches array changes.
  // This avoids redoing the hash math on every render.
  const books = useMemo(
    () =>
      batches.map((batch, index) => {
        // Hash the UUID to get a stable number for this batch.
        const h = strHash(batch.uploadBatch);

        // Use the hash to deterministically pick visual properties.
        const color = DUSTY_PALETTE[h % DUSTY_PALETTE.length]; // Pick from palette.
        const height = 60 + (h % 36);         // 60–95 px tall.
        const width = 22 + ((h >> 4) % 17);   // 22–38 px wide. (>> 4 = divide by 16)
        const tilt = (h % 5) - 2;             // −2 to +2 degrees of lean.
        const isNew = index === batches.length - 1; // Is this the most recent upload?
        return { ...batch, color, height, width, tilt, isNew };
      }),
    [batches]
  );

  return (
    <div className="bookshelf-wrap">
      <p className="bookshelf-label">Upload History</p>
      <div className="bookshelf">
        {books.length === 0 ? (
          <span className="shelf-empty">No uploads yet — shelf is empty</span>
        ) : (
          books.map((book) => (
            <div
              key={book.uploadBatch}
              // 'book--new' triggers a CSS pop-in animation for the latest upload.
              className={`book${book.isNew ? ' book--new' : ''}`}
              style={{
                // CSS custom property (--book-tilt) is used in the stylesheet
                // to apply a rotation transform.
                '--book-tilt': `${book.tilt}deg`,
                backgroundColor: book.color,
                height: `${book.height}px`,
                width: `${book.width}px`,
              }}
              // Tooltip shown on hover with upload details.
              title={`Uploaded ${book.date} · ${book.count} expense${book.count !== 1 ? 's' : ''}`}
            >
              {/* The date label printed sideways on the book spine. */}
              <span className="book-spine-text">
                {formatSpineDate(book.date)}
              </span>
            </div>
          ))
        )}
        {/* The wooden shelf plank sits at the bottom of all the books. */}
        <div className="shelf-plank" />
      </div>
    </div>
  );
}
