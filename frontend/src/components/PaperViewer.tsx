import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import { parsePaperContent, ContentBlock } from '../utils/parsePaper';
import type { OutlineItem } from './OutlineSidebar';

interface PaperViewerProps {
  paperText: string;
  paperTitle: string;
  onOutlineExtracted?: (outline: OutlineItem[]) => void;
  onSectionChange?: (sectionId: string) => void;
  scrollToSectionId?: string | null;
}

export default function PaperViewer({
  paperText,
  paperTitle,
  onOutlineExtracted,
  onSectionChange,
  scrollToSectionId,
}: PaperViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasReportedOutline = useRef(false);

  // Parse paper text into structured blocks + outline
  const { blocks, outline } = useMemo(() => {
    return parsePaperContent(paperText);
  }, [paperText]);

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
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-[#f7f7f8]">
      <article className="max-w-[720px] mx-auto py-12 px-8">
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}

        {/* Bottom spacer */}
        <div className="h-32" />
      </article>
    </div>
  );
}

// ── Block Renderer ──

function BlockRenderer({ block }: { block: ContentBlock }) {
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
          {block.content}
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
          {block.content}
        </p>
      );

    default:
      return null;
  }
}
