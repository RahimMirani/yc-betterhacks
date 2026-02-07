import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadPdf } from '../api';

export default function UploadPage() {
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');

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

  const loadFromUrl = useCallback(async () => {
    const url = pdfUrl.trim();
    if (!url) {
      setError('Enter a PDF URL.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Failed to fetch PDF');
      const blob = await res.blob();
      if (blob.type !== 'application/pdf') throw new Error('URL did not return a PDF');
      const file = new File([blob], 'paper.pdf', { type: 'application/pdf' });
      await handleFile(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load PDF from URL');
    } finally {
      setLoading(false);
    }
  }, [pdfUrl, handleFile]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="font-serif text-2xl font-medium text-primary text-center mb-2">
          Better Papers
        </h1>
        <p className="text-secondary text-center text-sm mb-8">
          Upload a PDF to start reading with adaptive explanations.
        </p>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-colors
            ${dragOver ? 'border-success bg-code' : 'border-border'}
          `}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={onFileInputChange}
            disabled={loading}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer block text-secondary hover:text-primary"
          >
            {loading ? (
              <span className="text-primary">Processing PDF…</span>
            ) : (
              <>
                <span className="block font-medium text-primary mb-1">
                  Drop your PDF here
                </span>
                <span className="text-sm">or click to choose a file</span>
              </>
            )}
          </label>
        </div>

        <div className="mt-8 w-full max-w-lg border-t border-border pt-8">
          <p className="text-secondary text-sm mb-2">Or add from URL</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadFromUrl()}
              placeholder="https://example.com/paper.pdf"
              disabled={loading}
              className="flex-1 border border-border rounded px-3 py-2 text-sm text-primary placeholder-secondary focus:outline-none focus:ring-1 focus:ring-success"
            />
            <button
              type="button"
              onClick={loadFromUrl}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              Load
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
