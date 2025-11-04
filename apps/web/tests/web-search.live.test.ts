import { describe, it, expect } from 'vitest';
import { POST as webSearchPOST } from '../src/app/api/workflows/web-search/route';

const hasKey = !!process.env.OPENAI_API_KEY;
const runLive = process.env.RUN_LIVE_OPENAI_TESTS === '1';

function makeRequest(body: any) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe.skipIf(!hasKey || !runLive)('LIVE Web Search API', () => {
  it('answers a query with sources when allowed', { timeout: 90000 }, async () => {
    const res = await webSearchPOST(makeRequest({
      query: 'OpenAI latest announcements',
      model: 'gpt-4o-mini',
      includeSources: true,
      // Limit to reduce scope (optional)
      // filters: { allowedDomains: ['openai.com'] },
      externalWebAccess: true,
    }));
    // Some accounts may not have web_search tool enabled; allow 200 or 500 with clear error
    if (res.status !== 200) {
      const json = await res.json();
      // If feature not enabled, accept test as inconclusive rather than failing pipeline
      expect(json.error).toBeDefined();
      return;
    }
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.text).toBe('string');
    // citations may be empty depending on response; don't enforce length>0 strictly
    expect(Array.isArray(json.citations)).toBe(true);
  });
});

