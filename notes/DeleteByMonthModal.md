# DeleteByMonthModal.jsx Notes

## File Overview
`client/src/components/DeleteByMonthModal.jsx` — Delete expenses by month.

Fetches the list of months that have expenses, then lets the user permanently delete all expenses for one month at a time.

Key pattern: the month list is fetched inside a `useEffect` that runs whenever `isOpen` changes to true. This means the list is always fresh when you open the modal, without fetching unnecessarily when it's closed.

## Props
- `isOpen` — controls visibility.
- `onClose` — closes the modal.
- `onSuccess` — called after deletion so App.jsx can refresh expense data.

## State
| State | Purpose |
|---|---|
| `months` | List of `{ month, count }` objects. |
| `loading` | True while fetching the month list. |
| `deleting` | The month string currently being deleted. |
| `error` | Error message or null. |

## `useEffect`
Runs the callback whenever one of the values in the dependency array changes. Re-fetches months each time the modal opens. Does nothing if the modal isn't open (`if (!isOpen) return`). Only re-runs when `isOpen` changes.

## `formatMonth(ym)`
Converts `"2024-01"` into `"January 2024"` for display.
- `Number()` converts the string `"01"` to the integer `1`.
- Month is 0-indexed in JavaScript Date, so we subtract 1.

## `handleDelete`
- `window.confirm` shows a native browser confirmation dialog. If the user clicks "Cancel", the function returns early.
- Tracks which month is being deleted via `setDeleting(month)`.
- Removes the deleted month from local list without re-fetching via `prev.filter()`. Returns a new array without the deleted month.
- Notifies App.jsx to refresh the expense table via `onSuccess()`.
- Closes automatically if that was the last month (`months.length <= 1`).
