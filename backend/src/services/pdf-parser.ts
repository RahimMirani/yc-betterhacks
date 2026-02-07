// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

interface PdfParseResult {
  readonly text: string;
  readonly pageCount: number;
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const textResult = await parser.getText();
    const text = typeof (textResult as { text?: string }).text === 'string'
      ? (textResult as { text: string }).text
      : '';
    const total = typeof (textResult as { total?: number }).total === 'number'
      ? (textResult as { total: number }).total
      : 0;

    if (!text || text.trim().length === 0) {
      throw new Error(
        'Could not extract text from this PDF. The file may be image-based or corrupted.'
      );
    }

    return {
      text: text.trim(),
      pageCount: total,
    };
  } finally {
    await parser.destroy();
  }
}
