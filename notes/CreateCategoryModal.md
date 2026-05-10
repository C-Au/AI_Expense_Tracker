# CreateCategoryModal.jsx Notes

## File Overview
`client/src/components/CreateCategoryModal.jsx` — "New Category" popup.

A modal dialog (overlay + card) that lets the user type a category name and pick a color. On submit, it POSTs to the server and then closes.

Modals in React are usually just a conditionally rendered `<div>` that covers the whole screen. Clicking the overlay closes the modal; clicking inside the card does NOT close it (`stopPropagation`).

## Props
- `isOpen` — boolean that controls whether the modal is visible.
- `onClose` — callback to hide the modal (called when user cancels or succeeds).
- `onSuccess` — callback called after a category is successfully created. App.jsx uses this to refresh the categories list.

## State
| State | Purpose |
|---|---|
| `name` | The typed category name. |
| `color` | The chosen hex color. Default: `'#e8d4b8'` (tan). |
| `loading` | True while the request is in flight. |
| `error` | Error message or null. |

## `handleSubmit`
- `e.preventDefault()` stops the browser from reloading the page (default behavior when a form is submitted).
- Basic validation — name must not be empty or just spaces (`!name.trim()`).
- `.trim()` removes accidental leading/trailing spaces before sending to server.
- Resets form fields back to defaults on success.
- Calls `onSuccess()` to tell App.jsx to re-fetch the categories list.
- Shows the server's error message (e.g. "Category already exists") on failure.

## JSX Notes
- If `isOpen` is false, renders nothing at all (the modal is hidden).
- The overlay covers the entire screen. Clicking it closes the modal.
- `e.stopPropagation()` prevents clicks inside the card from bubbling up to the overlay's `onClick` and accidentally closing the modal.
- `×` is the HTML entity for the × (times) symbol.
- `onSubmit` runs `handleSubmit` when the user presses Enter or clicks "Create".
- "Controlled input" pattern — React owns the value via state: `value={name}` displays the current state; `onChange={...}` updates state on every keystroke.
- `type="color"` shows the OS color picker widget.
- The color preview swatch shows the chosen color next to the hex value.
- `type="button"` prevents form submission on the Cancel button.
- `type="submit"` triggers `onSubmit` on the Create button.
