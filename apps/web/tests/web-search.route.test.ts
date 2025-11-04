import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as webSearchPOST } from '../src/app/api/workflows/web-search/route';

vi.mock('@repo/ai-workers', () => ({
  webSearchNode: vi.fn(async ({ query }: { query: string }) => ({
    success: true,
    text: `Result for ${query}`,
    citations: [{ url: 'https://example.com', title: 'Example' }],
    sources: [{ url: 'https://example.com' }],
    metadata: { model: 'gpt-4o-mini' },
  })),
}));

function makeRequest(body: any) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('Web Search API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when query is missing', async () => {
    const res = await webSearchPOST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns search text and citations', async () => {
    const res = await webSearchPOST(makeRequest({ query: 'test' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.text).toContain('test');
    expect(Array.isArray(json.citations)).toBe(true);
  });
});

