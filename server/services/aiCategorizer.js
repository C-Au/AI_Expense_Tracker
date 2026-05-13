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

async function categorizeExpenses(
  expenses,
  userRules = [],
  customCategories = [],
) {
  if (!expenses || expenses.length === 0) return expenses;

  const validCategories = [...VALID_CATEGORIES, ...customCategories];

  const rulesMap = new Map(userRules.map((r) => [r.description, r.category]));

  const uncachedIndices = [];
  const uncachedDescriptions = [];

  expenses.forEach((exp, i) => {
    const key = exp.description.toLowerCase().trim();

    if (rulesMap.has(key)) {
      categoryCache.set(key, rulesMap.get(key));
    }

    if (!categoryCache.has(key)) {
      uncachedIndices.push(i);
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

    // The AI occasionally merges or drops items. Pad with "Other" so the
    // upload never fails due to a count mismatch.
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

module.exports = { categorizeExpenses };
