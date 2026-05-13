# csvParser.js Notes

_Last updated: 2026-05-12_

## File Overview
`server/services/csvParser.js` — Converts an uploaded CSV file into an array of expense objects the rest of the app can work with.

Accepted CSV formats (columns must be in this order: date, description, amount):
```
# With header row (case-insensitive):
date, description, amount
2024-01-05, Whole Foods Market, 87.43

# Without header row (bank-exported CSVs):
2024-01-05, Whole Foods Market, 87.43
```

Rows with a blank amount (e.g. bank payment credits) are silently skipped.

## Library
`csv-parse` is a battle-tested library for parsing CSV files. The `/sync` variant is used, which returns data directly instead of streaming.

---

## `hasHeaderRow(buffer)`
Detects whether the CSV file starts with a header row before parsing.

- Reads the first line of the buffer as a UTF-8 string and lowercases it.
- Returns `true` if the line contains all three expected column names: `"date"`, `"description"`, and `"amount"`.
- Case-insensitive substring match, so `"Date"`, `"DATE"`, etc. all work.
- If any of the three keywords is missing, the first line is treated as data.

---

## `parseCSV(buffer)`
Parses a CSV buffer into an array of expense objects.

### Parameters
- `buffer` — the raw file bytes from the multer upload (`Buffer`).

### Returns
Array of `{ date, description, amount }` objects. Rows with a blank amount are excluded.

### Throws
`Error` if any row is missing `date` or `description`, or has a non-numeric non-blank amount.

---

## Implementation Details

### `parse()` options
- `columns` — set to `true` if a header row is detected (first row becomes the column names); otherwise set to `['date', 'description', 'amount']` so the columns are assigned positionally and the first row is treated as data.
- `skip_empty_lines: true` — ignores blank lines in the file.
- `trim: true` — strips spaces from each value.

### Column normalization
Normalizes column names to lowercase so `"Date"`, `"DATE"`, and `"date"` all work. `Object.entries()` turns `{ Date: '...' }` into `[['Date', '...']]`, then maps each pair to a lowercased key.

### Validation and blank amount skipping
- `date` and `description` are always required — throws a user-friendly error with the 1-based row number if missing.
- `amount` is optional in the sense that a blank value causes the row to be **skipped** instead of throwing. This handles bank export rows like payment credits that have no dollar amount.
- If the amount is non-blank but cannot be parsed as a number, throws an error.

### Amount cleaning
Amount might be formatted like `"$1,234.56"` — strips everything except digits, periods, and minus signs before converting to a number using `.replace(/[^0-9.\-]/g, '')`. `String(rawAmount)` ensures it's a string first (in case the CSV parser already converted it to a number). Throws if the result is `NaN`.
