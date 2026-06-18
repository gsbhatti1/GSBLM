import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractPage } from '../src/content/extract';

const FIXTURE_DIR = join(__dirname, 'fixtures');

function loadFixture(name: string): void {
  const html = readFileSync(join(FIXTURE_DIR, name), 'utf8');
  document.body.innerHTML = html;
}

describe('extractPage — synthetic benefits form', () => {
  beforeEach(() => loadFixture('synthetic-benefits.html'));

  it('finds all the form fields', () => {
    const page = extractPage();
    expect(page.fields.length).toBeGreaterThanOrEqual(9);
  });

  it('detects required fields', () => {
    const page = extractPage();
    const required = page.fields.filter((f) => f.required);
    // firstName, lastName, dob, ssn, street, state, proof = 7 required
    expect(required.length).toBeGreaterThanOrEqual(7);
  });

  it('classifies sensitive and typed fields correctly', () => {
    const page = extractPage();
    const kinds = Object.fromEntries(page.fields.map((f) => [f.id, f.kind]));
    expect(kinds['ssn']).toBe('ssn');
    expect(kinds['dob']).toBe('date');
    expect(kinds['phone']).toBe('phone');
    expect(kinds['state']).toBe('select');
    expect(kinds['proof']).toBe('file');
    expect(kinds['veteran']).toBe('checkbox');
  });

  it('reads human labels, not field names', () => {
    const page = extractPage();
    const ssn = page.fields.find((f) => f.id === 'ssn');
    expect(ssn?.label.toLowerCase()).toContain('social security');
  });

  it('captures the deadline and the error state', () => {
    const page = extractPage();
    expect(page.deadlines.join(' ').toLowerCase()).toContain('due');
    expect(page.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('captures the primary action label', () => {
    const page = extractPage();
    expect(page.primaryActionLabel?.toLowerCase()).toContain('submit');
  });
});

describe('extractPage — runs on every saved real fixture', () => {
  const real = readdirSync(FIXTURE_DIR).filter(
    (f) => f.endsWith('.html') && f !== 'synthetic-benefits.html',
  );

  if (real.length === 0) {
    it.skip('no real fixtures saved yet (drop va.html / snap.html / housing.html here)', () => {});
  }

  for (const name of real) {
    it(`extracts without throwing: ${name}`, () => {
      loadFixture(name);
      const page = extractPage();
      expect(page).toBeTruthy();
      expect(Array.isArray(page.fields)).toBe(true);
    });
  }
});
