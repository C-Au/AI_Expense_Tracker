const { parse } = require("csv-parse/sync");

// Returns true if the first line looks like a header row (contains the
// expected column names). Allows files exported without headers to work.
function hasHeaderRow(buffer) {
  const firstLine = buffer.toString("utf8").split(/\r?\n/)[0].toLowerCase();
  return (
    firstLine.includes("date") &&
    firstLine.includes("description") &&
    firstLine.includes("amount")
  );
}

function parseCSV(buffer) {
  const withHeader = hasHeaderRow(buffer);

  const records = parse(buffer, {
    // If no header row is present, assign column names positionally so the
    // rest of the function can handle both formats identically.
    columns: withHeader ? true : ["date", "description", "amount"],
    skip_empty_lines: true,
    trim: true,
  });

  const expenses = records.map((row, index) => {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]),
    );

    const date = normalized["date"];
    const description = normalized["description"];
    const rawAmount = normalized["amount"];

    if (!date || !description || rawAmount === undefined) {
      throw new Error(
        `Row ${index + 1} is missing required fields (date, description, amount). Got: ${JSON.stringify(normalized)}`,
      );
    }

    const amount = parseFloat(String(rawAmount).replace(/[^0-9.\-]/g, ""));
    if (isNaN(amount)) {
      throw new Error(`Row ${index + 1} has an invalid amount: "${rawAmount}"`);
    }

    return { date, description, amount };
  });

  return expenses;
}

module.exports = { parseCSV };
