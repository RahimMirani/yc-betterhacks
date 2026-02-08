import { PDFParse } from 'pdf-parse'

interface PdfParseResult {
  readonly text: string
  readonly pageCount: number
}

export async function parsePdf(buffer: Buffer): Promise<PdfParseResult> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })

  try {
    const textResult = await parser.getText()

    if (!textResult.text || textResult.text.trim().length === 0) {
      throw new Error('Could not extract text from this PDF. The file may be image-based or corrupted.')
    }

    return {
      text: textResult.text,
      pageCount: textResult.total,
    }
  } finally {
    await parser.destroy()
  }
}
