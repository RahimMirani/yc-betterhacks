import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import type { OutlineItem } from './OutlineSidebar';

// Configure PDF.js worker via CDN (safe for CRA/webpack 5)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PaperViewerProps {
  pdfUrl: string;
  onDocumentLoad?: (numPages: number) => void;
  onOutlineExtracted?: (outline: OutlineItem[]) => void;
  onPageChange?: (pageNumber: number) => void;
  scrollToPage?: number | null;
}

export default function PaperViewer({
  pdfUrl,
  onDocumentLoad,
  onOutlineExtracted,
  onPageChange,
  scrollToPage,
}: PaperViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(680);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const currentPageRef = useRef<number>(1);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(
    async (pdf: any) => {
      const np = pdf.numPages;
      setNumPages(np);
      onDocumentLoad?.(np);

      // Try to extract the PDF's built-in outline
      let extractedOutline: OutlineItem[] = [];
      try {
        const outline = await pdf.getOutline();
        if (outline && outline.length > 0) {
          extractedOutline = await flattenPdfOutline(outline, pdf);
        }
      } catch {
        // Outline not available in this PDF
      }

      // Always notify parent (empty array means no outline found)
      onOutlineExtracted?.(extractedOutline);
    },
    [onDocumentLoad, onOutlineExtracted]
  );

  // Scroll to a specific page when requested
  useEffect(() => {
    if (scrollToPage && pageRefs.current.has(scrollToPage)) {
      const element = pageRefs.current.get(scrollToPage);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [scrollToPage]);

  // Track the currently visible page with IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            const pageNum = parseInt(entry.target.getAttribute('data-page') || '1');
            if (pageNum !== currentPageRef.current) {
              currentPageRef.current = pageNum;
              onPageChange?.(pageNum);
            }
          }
        }
      },
      { root: containerRef.current, threshold: [0.3, 0.5] }
    );

    // Slight delay to ensure page refs are populated after render
    const timeout = setTimeout(() => {
      pageRefs.current.forEach((el) => observer.observe(el));
    }, 600);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [numPages, onPageChange]);

  // Responsive page width based on container
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setPageWidth(Math.min(width - 80, 780));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Ref callback for each page
  const setPageRef = useCallback(
    (pageNum: number) => (el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
      }
    },
    []
  );

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#f7f7f8]">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className="w-5 h-5 border-[1.5px] border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[13px] text-gray-400">Loading document...</p>
            </div>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <p className="text-sm text-red-500 mb-1">Failed to load PDF</p>
              <p className="text-[13px] text-gray-400">The document could not be rendered</p>
            </div>
          </div>
        }
      >
        <div className="py-6 flex flex-col items-center gap-5">
          {Array.from({ length: numPages }, (_, index) => {
            const pageNum = index + 1;
            return (
              <div
                key={pageNum}
                ref={setPageRef(pageNum)}
                data-page={pageNum}
                className="relative bg-white rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <Page
                  pageNumber={pageNum}
                  width={pageWidth}
                  renderAnnotationLayer={true}
                  renderTextLayer={true}
                />
                <div className="absolute bottom-3 right-4">
                  <span className="text-[11px] text-gray-400 tabular-nums">
                    Page {pageNum}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Document>
    </div>
  );
}

/**
 * Flatten the nested PDF.js outline tree into a flat array with level indicators.
 * Each item has { title, pageNumber, level }.
 */
async function flattenPdfOutline(outline: any[], pdf: any): Promise<OutlineItem[]> {
  const items: OutlineItem[] = [];

  async function traverse(nodes: any[], level: number) {
    for (const node of nodes) {
      let pageNumber = 1;

      try {
        if (node.dest) {
          let dest = node.dest;
          if (typeof dest === 'string') {
            dest = await pdf.getDestination(dest);
          }
          if (dest && dest[0]) {
            const pageIndex = await pdf.getPageIndex(dest[0]);
            pageNumber = pageIndex + 1;
          }
        }
      } catch {
        // Default to page 1 if we can't resolve the destination
      }

      items.push({
        title: node.title || 'Untitled',
        pageNumber,
        level,
      });

      if (node.items && node.items.length > 0) {
        await traverse(node.items, level + 1);
      }
    }
  }

  await traverse(outline, 0);
  return items;
}
