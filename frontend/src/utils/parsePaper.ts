/**
 * Parses extracted paper text into structured content blocks and an outline.
 * This enables rendering the paper as native HTML with full text selection,
 * which is critical for features like highlight-to-explain and highlight-to-implement.
 */

export interface ContentBlock {
  id: string;
  type:
    | 'title'
    | 'authors'
    | 'abstract-heading'
    | 'section-heading'
    | 'subsection-heading'
    | 'paragraph'
    | 'abstract-paragraph';
  content: string;
}

export interface OutlineItem {
  title: string;
  id: string;
  level: number;
}

export interface ParseResult {
  blocks: ContentBlock[];
  outline: OutlineItem[];
}

// ── Heading detection ──

function isSectionHeading(line: string): boolean {
  return /^\d+\.?\s+[A-Z]/.test(line) && line.length > 4 && line.length < 100;
}

function isSubsectionHeading(line: string): boolean {
  return /^\d+\.\d+\.?\s+[A-Z]/.test(line) && line.length > 4 && line.length < 100;
}

// ── Text preprocessing ──

function preprocess(text: string): string {
  return (
    text
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Fix hyphenated line breaks (e.g. "atten-\ntion" → "attention")
      .replace(/(\w)-\n(\w)/g, '$1$2')
      // Remove isolated page numbers
      .replace(/^\s*\d{1,3}\s*$/gm, '')
      // Collapse 3+ blank lines into 2
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

// ── Main parser ──

export function parsePaperContent(rawText: string): ParseResult {
  const text = preprocess(rawText);
  const lines = text.split('\n');

  const blocks: ContentBlock[] = [];
  const outline: OutlineItem[] = [];
  let idCounter = 0;
  const nextId = () => `s-${idCounter++}`;

  // ── Phase 1: Find Abstract position ──
  let abstractLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*Abstract\s*$/i.test(lines[i])) {
      abstractLineIdx = i;
      break;
    }
  }

  // ── Phase 2: Extract title + authors (everything before Abstract) ──
  if (abstractLineIdx > 0) {
    const preAbstract = lines.slice(0, abstractLineIdx);

    // Title: first non-empty lines (up to 3 lines before we hit author-like text)
    const nonEmpty = preAbstract.filter((l) => l.trim());
    let titleEnd = Math.min(nonEmpty.length, 3);
    for (let i = 1; i < nonEmpty.length && i < 4; i++) {
      const line = nonEmpty[i];
      if (
        line.includes('@') ||
        line.includes('University') ||
        line.includes('Institute') ||
        line.includes('Department') ||
        line.includes('Laboratory') ||
        (line.split(',').length >= 3 && line.length < 200)
      ) {
        titleEnd = i;
        break;
      }
    }

    const titleText = nonEmpty.slice(0, titleEnd).join(' ').trim();
    const authorText = nonEmpty.slice(titleEnd).join('\n').trim();

    if (titleText) {
      blocks.push({ id: nextId(), type: 'title', content: titleText });
    }
    if (authorText) {
      blocks.push({ id: nextId(), type: 'authors', content: authorText });
    }
  } else if (lines.length > 0) {
    // No abstract found — first non-empty line is title
    const firstLine = lines.find((l) => l.trim());
    if (firstLine) {
      blocks.push({ id: nextId(), type: 'title', content: firstLine.trim() });
    }
  }

  // ── Phase 3: Process content from Abstract onward ──
  const startLine = abstractLineIdx >= 0 ? abstractLineIdx : 0;
  let currentParagraphLines: string[] = [];
  let inAbstract = false;

  const flushParagraph = () => {
    const joined = currentParagraphLines.join(' ').trim();
    if (joined) {
      blocks.push({
        id: nextId(),
        type: inAbstract ? 'abstract-paragraph' : 'paragraph',
        content: joined,
      });
    }
    currentParagraphLines = [];
  };

  for (let i = startLine; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Empty line → paragraph break
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Abstract heading
    if (/^\s*Abstract\s*$/i.test(trimmed)) {
      flushParagraph();
      inAbstract = true;
      const id = nextId();
      blocks.push({ id, type: 'abstract-heading', content: 'Abstract' });
      outline.push({ title: 'Abstract', id, level: 0 });
      continue;
    }

    // References / Acknowledgments
    if (/^References$/i.test(trimmed)) {
      flushParagraph();
      inAbstract = false;
      const id = nextId();
      blocks.push({ id, type: 'section-heading', content: 'References' });
      outline.push({ title: 'References', id, level: 0 });
      continue;
    }

    if (/^Acknowledgments?$/i.test(trimmed) && trimmed.length < 30) {
      flushParagraph();
      inAbstract = false;
      const id = nextId();
      blocks.push({ id, type: 'section-heading', content: trimmed });
      outline.push({ title: trimmed, id, level: 0 });
      continue;
    }

    // Sub-section heading (check BEFORE section heading, since "3.1 Foo" also matches /^\d+\./)
    if (isSubsectionHeading(trimmed)) {
      flushParagraph();
      inAbstract = false;
      const id = nextId();
      blocks.push({ id, type: 'subsection-heading', content: trimmed });
      outline.push({ title: trimmed, id, level: 1 });
      continue;
    }

    // Section heading
    if (isSectionHeading(trimmed)) {
      flushParagraph();
      inAbstract = false;
      const id = nextId();
      blocks.push({ id, type: 'section-heading', content: trimmed });
      outline.push({ title: trimmed, id, level: 0 });
      continue;
    }

    // Regular text → accumulate into paragraph
    currentParagraphLines.push(trimmed);
  }

  // Flush last paragraph
  flushParagraph();

  return { blocks, outline };
}
