// pdf-parse v1 is CommonJS — use require for reliable import
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

export interface ExtractedPdf {
  text: string;
  numPages: number;
  title: string;
}

/**
 * Extracts text content from a PDF buffer.
 * Returns the full text, page count, and title (if available in metadata).
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<ExtractedPdf> {
  const data = await pdfParse(pdfBuffer);

  return {
    text: data.text.trim(),
    numPages: data.numpages,
    title: data.info?.Title || '',
  };
}
