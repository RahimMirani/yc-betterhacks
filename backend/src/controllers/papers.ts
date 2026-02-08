import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { config } from "../config";
import { extractTextFromPdf } from "../services/pdfExtractor";
import { extractCitations } from "../services/citation-extractor";
import { embedAndStoreChunks } from "../services/embeddings";
import { insertPaper, findPaperById } from "../db/queries/papers";
import {
  insertCitations,
  findCitationsByPaperId,
  findCitation,
} from "../db/queries/citations";
import { enrichCitation } from "../services/citation-enrichment";

/** Upload directory from config (env UPLOAD_DIR or default cwd/uploads). */
const uploadDir = config.uploadDir;

const storePaperSchema = z.object({
  text: z.string().min(1),
  title: z.string().min(1),
});

const paperIdSchema = z.object({ paperId: z.string().uuid() });
const citationParamsSchema = z.object({
  paperId: z.string().uuid(),
  citationKey: z.string().min(1),
});

function extractTitleFromText(text: string): string {
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return firstLine && firstLine.length < 500 ? firstLine : "Untitled Paper";
}

export async function uploadPaper(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ error: "No PDF file provided" });
      return;
    }

    const {
      text,
      numPages,
      title: metaTitle,
    } = await extractTextFromPdf(req.file.buffer);
    const title =
      metaTitle?.trim() || extractTitleFromText(text) || "Untitled Paper";
    const citations: Array<{
      citationKey: string;
      rawReference: string | null;
      contextInPaper: string | null;
    }> = [];

    const paper = await insertPaper({
      title,
      authors: null,
      year: null,
      rawText: text,
    });

    const pdfPath = path.join(uploadDir, `${paper.id}.pdf`);
    fs.writeFileSync(pdfPath, req.file.buffer);

    await insertCitations(paper.id, citations);
    await embedAndStoreChunks(paper.id, text);

    const filename =
      (req.file.originalname || title || "paper").replace(/\.pdf$/i, "") +
      ".pdf";
    res.status(201).json({
      success: true,
      paperId: paper.id,
      filename,
      data: {
        id: paper.id,
        title: paper.title,
        pageCount: numPages,
        citationCount: citations.length,
        createdAt: paper.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function storePaper(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { text, title } = storePaperSchema.parse(req.body);
    const { citations } = extractCitations(text);

    const paper = await insertPaper({
      title,
      authors: null,
      year: null,
      rawText: text,
    });

    await insertCitations(paper.id, citations);

    // Embeddings are best-effort — don't fail the request
    try {
      await embedAndStoreChunks(paper.id, text);
    } catch {
      // Silently skip embedding failures
    }

    const storedCitations = await findCitationsByPaperId(paper.id);

    res.status(201).json({
      success: true,
      data: {
        id: paper.id,
        title: paper.title,
        citationCount: citations.length,
        citations: storedCitations.map((c) => ({
          citationKey: c.citation_key,
          rawReference: c.raw_reference,
        })),
      },
    });
  } catch (error) {
    // Log DB/validation errors so Railway logs show the real cause
    console.error("[storePaper] error:", error);
    next(error);
  }
}

export async function getPaper(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { paperId } = paperIdSchema.parse(req.params);
    const paper = await findPaperById(paperId);
    if (!paper) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    const citations = await findCitationsByPaperId(paperId);
    res.json({
      success: true,
      data: {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        citationCount: citations.length,
        citations: citations.map((c) => ({
          id: c.id,
          citationKey: c.citation_key,
          enriched: c.enriched,
          citedTitle: c.cited_title,
        })),
        createdAt: paper.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaperFile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { paperId } = paperIdSchema.parse(req.params);
    const paper = await findPaperById(paperId);
    if (!paper) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    const filePath = path.join(uploadDir, `${paperId}.pdf`);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "PDF file not found" });
      return;
    }
    res.setHeader("Content-Type", "application/pdf");
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

export async function getCitationContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { paperId, citationKey } = citationParamsSchema.parse(req.params);
    const decodedKey = decodeURIComponent(citationKey);
    let citation = await findCitation(paperId, decodedKey);
    if (!citation) {
      res.status(404).json({ error: "Citation not found" });
      return;
    }
    if (!citation.enriched && !citation.enrichment_failed) {
      citation = await enrichCitation(paperId, citation);
    }
    res.json({
      success: true,
      data: {
        id: citation.id,
        citationKey: citation.citation_key,
        rawReference: citation.raw_reference,
        contextInPaper: citation.context_in_paper,
        citedTitle: citation.cited_title,
        citedAbstract: citation.cited_abstract,
        citedAuthors: citation.cited_authors,
        citedYear: citation.cited_year,
        citedDoi: citation.cited_doi,
        relevanceExplanation: citation.relevance_explanation,
        enriched: citation.enriched,
        enrichmentFailed: citation.enrichment_failed,
        failureReason: citation.failure_reason,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPaperText(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { paperId } = paperIdSchema.parse(req.params);
    const paper = await findPaperById(paperId);
    if (!paper) {
      res.status(404).json({ error: "Paper not found" });
      return;
    }
    const citations = await findCitationsByPaperId(paperId);
    const citationMarkers = buildCitationMarkerPositions(
      paper.raw_text,
      citations,
    );
    res.json({
      success: true,
      data: {
        text: paper.raw_text,
        citationMarkers,
      },
    });
  } catch (error) {
    next(error);
  }
}

function buildCitationMarkerPositions(
  text: string,
  citations: readonly { citation_key: string }[],
): readonly {
  key: string;
  positions: readonly { start: number; end: number }[];
}[] {
  const uniqueKeys = [...new Set(citations.map((c) => c.citation_key))];
  return uniqueKeys.map((key) => {
    const escapedKey = key.replace(/[[\]().,]/g, "\\$&");
    const regex = new RegExp(escapedKey, "g");
    const positions: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return { key, positions };
  });
}
