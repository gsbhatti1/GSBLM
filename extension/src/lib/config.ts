// Backend base URL. Set this once after the first Vercel deploy of backend/.
// Example: 'https://lifemode-backend.vercel.app/api'
// Until set, network calls are skipped gracefully (the extension stays local-first).

export const BACKEND_BASE = ''; // e.g. 'https://lifemode-backend.vercel.app/api'

export function backendUrl(path: string): string | null {
  if (!BACKEND_BASE) return null;
  return `${BACKEND_BASE}${path}`;
}
