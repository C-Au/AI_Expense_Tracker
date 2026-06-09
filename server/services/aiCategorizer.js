const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const VALID_CATEGORIES = [
  "Food & Dining",
  "Transport",
  "Housing",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Travel",
  "Education",
  "Other",
];

const categoryCache = new Map();

function extractMerchantName(description) {
  let name = description.trim();
  const hashIdx = name.indexOf('#');
  if (hashIdx > 0) name = name.slice(0, hashIdx).trim();
  const starIdx = name.indexOf('*');
  if (starIdx > 0) name = name.slice(0, starIdx).trim();
  return name || description.trim();
}

async function categorizeExpenses(
  expenses,
  userRules = [],
  customCategories = [],
) {
  if (!expenses || expenses.length === 0) return expenses;

  const validCategories = [...VALID_CATEGORIES, ...customCategories];

  const rulesMap = new Map(userRules.map((r) => [r.description, r.category]));

  const uncachedKeys = new Set();
  const uncachedDescriptions = [];

  expenses.forEach((exp) => {
    const key = exp.description.toLowerCase().trim();
    const merchantKey = extractMerchantName(exp.description).toLowerCase().trim();

    const matchedCategory = rulesMap.get(merchantKey) ?? rulesMap.get(key);
    if (matchedCategory !== undefined) {
      categoryCache.set(key, matchedCategory);
    }

    if (!categoryCache.has(key) && !uncachedKeys.has(key)) {
      uncachedKeys.add(key);
      uncachedDescriptions.push(exp.description);
    }
  });

  if (uncachedDescriptions.length > 0) {
    const fewShotRules = userRules.slice(0, 50);
    const fewShotBlock =
      fewShotRules.length > 0
        ? `\nThe user has established these categorization preferences (use them as guidance for similar descriptions):\n${JSON.stringify(
            fewShotRules.map((r) => ({
              description: r.originalDescription || r.description,
              category: r.category,
            })),
          )}\n`
        : "";

    const allCategoryNames = validCategories.join(", ");

    const prompt = `Categorize each expense description into exactly one of these categories:
${allCategoryNames}.
${fewShotBlock}
Return ONLY a valid JSON array of category strings in the same order as the input descriptions.
Do not include any explanation or additional text — just the JSON array.

Descriptions:
${JSON.stringify(uncachedDescriptions)}`;

    const message = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.choices[0].message.content.trim();

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

    if (!Array.isArray(categories)) {
      throw new Error(
        `AI returned unexpected categories format: ${jsonMatch[0]}`,
      );
    }

    while (categories.length < uncachedDescriptions.length) {
      categories.push("Other");
    }

    uncachedDescriptions.forEach((desc, i) => {
      const category = validCategories.includes(categories[i])
        ? categories[i]
        : "Other";
      categoryCache.set(desc.toLowerCase().trim(), category);
    });
  }

  return expenses.map((exp) => ({
    ...exp,
    category:
      categoryCache.get(exp.description.toLowerCase().trim()) ?? "Other",
  }));
}

module.exports = { categorizeExpenses, extractMerchantName };
