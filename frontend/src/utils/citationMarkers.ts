/**
 * Splits text around citation markers so they can be rendered as clickable elements.
 */

export interface TextSegment {
  type: 'text' | 'citation';
  content: string;
  citationKey?: string;
}

/**
 * Splits text into segments of plain text and citation markers.
 * Citation keys are matched against the known set from the backend.
 * Longer keys are matched first to prevent partial matches.
 */
export function splitTextWithCitations(
  text: string,
  citationKeys: ReadonlySet<string>,
): TextSegment[] {
  if (citationKeys.size === 0) {
    return [{ type: 'text', content: text }];
  }

  // Sort keys by length descending so longer keys match first
  const sortedKeys = Array.from(citationKeys).sort((a, b) => b.length - a.length);

  // Build regex: escape special characters in each key
  const escapedKeys = sortedKeys.map((key) =>
    key.replace(/[[\](){}.*+?^$|\\]/g, '\\$&'),
  );
  const pattern = new RegExp(`(${escapedKeys.join('|')})`, 'g');

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add preceding text
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add citation marker
    segments.push({
      type: 'citation',
      content: match[0],
      citationKey: match[0],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add trailing text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}
