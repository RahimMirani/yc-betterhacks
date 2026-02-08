import {
  CitationStyle,
  detectCitationStyle,
  NUMBERED_CITATION_REGEX,
  AUTHOR_YEAR_CITATION_REGEX,
  REFERENCE_HEADING_REGEX,
} from '../utils/citation-patterns'
import { extractCitationContext } from '../utils/text'
import { ParsedCitation } from '../types'

interface ExtractionResult {
  readonly title: string
  readonly citations: readonly ParsedCitation[]
  readonly style: CitationStyle
}

export function extractCitations(text: string): ExtractionResult {
  const title = extractTitle(text)
  const style = detectCitationStyle(text)
  const referenceSection = extractReferenceSection(text)
  const references = referenceSection ? parseReferences(referenceSection, style) : new Map<string, string>()
  const markers = extractMarkers(text, style)

  const citations: ParsedCitation[] = [...new Set(markers)].map((key) => ({
    citationKey: key,
    rawReference: references.get(key) ?? null,
    contextInPaper: extractCitationContext(text, key),
  }))

  return { title, citations, style }
}

function extractTitle(text: string): string {
  const lines = text.split('\n').filter((line) => line.trim().length > 0)
  // Title is typically the first non-empty line(s) before abstract
  const titleLines: string[] = []

  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().startsWith('abstract')) break
    if (trimmed.length > 5) {
      titleLines.push(trimmed)
    }
  }

  return titleLines.join(' ').trim() || 'Untitled Paper'
}

function extractReferenceSection(text: string): string | null {
  const match = text.match(REFERENCE_HEADING_REGEX)
  if (!match || match.index === undefined) return null
  return text.slice(match.index + match[0].length)
}

function parseReferences(
  refSection: string,
  style: CitationStyle,
): Map<string, string> {
  const references = new Map<string, string>()

  if (style === 'numbered' || style === 'unknown') {
    const refRegex = /\[(\d+)\]\s*(.+?)(?=\[\d+\]|$)/gs
    let match: RegExpExecArray | null
    while ((match = refRegex.exec(refSection)) !== null) {
      const key = `[${match[1]}]`
      const refText = match[2].trim().replace(/\s+/g, ' ')
      references.set(key, refText)
    }
  }

  if (style === 'author-year') {
    // Author-year refs are typically one per line/paragraph
    const lines = refSection.split(/\n\n+/)
    for (const line of lines) {
      const trimmed = line.trim().replace(/\s+/g, ' ')
      if (trimmed.length < 10) continue

      // Extract author-year key from the reference text
      const authorMatch = trimmed.match(/^([A-Z][a-z]+(?:\s(?:&|and)\s[A-Z][a-z]+)?(?:\set\sal\.)?)\s*\((\d{4}[a-z]?)\)/)
      if (authorMatch) {
        const key = `(${authorMatch[1]}, ${authorMatch[2]})`
        references.set(key, trimmed)
      }
    }
  }

  return references
}

function extractMarkers(text: string, style: CitationStyle): readonly string[] {
  const markers: string[] = []
  // Only search the body text, not the references section
  const refIndex = text.search(REFERENCE_HEADING_REGEX)
  const bodyText = refIndex !== -1 ? text.slice(0, refIndex) : text

  if (style === 'numbered' || style === 'unknown') {
    const regex = new RegExp(NUMBERED_CITATION_REGEX.source, 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(bodyText)) !== null) {
      // Handle compound citations like [1,2,3] or [1-3]
      const inner = match[1]
      if (inner.includes('-')) {
        const [start, end] = inner.split('-').map(Number)
        for (let i = start; i <= end; i++) {
          markers.push(`[${i}]`)
        }
      } else if (inner.includes(',')) {
        for (const num of inner.split(/[,\s]+/)) {
          if (num.trim()) markers.push(`[${num.trim()}]`)
        }
      } else {
        markers.push(`[${inner}]`)
      }
    }
  }

  if (style === 'author-year') {
    const regex = new RegExp(AUTHOR_YEAR_CITATION_REGEX.source, 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(bodyText)) !== null) {
      markers.push(`(${match[1]})`)
    }
  }

  return markers
}
