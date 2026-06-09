# App.jsx Notes

_Last updated: 2026-05-12_

## File Overview
`client/src/App.jsx` — The root component of the React front-end.

This is the "brain" of the UI. It:
1. Manages all top-level state (expenses, categories, user, etc.).
2. Fetches data from the server and passes it down to child components.
3. Handles all user actions that need to talk to the server (upload, delete, category change, export).
4. Conditionally renders the login page or the main app based on auth.

## React Concepts Used
- `useState` — stores values that cause a re-render when they change.
- `useEffect` — runs side effects (like fetching data) after renders.
- `useCallback` — memoizes functions so they don't get recreated on every render.

## Imports
- `axios` — a library that makes HTTP requests (GET, POST, etc.) easier than the built-in browser fetch API. It also auto-parses JSON responses.

## State Declarations
Each `useState` call creates a piece of state and a setter function. Calling the setter causes React to re-render the component.

| State | Purpose |
|---|---|
| `user` | The signed-in Firebase user object, or null if not signed in. |
| `authLoading` | True while waiting to find out if a user is signed in. Shows a loading spinner during this time instead of flashing the login page. |
| `isPro` | RevenueCat entitlement state. `null` = still checking, `true` = active subscription, `false` = no subscription. Kept null until confirmed to avoid flashing the paywall. |
| `expenses` | The array of expense objects currently shown in the table. |
| `categoryTotals` | Summary data for the pie chart: `[{ category, total, count }, ...]`. |
| `selectedCategory` | Which category pill is currently active. `'All'` means show everything. |
| `loading` | True while an upload is in progress (shows a spinner on the upload button). |
| `error` | An error message string, or null if no error. |
| `csvParseError` | True when the error is specifically a CSV format error (shows a special hint). |
| `darkMode` | Dark mode preference. Read from localStorage so the preference persists between visits. The `() => ...` is a "lazy initializer" — it only runs once on first render, not on every re-render. |
| `batches` | List of upload batches for the Bookshelf component. |
| `customCategories` | User-created custom categories from the database. |
| `modalOpen` | Create category modal open/close flag. |
| `deleteModalOpen` | Delete category modal open/close flag. |
| `deleteMonthModalOpen` | Delete by month modal open/close flag. |
| `rulesModalOpen` | AI Memory modal open/close flag. |
| `rules` | The AI category rules for the current user. |

## Dark Mode Toggle
Saves the NEW value (opposite of the current value) to localStorage.

## Auth State Listener + Axios Interceptor
This `useEffect` runs once when the component first mounts (because the dependency array is empty `[]`).

- `onAuthStateChanged` calls our callback every time the user signs in or out. Returns an "unsubscribe" function called on cleanup.
- When a user signs in: configure RevenueCat with their Firebase UID and immediately check whether they have an active subscription.
- If RC is unreachable, defaults to showing the paywall — safer than accidentally granting free access.
- **Axios interceptor**: runs before EVERY request made anywhere in the app. Attaches the Firebase ID token to the Authorization header so the server's auth middleware can verify the request.
- `getIdToken()` fetches a fresh token (Firebase refreshes it automatically when it expires, so we always get a valid one). Must return `config` so the request can proceed.
- **Cleanup**: runs when the component unmounts. Must unsubscribe from Firebase and remove the interceptor to avoid memory leaks.

## Data Fetching Functions
Each one is wrapped in `useCallback` so it has a stable reference and can safely be listed in `useEffect` dependency arrays without causing loops.

- `fetchExpenses(category)` — Fetches expenses, optionally filtered by category. Builds query string params object; if category is not `'All'`, includes it as a param.
- `fetchCategories()` — Fetches category totals for the pie chart.
- `fetchBatches()` — Fetches the list of upload batches for the Bookshelf.
- `fetchCustomCategories()` — Fetches custom categories from the database.
- `fetchRules()` — Fetches the user's saved AI rules.

## Effects That Trigger Data Fetches
Each `useEffect` only runs when the user is signed in (guard: `if (!user) return`).

- Re-fetches expenses when the user signs in or changes the active category.
- Re-fetches category totals whenever the expenses array changes — keeps the pie chart up to date after deletions or category changes.
- Re-fetches batches, custom categories, and rules on sign-in.

## Event Handlers
Called by child components via callback props.

- `handleUploadSuccess(newExpenses)` — Prepends the new expenses to the front of the list so they appear immediately. Also refreshes categories, batches, and clears errors.
- `handleUploadError(message, isCsvError)` — Called by FileUpload when an upload fails.
- `handleCategoryChange(id, newCategory)` — Sends a PATCH request and updates local state optimistically. Uses `.map()` to replace the updated expense in the array. Re-syncs rules since a new rule was just created server-side.
- `handleDelete(id)` — Sends a DELETE request and removes the expense from local state using `.filter()`. Re-fetches category totals so the pie chart stays accurate.
- `handleExport()` — Exports the currently filtered expenses as a CSV file. Groups expenses by category alphabetically, appends a per-category subtotal on the last row of each group, and includes a grand total in the header row. Uses the File System Access API (`showSaveFilePicker`) if available for a native save dialog; falls back to a temporary anchor link download on unsupported browsers. Handles edge cases: file open in another app (`NoModificationAllowedError`), user cancelling the dialog (`AbortError`).
