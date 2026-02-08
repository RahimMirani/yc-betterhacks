export interface ExtractedPdf {
  text: string;
  numPages: number;
  title: string;
}

/**
 * Extracts text content from a PDF buffer.
 * Returns the full text, page count, and title (if available in metadata).
 */
export async function extractTextFromPdf(
  pdfBuffer: Buffer,
): Promise<ExtractedPdf> {
  // pdf-parse v1 is CommonJS — use dynamic import for ES module compatibility
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(pdfBuffer);

  return {
    text: data.text.trim(),
    numPages: data.numpages,
    title: data.info?.Title || "",
  };
}
