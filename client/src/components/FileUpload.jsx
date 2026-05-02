// ---------------------------------------------------------------------------
// client/src/components/FileUpload.jsx  —  CSV drag-and-drop upload area
// plus the action toolbar (New Category, Delete Category, Export, etc.).
//
// React concepts used:
//   - useCallback: memoizes a function so it isn't recreated on every render.
//   - useDropzone: a hook from the react-dropzone library that handles all
//     the drag-and-drop browser events for you.
// ---------------------------------------------------------------------------
import { useCallback, useState } from 'react';

// react-dropzone is a library that makes drag-and-drop file inputs easy.
import { useDropzone } from 'react-dropzone';

import axios from 'axios';

// This component receives several functions as props from App.jsx.
// Functions passed as props are called "callback props" — the child calls them
// to notify the parent that something happened.
export default function FileUpload({ onUploadSuccess, onError, loading, setLoading, onNewCategory, onDeleteCategory, onExport, hasExpenses, onDeleteByMonth }) {
  // file holds the CSV File object the user selected (or null if none chosen).
  const [file, setFile] = useState(null);

  // onDrop is called by react-dropzone when the user drops a file.
  // accepted[] contains files that passed the accept filter below.
  // useCallback ensures the same function reference is reused between renders
  // (prevents unnecessary re-renders of child components that receive it as a prop).
  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  // useDropzone sets up the drag-and-drop zone and returns:
  //   getRootProps() — props to spread onto the drop zone <div>
  //   getInputProps() — props to spread onto the hidden <input type="file">
  //   isDragActive   — true while the user is hovering a file over the zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] }, // Only allow CSV files.
    multiple: false,                   // Only allow one file at a time.
  });

  // Called when the user clicks the "Upload & Categorize" button.
  const handleUpload = async () => {
    if (!file) return; // Guard: do nothing if no file is chosen.
    setLoading(true);
    onError(null); // Clear any previous error.

    try {
      // FormData is the standard way to send files over HTTP.
      // .append('file', file) adds the file under the field name 'file'.
      const formData = new FormData();
      formData.append('file', file);

      // POST the FormData to the server. The server parses the CSV and
      // categorizes with AI, then responds with the saved expenses.
      const res = await axios.post('/api/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Notify App.jsx that the upload succeeded so it can update state.
      onUploadSuccess(res.data.expenses);
      setFile(null); // Reset the file picker.
    } catch (err) {
      // Pass the error up to App.jsx. The second argument flags CSV format errors
      // so a special "reformat your CSV" hint can be shown.
      onError(
        err.response?.data?.error || 'Upload failed. Please try again.',
        err.response?.data?.csvParseError ?? false
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card upload-card">
      {/* Spread getRootProps() to make this div a drag-and-drop target. */}
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' active' : ''}`}
      >
        {/* Hidden file input — clicking the div opens the OS file picker. */}
        <input {...getInputProps()} />
        <div className="dropzone-icon">📂</div>
        <p className="dropzone-label">
          {isDragActive ? 'Drop your CSV here…' : 'Step #1: Drag & drop a CSV file here'}
        </p>
        <p className="dropzone-hint">The uploaded CSV file must have these columns and in this order: date, description, amount</p>
      </div>

      {/* Show the selected file name once the user picks one. */}
      {file && <div className="file-name">📄 {file.name}</div>}

      {/* Action toolbar — all the buttons across the top of the app. */}
      <div className="upload-actions">
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading || !file} // Disable while loading or if no file chosen.
        >
          {/* Show a spinner icon while the AI is working. */}
          {loading && <span className="spinner" />}
          {loading ? 'Categorizing with AI…' : 'Step #2: Upload & Categorize'}
        </button>
        <button className="new-category-btn" onClick={onNewCategory}>
          ➕ New Category
        </button>
        <button className="new-category-btn delete-category-btn-action" onClick={onDeleteCategory}>
          🗑️ Delete Category
        </button>
        <button
          className="new-category-btn export-btn-action"
          onClick={onExport}
          disabled={!hasExpenses}  // Can't export if there's nothing to export.
          title={hasExpenses ? 'Export current expenses to CSV' : 'Upload expenses first'}
        >
          ⬇️ Export CSV
        </button>
        <button
          className="new-category-btn delete-month-btn-action"
          onClick={onDeleteByMonth}
          disabled={!hasExpenses}
          title={hasExpenses ? 'Delete expenses by month' : 'No expenses to delete'}
        >
          📅 Delete by Month
        </button>
      </div>
    </div>
  );
}
