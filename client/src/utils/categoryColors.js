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
  'All': '#4a6cf7', 
};


export function getCategoryColor(categoryName, customCategories = []) {

  if (BUILT_IN_COLORS[categoryName]) {
    return BUILT_IN_COLORS[categoryName];
  }


  const custom = customCategories.find((c) => c.name === categoryName);
  if (custom) {
    return custom.color;
  }


  return '#adb5bd';
}


export function getAllCategoryColors(customCategories = []) {

  const merged = { ...BUILT_IN_COLORS };


  customCategories.forEach((cat) => {
    merged[cat.name] = cat.color;
  });

  return merged;
}

export default BUILT_IN_COLORS;
