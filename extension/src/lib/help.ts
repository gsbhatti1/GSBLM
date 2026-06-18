// Bundled human-help directory — the offline default.
// Once the backend (LM-18) is live, the panel can fetch a fuller, jurisdiction-aware
// list; this seed keeps "get me a human" working with no network and no account.
// "No veteran pays for the bridge back to help" — these are free/public services.

export interface HelpContact {
  name: string;
  kind: 'local' | 'veteran' | 'crisis';
  description: string;
  phone?: string;
  url?: string;
  jurisdiction: string; // 'US', 'US-UT', etc.
}

export const helpDirectory: HelpContact[] = [
  {
    name: '211 (United Way)',
    kind: 'local',
    description: 'Free, 24/7. Connects you to local food, housing, and benefits help.',
    phone: '211',
    url: 'https://www.211.org',
    jurisdiction: 'US',
  },
  {
    name: 'Utah 211',
    kind: 'local',
    description: 'Utah local services: food, rent, utilities, and more.',
    phone: '211',
    url: 'https://211utah.org',
    jurisdiction: 'US-UT',
  },
  {
    name: 'VA Benefits Hotline',
    kind: 'veteran',
    description: 'Help with VA disability, pension, and claim questions.',
    phone: '1-800-827-1000',
    url: 'https://www.va.gov',
    jurisdiction: 'US',
  },
  {
    name: 'Accredited Veterans Service Officer (VSO)',
    kind: 'veteran',
    description: 'A trained officer can file and manage VA claims with you, for free.',
    url: 'https://www.va.gov/ogc/apps/accreditation/index.asp',
    jurisdiction: 'US',
  },
  {
    name: 'Veterans Crisis Line',
    kind: 'crisis',
    description: 'Free, confidential support, 24/7. You do not have to be in crisis to call.',
    phone: '988 then press 1',
    url: 'https://www.veteranscrisisline.net',
    jurisdiction: 'US',
  },
];

export function contactsByKind(kind: HelpContact['kind'], jurisdiction = 'US'): HelpContact[] {
  const local = helpDirectory.filter((c) => c.kind === kind && c.jurisdiction === jurisdiction);
  const national = helpDirectory.filter((c) => c.kind === kind && c.jurisdiction === 'US');
  // Prefer jurisdiction-specific, then fall back to national, de-duped.
  const seen = new Set<string>();
  return [...local, ...national].filter((c) => (seen.has(c.name) ? false : seen.add(c.name)));
}
