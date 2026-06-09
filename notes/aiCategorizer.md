# aiCategorizer.js Notes

_Last updated: 2026-05-30_

## File Overview
`server/services/aiCategorizer.js` — AI-powered expense categorization.

Sends expense descriptions to an AI language model (GPT-4o-mini) and gets back a category for each one.

## Key Optimizations (to save money and time)
1. **Merchant-name rules** — if the user has told us what category "CHICK-FIL-A" is, we skip the AI for any transaction whose description starts with that merchant name (e.g. `"CHICK-FIL-A #02826 HOUSTON, TX..."`). The extracted merchant name is matched first; the full description is tried as a fallback for rules saved before this behavior was introduced.
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

## `extractMerchantName(description)`
Strips transaction-specific noise from a bank description and returns just the merchant name. Used so that a rule saved for one Chick-fil-A visit also matches future visits with different store numbers, cities, or amounts.

| Pattern removed | Example |
|---|---|
| `#` and everything after | `"CHICK-FIL-A #02826 HOUSTON, TX 11.25 USD"` → `"CHICK-FIL-A"` |
| `*` and everything after | `"Patreon* Membership Internet"` → `"Patreon"` |

If both `#` and `*` are present, whichever appears first takes precedence. Falls back to the original description if extraction would produce an empty string.

Exported so `expenses.js` can reuse the same logic when saving rules.

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
- Normalizes the full description: lowercase + trim.
- Extracts the merchant name via `extractMerchantName()` and normalizes that too.
- Rule lookup checks the **merchant name key first**, then falls back to the **full description key**. This means a rule for `"chick-fil-a"` will match `"CHICK-FIL-A #02826 HOUSTON, TX 11.25 USD @ 1.408888"`, and old rules stored under the full description still work.
- If a rule matches, the result goes straight into the in-memory cache (skipping the AI).
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

---

## Module Exports
- `categorizeExpenses` — main function used by the upload route.
- `extractMerchantName` — exported so `expenses.js` can call it when saving rules, keeping the extraction logic in one place.

---

## Changelog

### 2026-05-30
- Added `extractMerchantName(description)` function that strips store numbers (`#...`) and processor suffixes (`*...`) from transaction descriptions, returning just the merchant name.
- Updated rule-matching in Step 3 to look up the extracted merchant name first, then fall back to the full description. Old rules saved under a full description continue to work.
- Exported `extractMerchantName` so `expenses.js` can reuse it.
- Updated "Key Optimizations" item 1 to reflect merchant-name matching instead of exact-match.
