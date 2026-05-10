import { useMemo } from "react";

const DUSTY_PALETTE = [
  "#7b8fa1",
  "#8a9e7e",
  "#b87a5e",
  "#a07a96",
  "#9e8a5e",
  "#6b8fa3",
  "#a0896e",
  "#7a9e8a",
  "#a98a6e",
  "#8a7aa0",
  "#9e7a7a",
  "#7a8a7a",
];

function strHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function formatSpineDate(dateStr) {
  if (!dateStr) return "?";
  const d = new Date(dateStr);

  if (isNaN(d)) return dateStr.slice(0, 6);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Bookshelf({ batches = [] }) {
  const books = useMemo(
    () =>
      batches.map((batch, index) => {
        const h = strHash(batch.uploadBatch);

        const color = DUSTY_PALETTE[h % DUSTY_PALETTE.length];
        const height = 60 + (h % 36);
        const width = 22 + ((h >> 4) % 17);
        const tilt = (h % 5) - 2;
        const isNew = index === batches.length - 1;
        return { ...batch, color, height, width, tilt, isNew };
      }),
    [batches],
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
              className={`book${book.isNew ? " book--new" : ""}`}
              style={{
                "--book-tilt": `${book.tilt}deg`,
                backgroundColor: book.color,
                height: `${book.height}px`,
                width: `${book.width}px`,
              }}
              title={`Uploaded ${book.date} · ${book.count} expense${book.count !== 1 ? "s" : ""}`}
            >
              <span className="book-spine-text">
                {formatSpineDate(book.date)}
              </span>
            </div>
          ))
        )}

        <div className="shelf-plank" />
      </div>
    </div>
  );
}
