// LM-24: serve versioned templates. LM-18: serve help contacts by jurisdiction.
// One file, routed by ?resource= for simplicity.

import { supabase, json, cors } from './_lib';

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'GET only' });

  const resource = req.query?.resource;

  if (resource === 'templates') {
    const { data, error } = await supabase
      .from('templates')
      .select('id, version, display_name, jurisdiction, match_hints, steps');
    if (error) return json(res, 500, { error: 'query failed' });
    return json(res, 200, { templates: data ?? [] });
  }

  if (resource === 'help') {
    const kind = req.query?.kind;
    const jurisdiction = req.query?.jurisdiction ?? 'US';
    let q = supabase.from('help_directory').select('*');
    if (kind) q = q.eq('kind', kind);
    const { data, error } = await q;
    if (error) return json(res, 500, { error: 'query failed' });
    // jurisdiction-specific first, then national fallback, de-duped by name
    const rows = data ?? [];
    const local = rows.filter((r: any) => r.jurisdiction === jurisdiction);
    const national = rows.filter((r: any) => r.jurisdiction === 'US');
    const seen = new Set<string>();
    const merged = [...local, ...national].filter((r: any) =>
      seen.has(r.name) ? false : seen.add(r.name),
    );
    return json(res, 200, { contacts: merged });
  }

  return json(res, 400, { error: 'unknown resource' });
}
