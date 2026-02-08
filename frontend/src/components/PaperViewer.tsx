import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { parsePaperContent, ContentBlock } from '../utils/parsePaper';
import type { OutlineItem } from './OutlineSidebar';
import { explain } from '../api';
import type { CitationSummary, CitationDetail } from '../services/api';
import CitationText from './CitationText';
import CitationPopover from './CitationPopover';

interface PaperViewerProps {
  paperText: string;
  paperTitle: string;
  pdfUrl?: string;
  numPages?: number;
  paperId?: string | null;
  citations?: CitationSummary[];
  onOutlineExtracted?: (outline: OutlineItem[]) => void;
  onSectionChange?: (sectionId: string) => void;
  scrollToSectionId?: string | null;
}

interface PopoverTarget {
  citationKey: string;
  anchorEl: HTMLElement;
}

export default function PaperViewer({
  paperText,
  paperTitle,
  pdfUrl,
  numPages,
  paperId,
  citations = [],
  onOutlineExtracted,
  onSectionChange,
  scrollToSectionId,
}: PaperViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedOutline = useRef(false);
  const [viewMode, setViewMode] = useState<'clean' | 'pdf'>('clean');
  const [pdfNumPages, setPdfNumPages] = useState<number | null>(numPages ?? null);
  const [popover, setPopover] = useState<PopoverTarget | null>(null);
  const citationCacheRef = useRef<Map<string, CitationDetail>>(new Map());

  // Derive citation keys set from citations prop
  const citationKeys = useMemo(
    () => new Set(citations.map((c) => c.citationKey)),
    [citations],
  );

  const handleCitationClick = useCallback(
    (citationKey: string, anchorEl: HTMLElement) => {
      setPopover((prev) =>
        prev?.citationKey === citationKey ? null : { citationKey, anchorEl },
      );
    },
    [],
  );

  const handlePopoverClose = useCallback(() => {
    setPopover(null);
  }, []);

  // Explain: selection + panel (only when paperId is set)
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [showExplainPanel, setShowExplainPanel] = useState(false);
  const [explainMessages, setExplainMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [explainLoading, setExplainLoading] = useState(false);
  const [chatSelectedText, setChatSelectedText] = useState('');
  const [explainInput, setExplainInput] = useState('');

  const handleMouseUp = useCallback(() => {
    if (!paperId) return;
    setTimeout(() => {
      const sel = document.getSelection();
      if (!sel) return;
      const text = sel.toString().trim();
      if (!text) {
        setSelection(null);
        return;
      }
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        setSelection({ text, rect });
      } catch {
        setSelection(null);
      }
    }, 0);
  }, [paperId]);

  useEffect(() => {
    if (!paperId) return;
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [paperId, handleMouseUp]);

  const handleExplain = useCallback(() => {
    if (!selection?.text || !paperId) return;
    const selectedText = selection.text;
    setChatSelectedText(selectedText);
    setShowExplainPanel(true);
    setExplainMessages((prev) => [
      ...prev,
      { role: 'user', content: `Explain: "${selectedText.slice(0, 200)}${selectedText.length > 200 ? '…' : ''}"` },
    ]);
    setExplainLoading(true);
    explain(paperId, selectedText, [])
      .then(({ reply }) => setExplainMessages((prev) => [...prev, { role: 'assistant', content: reply }]))
      .catch((e) =>
        setExplainMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed to get explanation'}` },
        ])
      )
      .finally(() => setExplainLoading(false));
    setSelection(null);
  }, [selection, paperId]);

  const sendFollowUp = useCallback(() => {
    const msg = explainInput.trim();
    if (!msg || !paperId || !chatSelectedText) return;
    setExplainMessages((prev) => [...prev, { role: 'user', content: msg }]);
    setExplainInput('');
    setExplainLoading(true);
    const fullHistory = [...explainMessages, { role: 'user' as const, content: msg }];
    explain(paperId, chatSelectedText, fullHistory)
      .then(({ reply }) => setExplainMessages((prev) => [...prev, { role: 'assistant', content: reply }]))
      .catch((e) =>
        setExplainMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed'}` },
        ])
      )
      .finally(() => setExplainLoading(false));
  }, [explainInput, paperId, chatSelectedText, explainMessages]);

  // Parse paper text into structured blocks + outline
  const { blocks, outline } = useMemo(() => {
    return parsePaperContent(paperText);
  }, [paperText]);

  useEffect(() => {
    if (typeof numPages === 'number' && numPages > 0) {
      setPdfNumPages(numPages);
    }
  }, [numPages]);

  // Report extracted outline to parent (once)
  useEffect(() => {
    if (!hasReportedOutline.current && outline.length > 0) {
      hasReportedOutline.current = true;
      onOutlineExtracted?.(outline);
    }
  }, [outline, onOutlineExtracted]);

  // Scroll to section when requested
  useEffect(() => {
    if (!scrollToSectionId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-section-id="${scrollToSectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToSectionId]);

  // Track current visible section with IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || outline.length === 0) return;

    const headings = containerRef.current.querySelectorAll('[data-section-id]');
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) onSectionChange?.(id);
          }
        }
      },
      {
        root: containerRef.current,
        // Trigger when heading is in the top 30% of the viewport
        rootMargin: '0px 0px -70% 0px',
        threshold: 0,
      }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [blocks, outline, onSectionChange]);

  return (
    <div ref={containerRef} className="flex-1 flex min-h-0 bg-[#f7f7f8]">
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-[920px] mx-auto py-8 px-8">
          <div className="flex items-center justify-between mb-6">
          <div className="text-[13px] text-secondary">
            Viewing: <span className="text-primary font-medium">{paperTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('clean')}
              className={`text-[12px] px-3 py-1 rounded-md border ${
                viewMode === 'clean'
                  ? 'border-primary text-primary'
                  : 'border-border text-secondary hover:text-primary'
              }`}
            >
              Clean Text
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pdf')}
              className={`text-[12px] px-3 py-1 rounded-md border ${
                viewMode === 'pdf'
                  ? 'border-primary text-primary'
                  : 'border-border text-secondary hover:text-primary'
              }`}
              disabled={!pdfUrl}
              title={!pdfUrl ? 'PDF view unavailable' : 'View PDF with figures and equations'}
            >
              PDF View
            </button>
          </div>
        </div>

        {viewMode === 'pdf' && pdfUrl ? (
          <PdfCanvasView
            pdfUrl={pdfUrl}
            numPages={pdfNumPages}
            onLoadPages={setPdfNumPages}
            enableTextLayer={!!paperId}
          />
        ) : (
          <article className="max-w-[720px] mx-auto py-4">
            {blocks.map((block) => (
              <BlockRenderer
                key={block.id}
                block={block}
                citationKeys={citationKeys}
                onCitationClick={handleCitationClick}
              />
            ))}

            {/* Bottom spacer */}
            <div className="h-32" />
          </article>
        )}

        {/* Explain: floating button when text is selected */}
        {paperId && selection && !showExplainPanel && (
          <div
            className="fixed z-[100] flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg shadow-xl select-none"
            style={{
              left: Math.max(8, Math.min(typeof window !== 'undefined' ? window.innerWidth - 120 : 400, selection.rect.left + selection.rect.width / 2 - 60)),
              top: Math.max(8, selection.rect.top - 44),
            }}
          >
            <button type="button" onClick={handleExplain} className="text-sm font-medium hover:opacity-90">
              Explain
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Explain panel (right sidebar) */}
      {paperId && showExplainPanel && (
        <div className="w-[360px] border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
          <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800">Explain</span>
            <button
              type="button"
              onClick={() => { setShowExplainPanel(false); setExplainMessages([]); setChatSelectedText(''); }}
              className="text-gray-500 hover:text-gray-800 text-sm"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
            {explainMessages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-gray-800' : 'text-gray-600'}`}>
                <span className="font-medium">{m.role === 'user' ? 'You' : 'Assistant'}: </span>
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            ))}
            {explainLoading && <div className="text-gray-500 text-sm">Thinking…</div>}
          </div>
          <div className="p-3 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={explainInput}
              onChange={(e) => setExplainInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendFollowUp()}
              placeholder="Ask a follow-up…"
              className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={sendFollowUp}
              disabled={explainLoading}
              className="px-3 py-2 bg-gray-900 text-white rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>

    {popover && paperId && (
      <CitationPopover
        paperId={paperId}
        citationKey={popover.citationKey}
        anchorEl={popover.anchorEl}
        onClose={handlePopoverClose}
        cache={citationCacheRef}
      />
    )}
    </>
  );
}

// ── Block Renderer ──

function BlockRenderer({
  block,
  citationKeys,
  onCitationClick,
}: {
  block: ContentBlock;
  citationKeys: ReadonlySet<string>;
  onCitationClick: (key: string, anchorEl: HTMLElement) => void;
}) {
  const hasCitations = citationKeys.size > 0;

  switch (block.type) {
    case 'title':
      return (
        <h1 className="font-display text-[32px] leading-[1.2] text-primary text-center mb-3 mt-4">
          {block.content}
        </h1>
      );

    case 'authors':
      return (
        <div className="text-center mb-10">
          {block.content.split('\n').map((line, i) => (
            <p key={i} className="text-[14px] text-secondary leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      );

    case 'abstract-heading':
      return (
        <h2
          data-section-id={block.id}
          className="text-[18px] font-semibold text-primary mt-8 mb-3"
        >
          Abstract
        </h2>
      );

    case 'abstract-paragraph':
      return (
        <p className="text-[15px] text-primary leading-[1.85] mb-4 pl-4 border-l-2 border-gray-200">
          {hasCitations ? (
            <CitationText
              text={block.content}
              citationKeys={citationKeys}
              onCitationClick={onCitationClick}
            />
          ) : (
            block.content
          )}
        </p>
      );

    case 'section-heading':
      return (
        <h2
          data-section-id={block.id}
          className="text-[20px] font-semibold text-primary mt-12 mb-4 pt-6 border-t border-gray-100"
        >
          {block.content}
        </h2>
      );

    case 'subsection-heading':
      return (
        <h3
          data-section-id={block.id}
          className="text-[16px] font-semibold text-primary mt-8 mb-3"
        >
          {block.content}
        </h3>
      );

    case 'paragraph':
      return (
        <p className="text-[15px] text-primary leading-[1.85] mb-4">
          {hasCitations ? (
            <CitationText
              text={block.content}
              citationKeys={citationKeys}
              onCitationClick={onCitationClick}
            />
          ) : (
            block.content
          )}
        </p>
      );

    default:
      return null;
  }
}

// ── PDF Canvas View (preserves figures/equations) ──

// Use a locally served worker to avoid bundler/CDN issues in CRA.
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

function PdfCanvasView({
  pdfUrl,
  numPages,
  onLoadPages,
  enableTextLayer = false,
}: {
  pdfUrl: string;
  numPages: number | null;
  onLoadPages: (count: number) => void;
  enableTextLayer?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages: loadedPages }) => onLoadPages(loadedPages)}
        loading={<div className="text-sm text-secondary">Loading PDF…</div>}
        error={<div className="text-sm text-red-600">Failed to load PDF.</div>}
      >
        {Array.from(new Array(numPages || 0), (_el, index) => (
          <div key={`page_${index + 1}`} className="mb-6 last:mb-0">
            <Page
              pageNumber={index + 1}
              renderTextLayer={enableTextLayer}
              renderAnnotationLayer={false}
              loading={<div className="text-sm text-secondary">Rendering page…</div>}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
