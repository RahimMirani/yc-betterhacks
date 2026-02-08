/**
 * Shared API base and fetch helpers.
 * Use getApiBase() to confirm in UI or errors what URL the app is using.
 */

export const API_BASE =
  process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function getApiBase(): string {
  return API_BASE;
}

/**
 * Parse response as JSON. If the server returned HTML (e.g. SPA index),
 * throw a clear error so we know the request hit the wrong server.
 */
export async function parseJsonResponse<T>(
  res: Response,
  requestUrl: string
): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const snippet = (await res.text()).slice(0, 200);
    throw new Error(
      `Received HTML instead of JSON. The request may be going to the wrong server.\n` +
        `Request URL: ${requestUrl}\n` +
        `API base in this build: ${API_BASE}\n` +
        `On Railway: set REACT_APP_API_URL to your backend public URL and redeploy the frontend.\n` +
        `Response snippet: ${snippet}`
    );
  }
  return res.json();
}
