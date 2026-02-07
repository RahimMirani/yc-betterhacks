/**
 * Extract text from a PDF buffer using pdf-parse (PDFParse).
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText();
    const text = typeof (textResult as { text?: string }).text === 'string'
      ? (textResult as { text: string }).text
      : '';
    return text;
  } finally {
    await parser.destroy();
  }
}
