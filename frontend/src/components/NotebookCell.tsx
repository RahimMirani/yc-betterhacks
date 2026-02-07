import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

/**
 * A minimal, clean syntax highlighting theme matching the design system.
 * Light background, subtle colors, no visual noise.
 */
const codeTheme: Record<string, React.CSSProperties> = {
  'pre[class*="language-"]': {
    background: '#f9fafb',
    color: '#1a1a1a',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: 0,
    padding: '16px',
    overflow: 'auto',
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  },
  'code[class*="language-"]': {
    background: 'none',
    color: '#1a1a1a',
    fontSize: '13px',
    lineHeight: '1.6',
    fontFamily: "'JetBrains Mono', 'SF Mono', Consolas, monospace",
  },
  comment: { color: '#6b7280', fontStyle: 'italic' },
  prolog: { color: '#6b7280' },
  doctype: { color: '#6b7280' },
  cdata: { color: '#6b7280' },
  punctuation: { color: '#6b7280' },
  property: { color: '#9333ea' },
  tag: { color: '#9333ea' },
  boolean: { color: '#2563eb' },
  number: { color: '#2563eb' },
  constant: { color: '#2563eb' },
  symbol: { color: '#2563eb' },
  selector: { color: '#16a34a' },
  'attr-name': { color: '#16a34a' },
  string: { color: '#16a34a' },
  char: { color: '#16a34a' },
  builtin: { color: '#16a34a' },
  inserted: { color: '#16a34a' },
  operator: { color: '#1a1a1a' },
  entity: { color: '#1a1a1a' },
  url: { color: '#1a1a1a' },
  atrule: { color: '#2563eb' },
  'attr-value': { color: '#2563eb' },
  keyword: { color: '#9333ea' },
  function: { color: '#2563eb' },
  'class-name': { color: '#ca8a04' },
  regex: { color: '#ea580c' },
  important: { color: '#ea580c', fontWeight: 'bold' },
  variable: { color: '#1a1a1a' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
};

interface NotebookCellProps {
  cellType: 'markdown' | 'code';
  source: string;
  index: number;
}

export default function NotebookCell({ cellType, source, index }: NotebookCellProps) {
  if (cellType === 'markdown') {
    return (
      <div className="px-4 py-3 notebook-markdown">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-semibold text-primary mt-1 mb-2 font-serif">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold text-primary mt-1 mb-1.5">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-primary mt-1 mb-1">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-primary leading-relaxed mb-2">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-sm text-primary list-disc list-inside mb-2 space-y-0.5">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="text-sm text-primary list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-sm text-primary leading-relaxed">{children}</li>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="text-xs bg-gray-100 text-primary px-1 py-0.5 rounded font-mono">
                    {children}
                  </code>
                );
              }
              return (
                <code className="text-xs font-mono">{children}</code>
              );
            },
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-gray-300 pl-3 my-2 text-secondary text-sm italic">
                {children}
              </blockquote>
            ),
          }}
        >
          {source}
        </ReactMarkdown>
      </div>
    );
  }

  // Code cell
  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => navigator.clipboard.writeText(source)}
          className="text-xs text-secondary hover:text-primary bg-white border border-border rounded px-2 py-0.5"
          title="Copy code"
        >
          Copy
        </button>
      </div>
      <div className="flex">
        {/* Cell number indicator */}
        <div className="w-8 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex items-start justify-center pt-3">
          <span className="text-[10px] text-gray-400 font-mono">[{index}]</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <SyntaxHighlighter
            language="python"
            style={codeTheme}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              border: 'none',
            }}
            showLineNumbers={false}
          >
            {source}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
