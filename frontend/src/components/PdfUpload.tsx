import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface PdfUploadProps {
  onFileSelected: (file: File) => void;
  onUrlSubmitted: (url: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
}

export default function PdfUpload({ onFileSelected, onUrlSubmitted, isLoading, loadingMessage }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onUrlSubmitted(trimmed);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUrlSubmit();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[540px] pt-[12vh]">

          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="font-display text-[42px] leading-[1.1] text-primary mb-3">
              Better Papers
            </h1>
            <p className="text-[15px] text-gray-400 leading-relaxed">
              Upload a research paper to start reading with adaptive explanations.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={`
              group relative rounded-2xl cursor-pointer
              border transition-all duration-200 ease-out
              ${isDragging
                ? 'border-gray-300 bg-gray-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
              }
              ${isLoading ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
            <div className="px-8 py-14">
              {isLoading ? (
                <div className="text-center">
                  <div className="w-5 h-5 border-[1.5px] border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-[13px]">{loadingMessage || 'Processing...'}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center mx-auto mb-5 group-hover:bg-gray-100 transition-colors">
                    <svg className="w-[18px] h-[18px] text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium text-primary mb-1">
                    Drop your PDF here
                  </p>
                  <p className="text-[13px] text-gray-400">
                    or click to choose a file
                  </p>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />

          <p className="mt-4 text-center text-[12px] text-gray-400">
            <Link to="/reader" className="text-gray-500 hover:text-primary hover:underline">
              Open in Reader
            </Link>
            {' — select text to get explanations'}
          </p>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[11px] text-gray-300 uppercase tracking-[0.15em] font-medium select-none">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* URL input */}
          <div>
            <label className="block text-[13px] font-medium text-gray-500 mb-2">
              Load from URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleUrlKeyDown}
                placeholder="https://arxiv.org/pdf/1706.03762"
                disabled={isLoading}
                className="flex-1 h-[42px] px-3.5 text-[13px] text-primary bg-white border border-gray-200 rounded-lg placeholder:text-gray-300 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-50 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleUrlSubmit}
                disabled={isLoading || !url.trim()}
                className="h-[42px] px-5 bg-primary text-white text-[13px] font-medium rounded-lg hover:bg-[#333] active:scale-[0.98] transition-all disabled:opacity-25 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
              >
                Load
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[11px] text-gray-300">
              Supports arXiv, Semantic Scholar, and direct PDF links
            </p>
          </div>

          {/* Feature cards */}
          <div className="mt-20 grid grid-cols-3 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            <FeatureCard
              title="Explain"
              description="Select any text for instant contextual clarity"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              }
            />
            <FeatureCard
              title="Implement"
              description="Generate working code from paper methods"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              }
            />
            <FeatureCard
              title="Citations"
              description="Click references to see context instantly"
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.928-2.868a4.5 4.5 0 00-6.364-6.364L4.5 8.257m7.879 2.871L8.257 15.25" />
                </svg>
              }
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 text-center flex-shrink-0">
        <p className="text-[11px] text-gray-300">
          Built for researchers who want to understand, not just read.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white px-5 py-5">
      <div className="text-gray-400 mb-2.5">
        {icon}
      </div>
      <h3 className="text-[12px] font-semibold text-primary mb-0.5 tracking-tight">{title}</h3>
      <p className="text-[11px] text-gray-400 leading-[1.6]">{description}</p>
    </div>
  );
}
