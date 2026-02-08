// Numbered style: [1], [2], [1,2], [1-3], [1, 2, 3]
export const NUMBERED_CITATION_REGEX = /\[(\d+(?:[,\s-]+\d+)*)\]/g

// Author-year style: (Smith, 2020), (Smith & Jones, 2020), (Smith et al., 2020)
export const AUTHOR_YEAR_CITATION_REGEX =
  /\(([A-Z][a-z]+(?:\s(?:&|and)\s[A-Z][a-z]+)?(?:\set\sal\.)?,\s*\d{4}[a-z]?)\)/g

// DOI pattern
export const DOI_REGEX = /10\.\d{4,9}\/[-._;()\/:A-Z0-9]+/gi

// Reference section heading
export const REFERENCE_HEADING_REGEX =
  /\n\s*(References|Bibliography|Works Cited|REFERENCES|BIBLIOGRAPHY|WORKS CITED)\s*\n/

export type CitationStyle = 'numbered' | 'author-year' | 'unknown'

export function detectCitationStyle(text: string): CitationStyle {
  const sample = text.slice(0, 5000)

  const numberedMatches = [...sample.matchAll(NUMBERED_CITATION_REGEX)].length
  const authorYearMatches = [...sample.matchAll(AUTHOR_YEAR_CITATION_REGEX)].length

  if (numberedMatches > authorYearMatches && numberedMatches >= 3) return 'numbered'
  if (authorYearMatches > numberedMatches && authorYearMatches >= 3) return 'author-year'
  return 'unknown'
}
