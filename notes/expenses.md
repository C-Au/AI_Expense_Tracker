# expenses.js (routes) Notes

## File Overview
`server/routes/expenses.js` — All the API endpoints for this app.

An "endpoint" (or "route") is a URL that the React front-end can send HTTP requests to. The server responds with JSON data.

HTTP verbs used:
- `GET` — read/fetch data
- `POST` — create new data
- `PATCH` — partially update existing data
- `DELETE` — remove data

## Setup
- `multer` — handles `multipart/form-data` (file uploads). Without it, Express can't read the binary CSV file sent from the browser.
- `uuidv4` — generates a random unique ID. Used to group expenses uploaded in the same CSV batch.
- `express.Router()` — creates a mini-app that handles a subset of routes. Mounted at `/api/expenses` in `index.js`.

## Multer Configuration
- `multer.memoryStorage()` keeps the uploaded file in RAM (as a Buffer) instead of writing it to disk. Perfect for small files like CSVs.
- `fileFilter` runs before the file is stored. `cb(null, true)` accepts the file; `cb(new Error(...), false)` rejects it. Only allows CSV files.
- `limits: { fileSize: 5 * 1024 * 1024 }` — rejects files larger than 5 MB.

---

## `POST /api/expenses/upload`
The user uploads a CSV → server parses it → AI categorizes it → saved to DB.

**Steps:**
1. Parse the raw CSV buffer into expense objects. Wrapped in its own `try/catch` so parse errors can be flagged separately and the front-end can show a "reformat your CSV" hint.
2. Load the user's saved category rules from the database.
3. Load custom category names so the AI knows they exist.
4. Send the expenses to the AI for categorization.
5. Save all categorized expenses to MongoDB in one bulk insert with `insertMany`. `uuidv4()` creates a unique batch ID shared by all expenses in this upload.

Responds with `201 Created` and the saved expenses.

---

## `GET /api/expenses`
Returns all expenses, with optional filters and sorting.

Query params: `category`, `batch`, `sortBy` (default: `'date'`), `order` (`'asc'` or `'desc'`, default: `'desc'`).

- `req.query` contains the URL query string parsed into an object (e.g. `/api/expenses?category=Food` becomes `{ category: 'Food' }`).
- Builds a MongoDB filter object dynamically based on what was provided.
- MongoDB sort uses `1` for ascending and `-1` for descending.
- `[sortBy]` is computed property syntax — the key name comes from the variable.

---

## `GET /api/expenses/categories`
Returns totals grouped by category (used to draw the pie chart).

> **IMPORTANT:** This route must appear BEFORE `/:id` so Express doesn't mistake `"categories"` for a MongoDB document ID.

Uses a MongoDB **aggregation pipeline** — a series of data transformation steps applied one after another:
1. `$match` — filter down to only the user's documents.
2. `$group` — group all expenses by category and sum their amounts. `_id` is the "group by" field.
3. `$sort` — sort by total descending (biggest spender first).

`Math.round(x * 100) / 100` rounds totals to 2 decimal places.

---

## `GET /api/expenses/batches`
Returns a list of all upload batches. Each CSV upload = one batch. Used by the Bookshelf component to show one "book" per upload. Sorted oldest-first so books appear left-to-right in chronological order.

Uses aggregation: groups by `uploadBatch` UUID, grabs the date from the first expense in the batch, counts expenses, and uses `$min` of `createdAt` as the upload time.

---

## `GET /api/expenses/months`
Returns a list of distinct year-month values that have expenses. Used by the "Delete by Month" modal.

Uses aggregation: `$substr` extracts the first 7 characters of the date string (`"YYYY-MM"`). E.g. `"2024-01-15"` becomes `"2024-01"`. Sorted most recent first.

---

## `DELETE /api/expenses/by-month/:month`
Deletes all expenses whose date falls within a given month.

- Validates the format is exactly `YYYY-MM` before touching the database. `\d{4}` = exactly 4 digits, `\d{2}` = exactly 2 digits.
- `$regex` matches all dates that START with `"YYYY-MM"`. The `^` anchor means "beginning of string".

---

## `PATCH /api/expenses/:id`
Changes the category of one expense AND saves a rule so the AI remembers this correction for future uploads. Triggered every time the user picks a category from the dropdown.

- `findOneAndUpdate` scopes by both `_id` and `userId` so a user can only update their own expenses.
- `{ new: true }` returns the updated document.
- `runValidators: true` re-runs schema validation on the new values.
- Returns `404` if no matching expense is found.
- Calls `extractMerchantName(updated.description)` (imported from `aiCategorizer.js`) to strip transaction-specific noise before saving the rule. For example, `"CHICK-FIL-A #02826 HOUSTON, TX 11.25 USD @ 1.408888"` becomes `"CHICK-FIL-A"`. This means the saved rule will match future transactions from the same merchant even if the store number, city, or amount differs.
- Saves a correction as an AI rule using `findOneAndUpdate` with `{ upsert: true }`:
  - If a rule already exists for this user + extracted merchant name → update it.
  - If no rule exists yet → create a new one.
  - Prevents duplicate rules from building up.
- Both `description` (normalized/lowercased merchant name) and `originalDescription` (original-casing merchant name) use the extracted value, so the AI Memory modal displays the clean merchant name instead of the raw transaction string.

---

## `DELETE /api/expenses/:id`
Permanently removes one expense. `findOneAndDelete` scopes by both `_id` and `userId` so a user can only delete their own expenses.

---

## `GET /api/expenses/rules`
Returns all saved AI rules for the currently signed-in user, sorted by most recently updated. Displayed in the "AI Memory" modal. `req.user.uid` is set by the auth middleware.

---

## `DELETE /api/expenses/rules/:id`
Removes one AI rule. Scoped by both `_id` AND `userId` so users can't delete each other's rules.

---

## `GET /api/expenses/custom-categories`
Returns all user-created categories sorted alphabetically. `sort({ name: 1 })` sorts ascending.

---

## Changelog

### 2026-05-30
- **`PATCH /api/expenses/:id`** — now calls `extractMerchantName()` (imported from `aiCategorizer.js`) before saving the AI rule. The rule key and display name are now the extracted merchant name (e.g. `"CHICK-FIL-A"`) rather than the full transaction description. This makes rules re-usable across different visits to the same merchant.

## `POST /api/expenses/custom-categories`
Creates a new custom category with a name and color. Creates a new Mongoose document instance and saves it. MongoDB error code `11000` means a duplicate key (unique constraint violated) — happens if the user tries to create a category that already exists.

---

## `DELETE /api/expenses/custom-categories/:name`
Removes a custom category AND reassigns all its expenses to `"Other"`. `updateMany` moves all matching expenses to `"Other"` in one database operation to prevent orphaned expenses.
