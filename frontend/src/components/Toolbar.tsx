import React from 'react';

interface ToolbarProps {
  paperTitle: string;
  currentSection: string;
  isImplementing: boolean;
  hasResult: boolean;
  onImplementPaper: () => void;
  onReset: () => void;
}

export default function Toolbar({
  paperTitle,
  currentSection,
  isImplementing,
  hasResult,
  onImplementPaper,
  onReset,
}: ToolbarProps) {
  return (
    <div className="h-[52px] border-b border-border bg-white flex items-center justify-between px-5 flex-shrink-0">
      {/* Left: Brand */}
      <button
        onClick={onReset}
        className="flex items-center gap-2 text-primary hover:opacity-70 transition-opacity flex-shrink-0"
        title="Back to upload"
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <span className="text-[15px] font-semibold tracking-tight">Better Papers</span>
      </button>

      {/* Center: Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px] min-w-0 mx-6 overflow-hidden">
        <span className="text-secondary truncate max-w-[300px]">
          {paperTitle || 'Research Paper'}
        </span>
        {currentSection && (
          <>
            <svg
              className="w-3 h-3 text-gray-300 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-primary font-medium truncate">{currentSection}</span>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onImplementPaper}
          disabled={isImplementing}
          className={`
            h-[34px] px-4 rounded-lg text-[13px] font-medium transition-all
            ${
              isImplementing
                ? 'bg-gray-100 text-secondary cursor-not-allowed'
                : hasResult
                ? 'bg-gray-100 text-primary hover:bg-gray-200'
                : 'bg-primary text-white hover:bg-[#333]'
            }
          `}
        >
          {isImplementing ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-[1.5px] border-secondary border-t-transparent rounded-full animate-spin" />
              Implementing...
            </span>
          ) : hasResult ? (
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-success"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              View Implementation
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
              Implement Paper
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
