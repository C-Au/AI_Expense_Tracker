// ---------------------------------------------------------------------------
// server/services/csvParser.js  —  Converts an uploaded CSV file into
// an array of expense objects the rest of the app can work with.
//
// Expected CSV format (any column order, case-insensitive headers):
//   date, description, amount
//   2024-01-05, Whole Foods Market, 87.43
// ---------------------------------------------------------------------------

// csv-parse is a battle-tested library for parsing CSV files.
// We use the /sync variant which returns data directly instead of streaming.
const { parse } = require('csv-parse/sync');

/**
 * Parse a CSV buffer into an array of expense objects.
 * Expects columns: date, description, amount (case-insensitive, any order).
 *
 * @param {Buffer} buffer - The raw file bytes from the multer upload.
 * @returns {object[]} Array of { date, description, amount } objects.
 * @throws {Error} If any row is missing required fields or has an invalid amount.
 */
function parseCSV(buffer) {
  // parse() reads the CSV and returns an array of objects.
  // { columns: true } means the first row is treated as headers,
  // so each row becomes { Date: '...', Description: '...', Amount: '...' }.
  const records = parse(buffer, {
    columns: true,          // First row = headers (column names).
    skip_empty_lines: true, // Ignore blank lines in the file.
    trim: true,             // Strip spaces from each value.
  });

  // Transform each raw CSV row into a clean expense object.
  const expenses = records.map((row, index) => {
    // Normalize column names to lowercase so "Date", "DATE", and "date"
    // all work. Object.entries() turns { Date: '...' } into [['Date', '...']]
    // and we map each pair to a lowercased key.
    const normalized = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
    );

    const date = normalized['date'];
    const description = normalized['description'];
    const rawAmount = normalized['amount'];

    // If any required field is missing, throw a user-friendly error.
    // "index + 1" gives a 1-based row number (easier for users to find in Excel).
    if (!date || !description || rawAmount === undefined) {
      throw new Error(
        `Row ${index + 1} is missing required fields (date, description, amount). Got: ${JSON.stringify(normalized)}`
      );
    }

    // Amount might be formatted like "$1,234.56" — strip everything except
    // digits, periods, and minus signs before converting to a number.
    // String(rawAmount) ensures it's a string first (in case the CSV parser
    // already converted it to a number).
    const amount = parseFloat(String(rawAmount).replace(/[^0-9.\-]/g, ''));
    if (isNaN(amount)) {
      throw new Error(`Row ${index + 1} has an invalid amount: "${rawAmount}"`);
    }

    return { date, description, amount };
  });

  return expenses;
}

module.exports = { parseCSV };
