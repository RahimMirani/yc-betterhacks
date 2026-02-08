import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { fetchCitationDetail, CitationDetail } from '../services/api';

interface CitationPopoverProps {
  paperId: string;
  citationKey: string;
  anchorEl: HTMLElement;
  onClose: () => void;
  cache: React.MutableRefObject<Map<string, CitationDetail>>;
}

type PopoverState =
  | { status: 'loading' }
  | { status: 'loaded'; detail: CitationDetail }
  | { status: 'error'; message: string };

export default function CitationPopover({
  paperId,
  citationKey,
  anchorEl,
  onClose,
  cache,
}: CitationPopoverProps) {
  const [state, setState] = useState<PopoverState>({ status: 'loading' });
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showFullAbstract, setShowFullAbstract] = useState(false);

  const loadDetail = useCallback(async () => {
    const cached = cache.current.get(citationKey);
    if (cached) {
      setState({ status: 'loaded', detail: cached });
      return;
    }

    setState({ status: 'loading' });
    try {
      const detail = await fetchCitationDetail(paperId, citationKey);
      cache.current.set(citationKey, detail);
      setState({ status: 'loaded', detail });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load citation';
      setState({ status: 'error', message });
    }
  }, [paperId, citationKey, cache]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorEl, onClose]);

  // Position the popover
  const rect = anchorEl.getBoundingClientRect();
  const popoverWidth = 380;
  const left = Math.min(
    rect.left + rect.width / 2 - popoverWidth / 2,
    window.innerWidth - popoverWidth - 16,
  );
  const adjustedLeft = Math.max(16, left);

  // Place below anchor; if not enough space, place above
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeAbove = spaceBelow < 260;
  const top = placeAbove ? undefined : rect.bottom + 8;
  const bottom = placeAbove ? window.innerHeight - rect.top + 8 : undefined;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: adjustedLeft,
    top,
    bottom,
    width: popoverWidth,
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      style={style}
      className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
    >
      {state.status === 'loading' && <LoadingSkeleton />}

      {state.status === 'error' && (
        <div className="p-4">
          <p className="text-sm text-red-600 mb-2">{state.message}</p>
          <button
            type="button"
            onClick={loadDetail}
            className="text-sm text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === 'loaded' && (
        <div className="p-4 max-h-[400px] overflow-y-auto">
          <CitationContent
            detail={state.detail}
            showFullAbstract={showFullAbstract}
            onToggleAbstract={() => setShowFullAbstract((prev) => !prev)}
          />
        </div>
      )}
    </div>,
    document.body,
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-2/3" />
    </div>
  );
}

function CitationContent({
  detail,
  showFullAbstract,
  onToggleAbstract,
}: {
  detail: CitationDetail;
  showFullAbstract: boolean;
  onToggleAbstract: () => void;
}) {
  const abstractLimit = 200;
  const hasLongAbstract =
    detail.citedAbstract && detail.citedAbstract.length > abstractLimit;
  const displayAbstract =
    detail.citedAbstract && hasLongAbstract && !showFullAbstract
      ? `${detail.citedAbstract.slice(0, abstractLimit)}...`
      : detail.citedAbstract;

  // If enrichment failed or nothing was found, show raw reference as fallback
  if (detail.enrichmentFailed || (!detail.citedTitle && !detail.rawReference)) {
    return (
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {detail.citationKey}
        </p>
        {detail.rawReference && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {detail.rawReference}
          </p>
        )}
        {detail.enrichmentFailed && detail.failureReason && (
          <p className="text-xs text-gray-400 mt-2 italic">
            Could not enrich: {detail.failureReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Title */}
      <p className="text-sm font-semibold text-gray-900 leading-snug">
        {detail.citedTitle || detail.citationKey}
      </p>

      {/* Authors + Year */}
      {(detail.citedAuthors || detail.citedYear) && (
        <p className="text-xs text-gray-500">
          {detail.citedAuthors?.join(', ')}
          {detail.citedAuthors && detail.citedYear && ' · '}
          {detail.citedYear}
        </p>
      )}

      {/* Abstract */}
      {displayAbstract && (
        <div>
          <p className="text-xs text-gray-600 leading-relaxed">
            {displayAbstract}
          </p>
          {hasLongAbstract && (
            <button
              type="button"
              onClick={onToggleAbstract}
              className="text-xs text-blue-600 hover:underline mt-0.5"
            >
              {showFullAbstract ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* Relevance explanation */}
      {detail.relevanceExplanation && (
        <div className="bg-blue-50 rounded-md px-3 py-2">
          <p className="text-xs font-medium text-blue-800 mb-0.5">
            Why this is cited
          </p>
          <p className="text-xs text-blue-700 leading-relaxed">
            {detail.relevanceExplanation}
          </p>
        </div>
      )}

      {/* Raw reference fallback */}
      {!detail.citedTitle && detail.rawReference && (
        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
          {detail.rawReference}
        </p>
      )}
    </div>
  );
}
