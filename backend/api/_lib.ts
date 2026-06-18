// Shared config. Keys come from env — never hardcoded, never committed.
// SUPABASE_URL + SUPABASE_SERVICE_KEY (service role, server-side only).
// OPENAI_API_KEY for the AI proxy.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.warn('SUPABASE_URL / SUPABASE_SERVICE_KEY not set — API calls will fail.');
}

export const supabase = createClient(url ?? '', serviceKey ?? '', {
  auth: { persistSession: false },
});

export function json(res: any, status: number, body: unknown): void {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

export function cors(res: any): void {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type, x-consent');
  res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
}
