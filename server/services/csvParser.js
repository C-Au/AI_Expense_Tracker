const { parse } = require("csv-parse/sync");

function parseCSV(buffer) {
  const records = parse(buffer, {
    columns: true,
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
