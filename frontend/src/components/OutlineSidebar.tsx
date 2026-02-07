import React, { useState } from 'react';

export interface OutlineItem {
  title: string;
  pageNumber: number;
  level: number;
}

interface OutlineSidebarProps {
  outline: OutlineItem[];
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
}

export default function OutlineSidebar({ outline, currentPage, onNavigateToPage }: OutlineSidebarProps) {
  const [activeTab, setActiveTab] = useState<'outline' | 'notes'>('outline');

  // Determine active outline item based on current page
  const activeIndex = (() => {
    let idx = -1;
    for (let i = 0; i < outline.length; i++) {
      if (outline[i].pageNumber <= currentPage) {
        idx = i;
      }
    }
    return idx;
  })();

  return (
    <div className="w-[240px] border-r border-border bg-white flex flex-col flex-shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('outline')}
          className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors ${
            activeTab === 'outline'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          Outline
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium transition-colors ${
            activeTab === 'notes'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-secondary hover:text-primary'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Notes
        </button>
      </div>

      {/* Content */}
      {activeTab === 'outline' ? (
        <div className="flex-1 overflow-y-auto py-1">
          {outline.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-7 h-7 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              <p className="text-[13px] text-gray-400">No outline available</p>
            </div>
          ) : (
            outline.map((item, i) => (
              <button
                key={i}
                onClick={() => onNavigateToPage(item.pageNumber)}
                className={`w-full flex items-center justify-between py-[7px] pr-4 text-left hover:bg-gray-50 transition-colors group ${
                  i === activeIndex ? 'bg-gray-50' : ''
                }`}
                style={{ paddingLeft: `${16 + item.level * 16}px` }}
              >
                <span
                  className={`text-[13px] truncate pr-2 ${
                    i === activeIndex
                      ? 'font-semibold text-primary'
                      : 'text-secondary group-hover:text-primary'
                  }`}
                >
                  {item.title}
                </span>
                <span className="text-[12px] text-gray-400 flex-shrink-0 tabular-nums">
                  {item.pageNumber}
                </span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-[13px] text-gray-400">Notes coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}
