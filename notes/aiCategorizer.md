# aiCategorizer.js Notes

_Last updated: 2026-05-12_

## File Overview
`server/services/aiCategorizer.js` — AI-powered expense categorization.

Sends expense descriptions to an AI language model (GPT-4o-mini) and gets back a category for each one.

## Key Optimizations (to save money and time)
1. **Exact-match rules** — if the user already told us what category "Whole Foods Market" is, we skip the AI entirely for that item.
2. **In-memory cache** — if the same description appears twice in the same upload (or across uploads during the same server session), we reuse the result instead of calling the AI again.
3. **Batch API call** — instead of calling the AI once per expense, we send ALL uncached descriptions in a single request.

## Setup
- Uses the OpenAI SDK but pointed at **OpenRouter**, which lets you access many AI models (including OpenAI's) through one unified API.
- `baseURL: "https://openrouter.ai/api/v1"` redirects calls to OpenRouter.

## `VALID_CATEGORIES`
The full list of allowed categories. Any AI response that isn't in this list gets replaced with `'Other'` to prevent unexpected categories from being saved to the database.

## `categoryCache`
A `Map` that stores `lowercased description → category` pairs. Lives in memory for as long as the server is running. A Map works like a dictionary: key → value pairs. O(1) lookup speed (much faster than searching an array).

---

## `categorizeExpenses(expenses, userRules, customCategories)`
Given an array of expense objects, returns the same array with a `category` field added to each item.

### Parameters
- `expenses` — array of expense objects with a `description` field.
- `userRules` — optional array of `{ description, category }` saved rules. Descriptions must already be normalized (lowercased + trimmed).
- `customCategories` — array of custom category names to merge with the built-in list.

### Step 1: Build the valid categories list
Merges built-in categories with any user-created custom ones.

### Step 2: Convert rules to a Map
Converts the `userRules` array into a Map for O(1) lookup speed. Searching an array is O(n); looking up a Map key is O(1).

### Step 3: Find uncached descriptions
For each expense:
- Normalizes: lowercase + trim so `"Whole Foods"` and `"whole foods"` both match the same rule.
- If the description matches a saved rule, puts it in the in-memory cache (so it won't be sent to the AI).
- If not already cached AND not already queued, adds it to `uncachedDescriptions` for the AI call.

**Deduplication:** A `Set` (`uncachedKeys`) tracks which normalized descriptions have already been queued. Without this, two expenses with the same description string (e.g. two `KOZY HOUSTON NORTH` rows) would both be added to the batch before the cache is populated, causing the AI to receive duplicates and potentially return fewer items than sent. Each unique description is sent to the AI exactly once.

### Step 4: Call the AI (only if needed)
Only called if there are descriptions not yet in the cache.

**Few-shot prompting**: gives the AI examples of the user's saved rules so it understands preferences before categorizing new items. Capped at 50 rules to keep the prompt (and token cost) reasonable.

**Prompt structure**: Very explicit — "return ONLY a valid JSON array" so the response is easy to parse and no extra explanation text is returned.

**Model**: `openai/gpt-4o-mini` — cheap and fast, good for classification.
- `max_tokens: 1024` — limits response length to keep costs low.

**Response parsing**:
- The AI's reply is in `message.choices[0].message.content`.
- The AI sometimes wraps JSON in markdown code fences (` ```json ... ``` `). The regex `\[[\s\S]*\]` finds the first `[...]` block and extracts it.
- Count safety: the AI occasionally returns fewer categories than expected (e.g. if it merges similar descriptions). Instead of throwing, the response is padded with `'Other'` until its length matches the number of descriptions sent. This ensures the upload never fails due to a count mismatch.
- If the AI returns an unrecognized category, falls back to `'Other'`.

### Step 5: Return results
Maps over all expenses and looks up each description in the cache. The `??` operator means "use `'Other'` if the left side is `null` or `undefined`".
