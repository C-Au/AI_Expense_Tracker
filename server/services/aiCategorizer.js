// ---------------------------------------------------------------------------
// server/services/aiCategorizer.js  —  AI-powered expense categorization.
//
// This file sends expense descriptions to an AI language model (GPT-4o-mini)
// and gets back a category for each one.
//
// Key optimizations to save money and time:
//   1. Exact-match rules  — if the user already told us what category
//      "Whole Foods Market" is, we skip the AI entirely for that item.
//   2. In-memory cache   — if the same description appears twice in the
//      same upload (or across uploads during the same server session),
//      we reuse the result instead of calling the AI again.
//   3. Batch API call    — instead of calling the AI once per expense,
//      we send ALL uncached descriptions in a single request.
// ---------------------------------------------------------------------------
const OpenAI = require("openai");

// We use the OpenAI SDK but pointed at OpenRouter, which lets us access
// many AI models (including OpenAI's) through one unified API.
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// The full list of allowed categories.
// Any AI response that isn't in this list gets replaced with 'Other'
// to prevent unexpected categories from being saved to the database.
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

// A Map works like a dictionary: it stores key → value pairs.
// Here the key is a lowercased expense description and the value is a category.
// This cache lives in memory for as long as the server is running.
const categoryCache = new Map();

/**
 * Given an array of expense objects, returns the same array with a `category`
 * field added to each item. Uses a single batched API call and an in-memory
 * cache for duplicate descriptions.
 *
 * @param {object[]} expenses - Array of expense objects with a `description` field.
 * @param {object[]} userRules - Optional array of { description, category } saved rules.
 *   Descriptions in userRules must already be normalized (lowercased + trimmed).
 *   Rules are applied in two ways:
 *   1. Exact match: if a description matches a rule exactly, the AI is skipped for it.
 *   2. Few-shot: remaining rules are injected into the AI prompt as examples.
 */
async function categorizeExpenses(
  expenses,
  userRules = [],
  customCategories = [],
) {
  // If there's nothing to categorize, return early.
  if (!expenses || expenses.length === 0) return expenses;

    // Merge built-in categories with any user-created custom ones.
  const validCategories = [...VALID_CATEGORIES, ...customCategories];

  // Convert the userRules array into a Map for O(1) lookup speed.
  // (Searching an array is O(n); looking up a Map key is O(1).)
  const rulesMap = new Map(userRules.map((r) => [r.description, r.category]));

  // We'll collect the indices and descriptions of expenses NOT already in cache.
  const uncachedIndices = [];
  const uncachedDescriptions = [];

  expenses.forEach((exp, i) => {
    // Normalize: lowercase + remove extra spaces so "Whole Foods" and
    // "whole foods" both match the same rule.
    const key = exp.description.toLowerCase().trim();

    // If this description matches a saved rule, put it in the in-memory cache.
    // This also means it won't be sent to the AI below.
    if (rulesMap.has(key)) {
      categoryCache.set(key, rulesMap.get(key));
    }

    // If the category isn't cached yet, add it to the list for the AI call.
    if (!categoryCache.has(key)) {
      uncachedIndices.push(i);
      uncachedDescriptions.push(exp.description);
    }
  });

  // ---------------------------------------------------------------------------
  // Only call the AI if there are descriptions we haven't seen before.
  // ---------------------------------------------------------------------------
  if (uncachedDescriptions.length > 0) {
    // Build "few-shot examples" from the user's saved rules.
    // Few-shot prompting means giving the AI examples of what you want
    // so it understands your preferences before it categorizes new items.
    // We cap at 50 rules to keep the prompt (and token cost) reasonable.
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

    // Build the full prompt text that gets sent to the AI.
    // We're very explicit: "return ONLY a JSON array" so the response is
    // easy to parse and we don't get extra explanation text.
    const allCategoryNames = validCategories.join(", ");

    const prompt = `Categorize each expense description into exactly one of these categories:
${allCategoryNames}.
${fewShotBlock}
Return ONLY a valid JSON array of category strings in the same order as the input descriptions.
Do not include any explanation or additional text — just the JSON array.

Descriptions:
${JSON.stringify(uncachedDescriptions)}`;

    // Send the prompt to the AI and wait for the response.
    const message = await client.chat.completions.create({
      model: "openai/gpt-4o-mini", // Cheap and fast model — good for classification.
      max_tokens: 1024, // Limit response length to keep costs low.
      messages: [{ role: "user", content: prompt }],
    });

    // The AI's reply is in message.choices[0].message.content.
    const responseText = message.choices[0].message.content.trim();

    // The AI sometimes wraps JSON in markdown code fences (``` json ... ```).
    // This regex finds the first [...] block in the response and extracts it.
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(`Unexpected AI response format: ${responseText}`);
    }

    // Parse the JSON string into a JavaScript array.
    let categories;
    try {
      categories = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error(`Failed to parse AI categories JSON: ${jsonMatch[0]}`);
    }

    // Sanity check: the AI should return exactly one category per description.
    if (
      !Array.isArray(categories) ||
      categories.length !== uncachedDescriptions.length
    ) {
      throw new Error(
        `AI returned ${categories.length} categories for ${uncachedDescriptions.length} descriptions`,
      );
    }

    // Store each result in the in-memory cache.
    // If the AI returned a category we don't recognize, fall back to 'Other'.
    uncachedDescriptions.forEach((desc, i) => {
      const category = validCategories.includes(categories[i])
        ? categories[i]
        : "Other";
      categoryCache.set(desc.toLowerCase().trim(), category);
    });
  }

  // Build the final result: spread the original expense object and add the category.
  // The ?? operator means "use 'Other' if the left side is null or undefined".
  return expenses.map((exp) => ({
    ...exp,
    category:
      categoryCache.get(exp.description.toLowerCase().trim()) ?? "Other",
  }));
}

module.exports = { categorizeExpenses };
