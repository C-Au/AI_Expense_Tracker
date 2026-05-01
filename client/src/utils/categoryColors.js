// ---------------------------------------------------------------------------
// client/src/utils/categoryColors.js  —  Color lookup for categories.
//
// Every category needs a color for the pie chart, filter pills, and
// category dropdowns. This file defines the built-in colors and provides
// helper functions to look up a color by category name.
// ---------------------------------------------------------------------------

// The default colors for the built-in categories.
// These are hex color codes (e.g. '#ff6b6b' is a red).
// Do not change the keys here unless you also update the category names
// in the Expense model on the server.
const BUILT_IN_COLORS = {
  'Food & Dining': '#ff6b6b',
  'Transport': '#ffa94d',
  'Housing': '#51cf66',
  'Utilities': '#339af0',
  'Healthcare': '#cc5de8',
  'Entertainment': '#f06595',
  'Shopping': '#ffd43b',
  'Travel': '#20c997',
  'Education': '#748ffc',
  'Other': '#adb5bd',
  'All': '#4a6cf7', // Special entry: used for the "All" filter pill.
};

/**
 * Returns the hex color for a single category name.
 * Checks built-in colors first, then custom categories from the database.
 *
 * @param {string} categoryName - The category to look up.
 * @param {Array}  customCategories - Array of { name, color } objects from the DB.
 * @returns {string} A hex color code like '#ff6b6b'.
 */
export function getCategoryColor(categoryName, customCategories = []) {
  // Return the built-in color if one exists.
  if (BUILT_IN_COLORS[categoryName]) {
    return BUILT_IN_COLORS[categoryName];
  }

  // Search the custom categories array for a matching name.
  // .find() returns the first item that satisfies the condition, or undefined.
  const custom = customCategories.find((c) => c.name === categoryName);
  if (custom) {
    return custom.color;
  }

  // If nothing matched, return a neutral grey as the fallback.
  return '#adb5bd';
}

/**
 * Merges built-in and custom category colors into one flat object.
 * Used by components that need to look up colors quickly by name.
 *
 * @param {Array} customCategories - Array of { name, color } objects from the DB.
 * @returns {object} An object like { 'Food & Dining': '#ff6b6b', 'MyCategory': '#abc123', ... }
 */
export function getAllCategoryColors(customCategories = []) {
  // Start with a copy of the built-in colors (...spread copies the object).
  const merged = { ...BUILT_IN_COLORS };

  // Add (or override) with any custom categories.
  customCategories.forEach((cat) => {
    merged[cat.name] = cat.color;
  });

  return merged;
}

export default BUILT_IN_COLORS;
