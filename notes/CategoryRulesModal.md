# CategoryRulesModal.jsx Notes

## File Overview
`client/src/components/CategoryRulesModal.jsx` — "AI Memory" popup.

Shows all the AI category rules the user has created by reassigning expense categories. Users can remove individual rules here, which tells the AI to forget that preference on the next upload.

## React Concepts Used
- `useCallback` — caches `fetchRules` so it doesn't change reference on every render, which would otherwise cause the `useEffect` below to loop.
- `useEffect` with `[isOpen, fetchRules]` — re-fetches rules each time the modal opens.

## Props
- `isOpen` — controls visibility.
- `onClose` — closes the modal.
- `onRuleDeleted` — optional callback so App.jsx can refresh its local rules state.

## State
| State | Purpose |
|---|---|
| `rules` | The list of rules from the server. |
| `loading` | True while fetching. |
| `error` | Error message or null. |
| `deletingId` | The `_id` of the rule currently being deleted. |

## `fetchRules` with `useCallback`
`useCallback` memoizes this function so it has a stable reference. Without it, defining `fetchRules` inside the component would create a new function object on every render, causing `useEffect` to re-run infinitely. Empty dependency array `[]` means this function never changes.

## `handleDelete`
- Sets `deletingId` to show a loading state on the specific "Remove" button.
- Removes the deleted rule from local state without re-fetching everything via `prev.filter()`.
- Notifies App.jsx if it provided a `onRuleDeleted` callback.

## `extractMerchantName(description)`
Defined at module level. Applied when displaying `rule.originalDescription` in the table. Strips transaction-specific noise (`#` store numbers, `*` processor suffixes) so only the merchant name is shown — e.g. `"CHICK-FIL-A #02826 HOUSTON, TX 11.25 USD @ 1.408888"` renders as `"CHICK-FIL-A"`. This is a display-only transformation; the raw value in the database is unchanged. Also applied to the `aria-label` on the Remove button for consistency.

## JSX Notes
- `&times;` renders as the × symbol. `aria-label` helps screen readers.
- Shows a spinner while fetching rules.
- Shows empty state message if no rules exist yet.
- `disabled={deletingId === rule._id}` disables only the button for the rule being deleted.
- `aria-label` on the delete button uses `extractMerchantName(rule.originalDescription)` so screen reader text matches what is visually displayed.
- Empty `<th>` for the Remove button column.
- A styled badge (`.rules-category-badge`) shows the category name in each rule row.
- The description cell renders `extractMerchantName(rule.originalDescription)` rather than the raw value, so old rules stored with full transaction strings display cleanly alongside new rules.

---

## Changelog

### 2026-05-30
- Added module-level `extractMerchantName(description)` function (same logic as `ExpenseTable.jsx`) that strips `#...` and `*...` suffixes.
- Applied it to `rule.originalDescription` in the description table cell so only the merchant name is shown (e.g. `"CHICK-FIL-A"` instead of `"CHICK-FIL-A #02826 HOUSTON, TX 11.25 USD @ 1.408888"`).
- Applied it to the `aria-label` on the Remove button for consistency.
- The database value is not modified; this is a display-only change.
