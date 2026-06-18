// LM-23: AI proxy. Holds the OpenAI key server-side and requires explicit consent.
// No consent header -> 403. Only a `prompt` string is accepted; nothing else passes.

import { json, cors } from './_lib';

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });

  if (req.headers['x-consent'] !== 'granted') {
    return json(res, 403, { error: 'cloud AI consent required' });
  }

  const prompt = req.body?.prompt;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return json(res, 400, { error: 'prompt required' });
  }
  if (prompt.length > 6000) {
    return json(res, 400, { error: 'prompt too long' });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) return json(res, 500, { error: 'AI not configured' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You help people complete confusing forms. Answer at a 6th-grade reading level, short and calm. Never invent legal or eligibility facts; if unsure, say to check with a person.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    });
    if (!r.ok) return json(res, 502, { error: 'AI upstream error' });
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    return json(res, 200, { text });
  } catch {
    return json(res, 502, { error: 'AI request failed' });
  }
}
