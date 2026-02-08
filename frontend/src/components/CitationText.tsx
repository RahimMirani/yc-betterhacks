import React from 'react';
import { splitTextWithCitations } from '../utils/citationMarkers';

interface CitationTextProps {
  text: string;
  citationKeys: ReadonlySet<string>;
  onCitationClick: (citationKey: string, anchorEl: HTMLElement) => void;
}

/**
 * Renders text with citation markers as clickable blue buttons.
 * Non-citation text is rendered as-is.
 */
export default function CitationText({
  text,
  citationKeys,
  onCitationClick,
}: CitationTextProps) {
  const segments = splitTextWithCitations(text, citationKeys);

  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === 'citation') {
          return (
            <button
              key={i}
              type="button"
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold bg-transparent border-none p-0 m-0 inline text-[15px] leading-[1.85]"
              onClick={(e) =>
                onCitationClick(segment.citationKey!, e.currentTarget)
              }
            >
              {segment.content}
            </button>
          );
        }
        return <React.Fragment key={i}>{segment.content}</React.Fragment>;
      })}
    </>
  );
}
