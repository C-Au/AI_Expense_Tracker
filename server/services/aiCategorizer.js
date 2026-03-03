const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const VALID_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Housing',
  'Utilities',
  'Healthcare',
  'Entertainment',
  'Shopping',
  'Travel',
  'Education',
  'Other',
];

// Simple in-memory cache to avoid re-categorizing identical descriptions
const categoryCache = new Map();

/**
 * Given an array of expense objects, returns the same array with a `category`
 * field added to each item. Uses a single batched API call and an in-memory
 * cache for duplicate descriptions.
 */
async function categorizeExpenses(expenses) {
  if (!expenses || expenses.length === 0) return expenses;

  // Separate already-cached from uncached
  const uncachedIndices = [];
  const uncachedDescriptions = [];

  expenses.forEach((exp, i) => {
    const key = exp.description.toLowerCase().trim();
    if (!categoryCache.has(key)) {
      uncachedIndices.push(i);
      uncachedDescriptions.push(exp.description);
    }
  });

  // Fetch categories from AI for uncached descriptions
  if (uncachedDescriptions.length > 0) {
    const prompt = `Categorize each expense description into exactly one of these categories:
Food & Dining, Transport, Housing, Utilities, Healthcare, Entertainment, Shopping, Travel, Education, Other.

Return ONLY a valid JSON array of category strings in the same order as the input descriptions.
Do not include any explanation or additional text — just the JSON array.

Descriptions:
${JSON.stringify(uncachedDescriptions)}`;

    const message = await client.chat.completions.create({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.choices[0].message.content.trim();

    // Extract the JSON array from the response (strip any surrounding markdown fences)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Unexpected AI response format: ${responseText}`);
    }

    let categories;
    try {
      categories = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`Failed to parse AI categories JSON: ${jsonMatch[0]}`);
    }

    if (!Array.isArray(categories) || categories.length !== uncachedDescriptions.length) {
      throw new Error(
        `AI returned ${categories.length} categories for ${uncachedDescriptions.length} descriptions`
      );
    }

    // Store in cache
    uncachedDescriptions.forEach((desc, i) => {
      const category = VALID_CATEGORIES.includes(categories[i]) ? categories[i] : 'Other';
      categoryCache.set(desc.toLowerCase().trim(), category);
    });
  }

  // Build result array
  return expenses.map((exp) => ({
    ...exp,
    category: categoryCache.get(exp.description.toLowerCase().trim()) ?? 'Other',
  }));
}

module.exports = { categorizeExpenses };
