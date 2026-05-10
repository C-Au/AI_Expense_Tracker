# DeleteCategoryModal.jsx Notes

## File Overview
`client/src/components/DeleteCategoryModal.jsx` — Delete custom categories.

Shows a list of all custom categories the user created. Each row has a Delete button. When a category is deleted, the server automatically moves all its expenses to "Other".

Note: `loading` state stores the NAME being deleted (not just `true`/`false`). This lets us show a "Deleting…" label on the specific button clicked while disabling all other buttons at the same time.

## Props
- `isOpen` — controls visibility.
- `onClose` — closes the modal.
- `onSuccess` — called after a deletion so App.jsx can refresh.
- `customCategories` — array of `{ name, color }` objects from the server.

## State
| State | Purpose |
|---|---|
| `loading` | Holds the name of the category currently being deleted, or null. Using the name (instead of a boolean) lets us target the exact button. |
| `error` | Error message or null. |

## `handleDelete`
- Sets `loading` to the category name to mark it as being deleted.
- `encodeURIComponent` converts special characters (spaces, slashes, etc.) into URL-safe escape codes so the name can safely appear in the URL.
- Refreshes the parent's category list via `onSuccess()`.
- Closes the modal automatically if that was the last custom category (`customCategories.length <= 1`).
- Clears loading state regardless of success or failure in `finally`.

## JSX Notes
- All buttons are disabled while any deletion is in progress (`disabled={loading !== null}`).
- Only the clicked button shows 'Deleting…' text (`loading === cat.name`).
- React fragments (`<></>`) let you return multiple elements without adding an extra `<div>` to the DOM.
- A small colored square swatch shows the category color next to its name.
- Shows "No custom categories to delete." when the list is empty.
- "Deleting a category will reassign its expenses to 'Other'." hint is shown above the list.
