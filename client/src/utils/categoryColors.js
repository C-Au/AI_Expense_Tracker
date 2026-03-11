// Built-in category colors (don't change keys unless updating Expense model defaults)
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
  'All': '#4a6cf7', // Special: for filter
};

/**
 * Get color for a category
 * @param {string} categoryName
 * @param {array} customCategories Array of { name, color } objects
 * @returns {string} Hex color code
 */
export function getCategoryColor(categoryName, customCategories = []) {
  // Check built-in first
  if (BUILT_IN_COLORS[categoryName]) {
    return BUILT_IN_COLORS[categoryName];
  }

  // Check custom categories
  const custom = customCategories.find((c) => c.name === categoryName);
  if (custom) {
    return custom.color;
  }

  // Fallback
  return '#adb5bd';
}

/**
 * Get all category colors as a merged object
 * @param {array} customCategories
 * @returns {object} { categoryName: hexColor, ... }
 */
export function getAllCategoryColors(customCategories = []) {
  const merged = { ...BUILT_IN_COLORS };
  customCategories.forEach((cat) => {
    merged[cat.name] = cat.color;
  });
  return merged;
}

export default BUILT_IN_COLORS;
