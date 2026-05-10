# csvParser.js Notes

## File Overview
`server/services/csvParser.js` — Converts an uploaded CSV file into an array of expense objects the rest of the app can work with.

Expected CSV format (any column order, case-insensitive headers):
```
date, description, amount
2024-01-05, Whole Foods Market, 87.43
```

## Library
`csv-parse` is a battle-tested library for parsing CSV files. The `/sync` variant is used, which returns data directly instead of streaming.

---

## `parseCSV(buffer)`
Parses a CSV buffer into an array of expense objects.

### Parameters
- `buffer` — the raw file bytes from the multer upload (`Buffer`).

### Returns
Array of `{ date, description, amount }` objects.

### Throws
`Error` if any row is missing required fields or has an invalid amount.

---

## Implementation Details

### `parse()` options
- `columns: true` — the first row is treated as headers, so each row becomes `{ Date: '...', Description: '...', Amount: '...' }`.
- `skip_empty_lines: true` — ignores blank lines in the file.
- `trim: true` — strips spaces from each value.

### Column normalization
Normalizes column names to lowercase so `"Date"`, `"DATE"`, and `"date"` all work. `Object.entries()` turns `{ Date: '...' }` into `[['Date', '...']]`, then maps each pair to a lowercased key.

### Validation
If any required field (`date`, `description`, `amount`) is missing, throws a user-friendly error. `index + 1` gives a 1-based row number (easier for users to find in Excel).

### Amount cleaning
Amount might be formatted like `"$1,234.56"` — strips everything except digits, periods, and minus signs before converting to a number using `.replace(/[^0-9.\-]/g, '')`. `String(rawAmount)` ensures it's a string first (in case the CSV parser already converted it to a number). Throws if the result is `NaN`.
