// pdf-parse v1 is CommonJS; use same API as pdfExtractor
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

interface PdfParseResult {
  readonly text: string;
  readonly pageCount: number;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  const data = await pdfParse(buffer);
  const text = (data.text || '').trim();
  if (!text) {
    throw new Error('Could not extract text from this PDF. The file may be image-based or corrupted.');
  }
  return {
    text,
    pageCount: data.numpages ?? 0,
  };
}
