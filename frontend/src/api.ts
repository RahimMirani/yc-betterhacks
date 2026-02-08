import { API_BASE, parseJsonResponse } from './apiClient';

export { getApiBase } from './apiClient';

export interface UploadResponse {
  paperId: string;
  filename: string;
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const url = `${API_BASE}/api/papers/upload`;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await parseJsonResponse<{ error?: string }>(res, url).catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return parseJsonResponse<UploadResponse>(res, url);
}

export function fetchPdfUrl(paperId: string): string {
  return `${API_BASE}/api/papers/${paperId}/file`;
}

export interface ExplainResponse {
  reply: string;
}

export async function explain(
  paperId: string,
  selectedText: string,
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>,
  level?: string,
): Promise<ExplainResponse> {
  const url = `${API_BASE}/api/explain`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperId, selectedText, messages }),
  });
  if (!res.ok) {
    const err = await parseJsonResponse<{ error?: string }>(res, url).catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Explain failed');
  }
  return parseJsonResponse<ExplainResponse>(res, url);
}
