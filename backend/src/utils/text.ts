const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_CHUNK_OVERLAP = 50;

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP,
): readonly string[] {
  const safeChunkSize = Math.max(1, chunkSize)
  const safeOverlap = Math.max(0, Math.min(overlap, safeChunkSize - 1))

  const words = text.split(/\s+/)
  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + safeChunkSize, words.length)
    chunks.push(words.slice(start, end).join(' '))
    start += safeChunkSize - safeOverlap
  }

  return chunks
}

export function extractCitationContext(
  fullText: string,
  citationKey: string,
  sentencesAround: number = 2,
): string {
  // Search only in body text (before References section)
  const refHeading = /\n\s*(References|Bibliography|Works Cited|REFERENCES|BIBLIOGRAPHY)\s*\n/
  const refIndex = fullText.search(refHeading)
  const bodyText = refIndex !== -1 ? fullText.slice(0, refIndex) : fullText

  // For numbered citations like [2], also match inside compound brackets
  // e.g. [ 35 , 2 , 5] or [2, 19] or [5,2,35] or [1-3]
  const num = citationKey.match(/\[(\d+)\]/)?.[1]
  let keyIndex = -1

  if (num) {
    const n = Number(num)
    // Match comma-separated groups containing this number
    const commaRegex = new RegExp(`\\[\\s*(?:\\d+\\s*,\\s*)*${num}(?:\\s*,\\s*\\d+)*\\s*\\]`)
    keyIndex = bodyText.search(commaRegex)

    // Match range groups like [1-3] where num falls within the range
    if (keyIndex === -1) {
      const rangeRegex = /\[\s*(\d+)\s*-\s*(\d+)\s*\]/g
      let rangeMatch: RegExpExecArray | null
      while ((rangeMatch = rangeRegex.exec(bodyText)) !== null) {
        const start = Number(rangeMatch[1])
        const end = Number(rangeMatch[2])
        if (n >= start && n <= end) {
          keyIndex = rangeMatch.index
          break
        }
      }
    }
  }

  // Fallback: exact match
  if (keyIndex === -1) {
    const escapedKey = citationKey.replace(/[[\]().,]/g, '\\$&')
    keyIndex = bodyText.search(new RegExp(escapedKey))
  }

  if (keyIndex === -1) return ''

  const windowStart = Math.max(0, keyIndex - 500)
  const windowEnd = Math.min(bodyText.length, keyIndex + 500)
  const textBefore = bodyText.slice(windowStart, keyIndex)
  const textAfter = bodyText.slice(keyIndex, windowEnd)

  const sentencesBefore = textBefore.split(/(?<=[.!?])\s+/).slice(-sentencesAround)
  const sentencesAfter = textAfter.split(/(?<=[.!?])\s+/).slice(0, sentencesAround + 1)

  return [...sentencesBefore, ...sentencesAfter].join(' ').trim()
}

export function extractTitleFromReference(reference: string): string | null {
  // Try quoted title first: "Title Here"
  const quotedMatch = reference.match(/"([^"]{10,})"/)
  if (quotedMatch) return quotedMatch[1]

  // Common format: "Authors. Title. Journal/Venue, year."
  // Find the title between the first and second period after author block
  const segments = reference.split(/\.\s+/)
  if (segments.length >= 2) {
    // The title is typically the segment after the authors (first segment)
    const candidate = segments[1].trim()
    // Filter out segments that look like journal names (short) or years
    if (candidate.length >= 10 && !/^\d{4}/.test(candidate)) {
      // Clean trailing period
      return candidate.replace(/\.$/, '').trim()
    }
  }

  return null
}
