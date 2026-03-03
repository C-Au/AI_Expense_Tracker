import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

export default function FileUpload({ onUploadSuccess, onError, loading, setLoading }) {
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
          {isDragActive ? 'Drop your CSV here…' : 'Drag & drop a CSV file here'}
        </p>
        <p className="dropzone-hint">or click to browse — columns: date, description, amount</p>
      </div>

      {file && <div className="file-name">📄 {file.name}</div>}

      <div>
        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={loading || !file}
        >
          {loading && <span className="spinner" />}
          {loading ? 'Categorizing with AI…' : 'Upload & Categorize'}
        </button>
      </div>
    </div>
  );
}
