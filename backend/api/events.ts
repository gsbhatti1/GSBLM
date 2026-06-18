// LM-22: analytics ingest. Stores anonymous events only.
// REJECTS any payload that contains content/PII-shaped fields — defense in depth
// so a bug upstream can never leak page text or personal data into the DB.

import { supabase, json, cors } from './_lib';

const ALLOWED = new Set([
  'anonUserHash',
  'templateId',
  'templateVersion',
  'stepId',
  'status',
  'jurisdiction',
  'ts',
]);

const FORBIDDEN = [
  'value', 'values', 'fields', 'pageText', 'text', 'content', 'html',
  'email', 'ssn', 'name', 'phone', 'address', 'dob', 'query',
];

const STATUSES = new Set(['started', 'completed', 'abandoned', 'human_help_requested']);

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  const body = req.body ?? {};

  // Reject forbidden keys anywhere in the payload.
  const keys = Object.keys(body);
  if (keys.some((k) => FORBIDDEN.includes(k.toLowerCase()))) {
    return json(res, 400, { error: 'payload contains disallowed fields' });
  }
  // Reject unknown keys (strict allowlist).
  if (keys.some((k) => !ALLOWED.has(k))) {
    return json(res, 400, { error: 'unknown field in payload' });
  }
  if (!STATUSES.has(body.status)) {
    return json(res, 400, { error: 'invalid status' });
  }
  if (!body.anonUserHash || !body.templateId || !body.stepId) {
    return json(res, 400, { error: 'missing required fields' });
  }

  const { error } = await supabase.from('events').insert({
    anon_user_hash: body.anonUserHash,
    template_id: body.templateId,
    template_version: body.templateVersion ?? '0',
    step_id: body.stepId,
    status: body.status,
    jurisdiction: body.jurisdiction ?? null,
  });

  if (error) return json(res, 500, { error: 'insert failed' });
  return json(res, 200, { ok: true });
}
