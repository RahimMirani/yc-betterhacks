import React, { useState } from 'react';
import NotebookCell from './NotebookCell';

interface NotebookPreviewProps {
  cells: Array<{
    cell_type: 'markdown' | 'code';
    source: string;
  }>;
}

export default function NotebookPreview({ cells }: NotebookPreviewProps) {
  const [expandedView, setExpandedView] = useState(false);

  // Track code cell index (for the [1], [2], etc. indicators)
  let codeIndex = 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-gray-50">
        <span className="text-xs font-medium text-secondary">
          Notebook Preview — {cells.length} cells
        </span>
        <button
          onClick={() => setExpandedView(!expandedView)}
          className="text-xs text-secondary hover:text-primary transition-colors"
        >
          {expandedView ? 'Compact' : 'Expand'}
        </button>
      </div>

      {/* Cells */}
      <div className="flex-1 overflow-y-auto">
        {cells.map((cell, i) => {
          const cellIndex = cell.cell_type === 'code' ? ++codeIndex : 0;

          return (
            <div
              key={i}
              className={`
                border-b border-gray-100
                ${cell.cell_type === 'code' ? 'bg-gray-50' : 'bg-white'}
                ${!expandedView && cell.cell_type === 'code' ? 'max-h-64 overflow-hidden relative' : ''}
              `}
            >
              <NotebookCell
                cellType={cell.cell_type}
                source={cell.source}
                index={cellIndex}
              />

              {/* Fade-out for collapsed long code cells */}
              {!expandedView && cell.cell_type === 'code' && cell.source.split('\n').length > 15 && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
