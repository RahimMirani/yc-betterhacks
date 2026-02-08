import { API_BASE, parseJsonResponse } from '../apiClient';

/**
 * Uploads a PDF file to the backend and returns extracted text.
 */
export async function extractPdf(file: File): Promise<{
  text: string;
  numPages: number;
  title: string;
  characterCount: number;
}> {
  const url = `${API_BASE}/api/extract-pdf`;
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(url, { method: 'POST', body: formData });

  if (!response.ok) {
    const error = await parseJsonResponse<{ error?: string }>(response, url).catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `Upload failed with status ${response.status}`);
  }

  const result = await parseJsonResponse<{ data: { text: string; numPages: number; title: string; characterCount: number } }>(response, url);
  return result.data;
}

/**
 * Fetches a PDF from a URL via the backend and returns extracted text + PDF blob URL.
 */
export async function extractPdfFromUrl(url: string): Promise<{
  text: string;
  numPages: number;
  title: string;
  characterCount: number;
  pdfBlobUrl: string;
}> {
  const reqUrl = `${API_BASE}/api/extract-pdf-url`;
  const response = await fetch(reqUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await parseJsonResponse<{ error?: string }>(response, reqUrl).catch(() => ({ error: 'Failed to load PDF from URL' }));
    throw new Error(error.error || `Failed to load PDF from URL (status ${response.status})`);
  }

  const result = await parseJsonResponse<{ data: { text: string; numPages: number; title: string; characterCount: number; pdfBase64: string } }>(response, reqUrl);
  const { text, numPages, title, characterCount, pdfBase64 } = result.data;

  // Convert base64 PDF to a blob URL for the viewer
  const binaryString = atob(pdfBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const pdfBlobUrl = URL.createObjectURL(blob);

  return { text, numPages, title, characterCount, pdfBlobUrl };
}

// ── Citation Types ──

export interface CitationSummary {
  citationKey: string;
  rawReference: string | null;
}

export interface StorePaperResult {
  id: string;
  title: string;
  citationCount: number;
  citations: CitationSummary[];
}

export interface CitationDetail {
  id: string;
  citationKey: string;
  rawReference: string | null;
  contextInPaper: string | null;
  citedTitle: string | null;
  citedAbstract: string | null;
  citedAuthors: string[] | null;
  citedYear: number | null;
  citedDoi: string | null;
  relevanceExplanation: string | null;
  enriched: boolean;
  enrichmentFailed: boolean;
  failureReason: string | null;
}

/**
 * Stores paper text in the backend and triggers citation extraction.
 * This is a non-blocking call — if it fails, the paper still renders normally.
 */
export async function storePaper(text: string, title: string): Promise<StorePaperResult> {
  const reqUrl = `${API_BASE}/api/papers/store`;
  const response = await fetch(reqUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, title }),
  });

  if (!response.ok) {
    const error = await parseJsonResponse<{ error?: string }>(response, reqUrl).catch(() => ({ error: 'Failed to store paper' }));
    throw new Error(error.error || `Store failed with status ${response.status}`);
  }

  const result = await parseJsonResponse<{ data: StorePaperResult }>(response, reqUrl);
  return result.data;
}

/**
 * Fetches enriched citation details. Triggers lazy enrichment on the backend
 * (Semantic Scholar lookup + Claude relevance explanation) if not yet enriched.
 */
export async function fetchCitationDetail(
  paperId: string,
  citationKey: string,
): Promise<CitationDetail> {
  const encodedKey = encodeURIComponent(citationKey);
  const reqUrl = `${API_BASE}/api/papers/${paperId}/citations/${encodedKey}`;
  const response = await fetch(reqUrl);

  if (!response.ok) {
    const error = await parseJsonResponse<{ error?: string }>(response, reqUrl).catch(() => ({ error: 'Failed to fetch citation' }));
    throw new Error(error.error || `Fetch citation failed with status ${response.status}`);
  }

  const result = await parseJsonResponse<{ data: CitationDetail }>(response, reqUrl);
  return result.data;
}

/**
 * Step progress update from the backend.
 */
export interface StepProgress {
  step: number;
  total: number;
  message: string;
  done?: boolean;
}

/**
 * The full implementation result.
 */
export interface ImplementResult {
  colabUrl: string;
  gistUrl: string;
  downloadUrl: string;
  analysis: {
    title: string;
    domain: string;
    coreProblem: string;
    coreContribution: string;
    paperComplexity: string;
    methods: Array<{ name: string; description: string; section: string }>;
    requiredLibraries: string[];
  };
  plan: {
    summary: string;
    framework: string;
    frameworkReasoning: string;
    simplifications: string[];
    steps: Array<{
      order: number;
      title: string;
      description: string;
      components: string[];
      estimatedLines: number;
    }>;
    demoDataStrategy: string;
  };
  notebookCells: Array<{
    cell_type: 'markdown' | 'code';
    source: string;
  }>;
  meta: {
    totalCells: number;
    codeCells: number;
    markdownCells: number;
    pipelineDurationSeconds: number;
  };
}

/**
 * Sends paper text to the backend to generate a Colab implementation.
 * Supports two response formats:
 *   - Normal JSON (when result is cached — instant)
 *   - SSE stream (when pipeline runs — live step updates)
 */
export async function implementPaper(
  paperText: string,
  onStepUpdate?: (progress: StepProgress) => void
): Promise<ImplementResult> {
  const reqUrl = `${API_BASE}/api/implement-paper`;
  const response = await fetch(reqUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperText }),
  });

  if (!response.ok) {
    const error = await parseJsonResponse<{ error?: string }>(response, reqUrl).catch(() => ({ error: 'Implementation failed' }));
    throw new Error(error.error || `Implementation failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  // Cached result — normal JSON response
  if (contentType.includes('application/json')) {
    const result = await parseJsonResponse<{ data: ImplementResult }>(response, reqUrl);
    return result.data;
  }

  // SSE stream — parse events
  return new Promise<ImplementResult>((resolve, reject) => {
    const reader = response.body?.getReader();
    if (!reader) {
      reject(new Error('No response body'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    function processEvents() {
      // Split buffer into complete events (separated by double newline)
      const parts = buffer.split('\n\n');
      // Keep the last part as buffer (may be incomplete)
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = 'message';
        let eventData = '';

        for (const line of part.split('\n')) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7);
          } else if (line.startsWith('data: ')) {
            eventData = line.substring(6);
          }
        }

        if (!eventData) continue;

        try {
          const parsed = JSON.parse(eventData);

          if (eventType === 'step' && onStepUpdate) {
            onStepUpdate(parsed as StepProgress);
          } else if (eventType === 'result') {
            resolve(parsed as ImplementResult);
          } else if (eventType === 'error') {
            reject(new Error(parsed.detail || parsed.error || 'Pipeline failed'));
          }
        } catch {
          // Ignore unparseable events
        }
      }
    }

    function read(): void {
      reader!.read().then(({ done, value }) => {
        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            buffer += '\n\n';
            processEvents();
          }
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        processEvents();
        read();
      }).catch(reject);
    }

    read();
  });
}
