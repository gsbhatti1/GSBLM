import { describe, it, expect, vi, beforeEach } from 'vitest';

let lastInsert: any = null;
vi.mock('../api/_lib', () => ({
  supabase: {
    from: () => ({
      insert: async (row: any) => {
        lastInsert = row;
        return { error: null };
      },
    }),
  },
  json: (res: any, status: number, body: unknown) => {
    res._status = status;
    res._body = body;
  },
  cors: () => {},
}));

import handler from '../api/events';

function mockReqRes(method: string, body: any) {
  const res: any = {
    status(s: number) {
      this._status = s;
      return this;
    },
    end() {},
  };
  return { req: { method, body, headers: {} }, res };
}

describe('LM-22 events ingest', () => {
  beforeEach(() => {
    lastInsert = null;
  });

  it('accepts a clean event', async () => {
    const { req, res } = mockReqRes('POST', {
      anonUserHash: 'abc',
      templateId: 'va_disability_claim',
      templateVersion: '0.1.0',
      stepId: 'intent_to_file',
      status: 'completed',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(lastInsert.template_id).toBe('va_disability_claim');
  });

  it('rejects a payload carrying page content', async () => {
    const { req, res } = mockReqRes('POST', {
      anonUserHash: 'abc',
      templateId: 'x',
      stepId: 'y',
      status: 'started',
      pageText: 'the user typed their SSN here',
    });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(lastInsert).toBeNull();
  });

  it('rejects PII-shaped fields', async () => {
    const { req, res } = mockReqRes('POST', {
      anonUserHash: 'abc',
      templateId: 'x',
      stepId: 'y',
      status: 'started',
      ssn: '123-45-6789',
    });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(lastInsert).toBeNull();
  });

  it('rejects unknown fields', async () => {
    const { req, res } = mockReqRes('POST', {
      anonUserHash: 'abc',
      templateId: 'x',
      stepId: 'y',
      status: 'started',
      sneaky: 'data',
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('rejects an invalid status', async () => {
    const { req, res } = mockReqRes('POST', {
      anonUserHash: 'abc',
      templateId: 'x',
      stepId: 'y',
      status: 'exfiltrate',
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });
});
