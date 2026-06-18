import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTemplates,
  matchTemplate,
  nextStep,
  genericSteps,
} from '../src/taskgraph/engine';
import { allTemplates } from '../src/taskgraph/index';
import type { ExtractedPage } from '../src/lib/types';

function page(partial: Partial<ExtractedPage>): ExtractedPage {
  return {
    origin: 'https://example.com',
    pathname: '/',
    title: '',
    fields: [],
    deadlines: [],
    errors: [],
    ...partial,
  };
}

describe('task-graph engine', () => {
  beforeEach(() => loadTemplates(allTemplates));

  it('matches a va.gov page to the VA template', () => {
    const t = matchTemplate(
      page({ origin: 'https://www.va.gov', pathname: '/disability/file-claim', title: 'File a claim' }),
    );
    expect(t?.id).toBe('va_disability_claim');
  });

  it('matches a SNAP page', () => {
    const t = matchTemplate(page({ title: 'Apply for SNAP food assistance' }));
    expect(t?.id).toBe('snap_application');
  });

  it('matches a housing page', () => {
    const t = matchTemplate(
      page({ origin: 'https://housingauthority.gov', title: 'Section 8 voucher waitlist' }),
    );
    expect(t?.id).toBe('housing_application');
  });

  it('returns undefined for an unknown page', () => {
    const t = matchTemplate(page({ origin: 'https://news.example.com', title: 'Breaking news' }));
    expect(t).toBeUndefined();
  });

  it('picks the higher-scoring template when hints overlap', () => {
    // a page mentioning both "housing" and many VA-specific hints should go VA
    const t = matchTemplate(
      page({ origin: 'https://va.gov', title: 'disability compensation intent to file housing' }),
    );
    expect(t?.id).toBe('va_disability_claim');
  });

  it('nextStep returns the first step when nothing is marked done', () => {
    const t = matchTemplate(page({ origin: 'https://va.gov' }))!;
    const step = nextStep(t, page({ origin: 'https://va.gov' }));
    expect(step.id).toBe(t.steps[0].id);
  });

  it('genericSteps builds a checklist from required fields', () => {
    const steps = genericSteps(
      page({
        fields: [
          { id: 'a', label: 'Full name', kind: 'text', required: true },
          { id: 'b', label: 'Email', kind: 'text', required: true },
          { id: 'c', label: 'Optional note', kind: 'text', required: false },
        ],
      }),
    );
    expect(steps.length).toBe(2);
    expect(steps[0].title.toLowerCase()).toContain('full name');
  });

  it('all three templates load and have steps', () => {
    expect(allTemplates.length).toBe(3);
    for (const t of allTemplates) {
      expect(t.steps.length).toBeGreaterThanOrEqual(3);
      expect(t.version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
