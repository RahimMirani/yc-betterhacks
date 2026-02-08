import React, { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { uploadPdf } from '../api';

export default function ReaderUploadPage() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || file.type !== 'application/pdf') {
        setError('Please choose a PDF file.');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const { paperId } = await uploadPdf(file);
        navigate(`/reader/${paperId}`, { replace: true });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div className="min-h-screen bg-[#f7f7f8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="font-serif text-2xl font-medium text-gray-800 text-center mb-2">
          Reader with Explain
        </h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Upload a PDF to read and select any text to get an explanation.
        </p>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${dragOver ? 'border-gray-400 bg-gray-100' : 'border-gray-200'}
          `}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileInputChange}
            disabled={loading}
            className="hidden"
            id="reader-file-input"
          />
          <label
            htmlFor="reader-file-input"
            className="cursor-pointer block text-gray-500 hover:text-gray-800"
          >
            {loading ? (
              <span className="text-gray-800">Processing PDF…</span>
            ) : (
              <>
                <span className="block font-medium text-gray-800 mb-1">Drop your PDF here</span>
                <span className="text-sm">or click to choose a file</span>
              </>
            )}
          </label>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          <Link to="/" className="text-gray-500 hover:underline">
            ← Back to Extract & Implement
          </Link>
        </p>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
