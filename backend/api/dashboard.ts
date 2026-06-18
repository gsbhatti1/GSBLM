// LM-25: dashboard read API. Aggregates anonymous events into the numbers a
// partner (VSO/county) pays for: completion rate and top abandonment step.

import { supabase, json, cors } from './_lib';

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'GET only' });

  const { data, error } = await supabase
    .from('events')
    .select('template_id, step_id, status');
  if (error) return json(res, 500, { error: 'query failed' });

  const rows = data ?? [];
  const started = rows.filter((r: any) => r.status === 'started').length;
  const completed = rows.filter((r: any) => r.status === 'completed').length;
  const abandoned = rows.filter((r: any) => r.status === 'abandoned');

  // Top abandonment step.
  const byStep: Record<string, number> = {};
  for (const r of abandoned) {
    const key = `${r.template_id}:${r.step_id}`;
    byStep[key] = (byStep[key] ?? 0) + 1;
  }
  const topAbandon = Object.entries(byStep).sort((a, b) => b[1] - a[1])[0];

  return json(res, 200, {
    totalStarted: started,
    totalCompleted: completed,
    completionRate: started ? Math.round((completed / started) * 100) : 0,
    topAbandonmentStep: topAbandon ? { step: topAbandon[0], count: topAbandon[1] } : null,
  });
}
