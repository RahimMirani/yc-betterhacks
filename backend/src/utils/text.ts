const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): readonly string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    chunks.push(words.slice(start, end).join(' '));
    start += chunkSize - overlap;
  }

  return chunks;
}

export function extractCitationContext(
  fullText: string,
  citationKey: string,
  sentencesAround: number = 2
): string {
  const refHeading = /\n\s*(References|Bibliography|Works Cited|REFERENCES|BIBLIOGRAPHY)\s*\n/;
  const refIndex = fullText.search(refHeading);
  const bodyText = refIndex !== -1 ? fullText.slice(0, refIndex) : fullText;

  const num = citationKey.match(/\[(\d+)\]/)?.[1];
  let keyIndex = -1;

  if (num) {
    const compoundRegex = new RegExp(`\\[\\s*(?:\\d+\\s*,\\s*)*${num}(?:\\s*,\\s*\\d+)*\\s*\\]`);
    keyIndex = bodyText.search(compoundRegex);
  }

  if (keyIndex === -1) {
    const escapedKey = citationKey.replace(/[[\]().,]/g, '\\$&');
    keyIndex = bodyText.search(new RegExp(escapedKey));
  }

  if (keyIndex === -1) return '';

  const windowStart = Math.max(0, keyIndex - 500);
  const windowEnd = Math.min(bodyText.length, keyIndex + 500);
  const textBefore = bodyText.slice(windowStart, keyIndex);
  const textAfter = bodyText.slice(keyIndex, windowEnd);

  const sentencesBefore = textBefore.split(/(?<=[.!?])\s+/).slice(-sentencesAround);
  const sentencesAfter = textAfter.split(/(?<=[.!?])\s+/).slice(0, sentencesAround + 1);

  return [...sentencesBefore, ...sentencesAfter].join(' ').trim();
}

export function extractTitleFromReference(reference: string): string | null {
  const quotedMatch = reference.match(/"([^"]{10,})"/);
  if (quotedMatch) return quotedMatch[1];

  const segments = reference.split(/\.\s+/);
  if (segments.length >= 2) {
    const candidate = segments[1].trim();
    if (candidate.length >= 10 && !/^\d{4}/.test(candidate)) {
      return candidate.replace(/\.$/, '').trim();
    }
  }

  return null;
}
