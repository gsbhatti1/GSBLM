/*
 * LifeMode Wayfinder — server resolver
 * ------------------------------------
 * Drop this into your Next.js app on Vercel at:
 *     app/api/wayfinder/route.ts
 * (GSBLM is the extension repo; this endpoint lives on one of your
 *  existing Vercel deployments. The extension calls it via RESOLVER_URL.)
 *
 * What it does:
 *   - Takes plain-words intent (text only — no page contents, no PII).
 *   - Resolves the CURRENT official destination dynamically (no hardcoded
 *     link directory) using a grounded model call.
 *   - VALIDATES the returned URL against an official-domain allowlist.
 *     Anything not under an official roof is rejected -> human fallback.
 *   - Generates the "field note": the one trip-killer fact.
 *   - Never gives claim advice, never predicts outcomes.
 *
 * Env required (set in Vercel, never in the repo):
 *   ANTHROPIC_API_KEY   (or swap to your provider)
 * Optional:
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (rate limit)
 */

export const runtime = 'edge';

// ---- The ONE small curated thing: official roofs, not destinations -----
const OFFICIAL_DOMAINS = [
  'va.gov', 'tricare.mil', 'tricare.triwest.com', 'triwest.com',
  'archives.gov', 'vetrecs.archives.gov', 'dmdc.osd.mil',
  'milconnect.dmdc.osd.mil', 'ebenefits.va.gov', 'benefits.va.gov',
  'veteranscrisisline.net', '988lifeline.org', 'dol.gov', 'sba.gov'
];

function isOfficial(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return OFFICIAL_DOMAINS.some(
      (d) => host === d || host.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

const HUMAN_FALLBACK = {
  verified: false,
  fallback: true,
  title: "I don't have a clean route for that yet — but I'm not leaving you stuck.",
  dest: 'A VA-accredited rep can point you, free.',
  url: 'https://www.va.gov/get-help-from-accredited-representative/',
  clicks: 'Find a representative -> search by location -> request',
  fieldNote:
    "A VSO's help on your claim is always free. If anyone wants money upfront to file an initial claim, walk away."
};

const SYSTEM_PROMPT = `You are LifeMode's wayfinder for U.S. veterans and their families.
A person describes, in plain words, something they are trying to do.
Return the SINGLE best CURRENT official destination to do it.

Hard rules:
- Use only official U.S. government / official contractor sources
  (va.gov, *.mil, archives.gov, milConnect, official TRICARE contractor, etc.).
- Never invent a URL. If you are not confident the URL is current and official,
  set "verified" to false and leave url empty.
- You are NOT a lawyer, doctor, or VA rep. Never give claim advice, never
  predict claim outcomes, never tell anyone what to write on a claim.
- The "fieldNote" is the single most useful thing most people don't know about
  this task — a shortcut, a trap to avoid, or a step that saves a wasted trip.
  Plain words. One or two sentences. True and verifiable only.

Return JSON only, no prose:
{"verified":true|false,
 "dest":"short name of the destination",
 "url":"official url",
 "clicks":"the clicks once they're there",
 "fieldNote":"the one thing nobody told them"}`;

async function rateLimited(ip: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false; // rate limit optional
  try {
    const key = `wf:${ip}:${Math.floor(Date.now() / 60000)}`;
    const r = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { result } = await r.json();
    if (result === 1) {
      await fetch(`${url}/expire/${key}/120`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    return result > 20; // 20 resolves / minute / ip
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  if (await rateLimited(ip)) {
    return Response.json(HUMAN_FALLBACK, { status: 200 });
  }

  let query = '';
  try {
    const body = await req.json();
    query = String(body?.query || '').slice(0, 300).trim();
  } catch {
    return Response.json(HUMAN_FALLBACK, { status: 200 });
  }
  if (!query) return Response.json(HUMAN_FALLBACK, { status: 200 });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: query }]
      })
    });

    const data = await res.json();
    const text = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return Response.json(HUMAN_FALLBACK);

    const parsed = JSON.parse(match[0]);

    // (3) trust boundary: reject anything not under an official roof
    if (!parsed.verified || !parsed.url || !isOfficial(parsed.url)) {
      return Response.json(HUMAN_FALLBACK);
    }

    return Response.json({
      verified: true,
      dest: String(parsed.dest || '').slice(0, 140),
      url: parsed.url,
      clicks: String(parsed.clicks || '').slice(0, 200),
      fieldNote: String(parsed.fieldNote || '').slice(0, 360)
    });
  } catch {
    return Response.json(HUMAN_FALLBACK);
  }
}
