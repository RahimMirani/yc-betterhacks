import pdfParse from 'pdf-parse';

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
