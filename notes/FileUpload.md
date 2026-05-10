# FileUpload.jsx Notes

## File Overview
`client/src/components/FileUpload.jsx` — CSV drag-and-drop upload area plus the action toolbar (New Category, Delete Category, Export, etc.).

## React Concepts Used
- `useCallback` — memoizes a function so it isn't recreated on every render.
- `useDropzone` — a hook from the `react-dropzone` library that handles all the drag-and-drop browser events for you.

## Imports
- `react-dropzone` — a library that makes drag-and-drop file inputs easy.

## Props
Functions passed as props are called "callback props" — the child calls them to notify the parent that something happened.

- `onUploadSuccess` — called after a successful upload.
- `onError` — called when an upload fails.
- `loading` — current loading state from App.jsx.
- `setLoading` — setter for loading state.
- `onNewCategory` — opens the Create Category modal.
- `onDeleteCategory` — opens the Delete Category modal.
- `onExport` — triggers CSV export.
- `hasExpenses` — whether there are any expenses to export/delete.
- `onDeleteByMonth` — opens the Delete by Month modal.

## State
- `file` — holds the CSV `File` object the user selected (or `null` if none chosen).

## `onDrop`
Called by `react-dropzone` when the user drops a file. `accepted[]` contains files that passed the `accept` filter. `useCallback` ensures the same function reference is reused between renders (prevents unnecessary re-renders of child components that receive it as a prop).

## `useDropzone`
Sets up the drag-and-drop zone and returns:
- `getRootProps()` — props to spread onto the drop zone `<div>`.
- `getInputProps()` — props to spread onto the hidden `<input type="file">`.
- `isDragActive` — true while the user is hovering a file over the zone.

Configuration:
- `accept: { 'text/csv': ['.csv'] }` — only allows CSV files.
- `multiple: false` — only allows one file at a time.

## `handleUpload`
Called when the user clicks the "Upload & Categorize" button.
- Guard: does nothing if no file is chosen (`if (!file) return`).
- `FormData` is the standard way to send files over HTTP. `.append('file', file)` adds the file under the field name `'file'`.
- POSTs `FormData` to the server. The server parses the CSV and categorizes with AI, then responds with the saved expenses.
- Notifies App.jsx that the upload succeeded so it can update state.
- Resets the file picker on success.
- Passes the error up to App.jsx. The second argument flags CSV format errors so a special "reformat your CSV" hint can be shown.

## JSX Notes
- The drop zone `<div>` gets `{...getRootProps()}` spread onto it to make it a drag-and-drop target.
- The hidden file input gets `{...getInputProps()}` — clicking the div opens the OS file picker.
- Shows the selected file name once the user picks one.
- The Upload button is disabled while loading or if no file is chosen.
- Shows a spinner icon while the AI is working.
- The Export CSV button is disabled when there's nothing to export (`!hasExpenses`), with a `title` tooltip explaining why.
- The Delete by Month button is similarly disabled when there are no expenses.
