import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function FileUpload({ onUploadSuccess, onError, loading, setLoading, onNewCategory, onDeleteCategory, onExport, hasExpenses, onDeleteByMonth }) {
  const [file, setFile] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    onError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess(res.data.expenses);
      setFile(null);
    } catch (err) {
      onError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card upload-card">
      <div
        {...getRootProps()}
        className={`dropzone${isDragActive ? ' active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-icon">📂</div>
        <p className="dropzone-label">
          {isDragActive ? 'Drop your CSV here…' : 'Step #1: Drag & drop a CSV file here'}
        </p>
        <p className="dropzone-hint">The uploaded CSV file must have these columns: date, description, amount</p>
      </div>

      {file && <div className="file-name">📄 {file.name}</div>}

      <div className="upload-actions">
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Categorizing with AI…' : 'Upload & Categorize'}
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
          disabled={!hasExpenses}
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
