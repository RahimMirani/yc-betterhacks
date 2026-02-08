const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface UploadResponse {
  paperId: string;
  filename: string;
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/papers/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperId, selectedText, messages }),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Explain failed');
  }
  return res.json();
}
