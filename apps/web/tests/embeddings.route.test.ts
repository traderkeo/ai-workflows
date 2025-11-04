import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as embeddingsPOST } from '../src/app/api/workflows/embeddings/route';

vi.mock('@repo/ai-workers', () => ({
  generateEmbeddingsBatchNode: vi.fn(async ({ texts }: { texts: string[] }) => ({
    success: true,
    embeddings: texts.map((t) => Array(4).fill(t.length)),
    dimensions: 4,
    usage: { tokens: 0 },
  })),
}));

function makeRequest(body: any) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('Embeddings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when texts is missing', async () => {
    const res = await embeddingsPOST(makeRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns embeddings when texts provided', async () => {
    const res = await embeddingsPOST(makeRequest({ texts: ['hello', 'world'] }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.embeddings)).toBe(true);
    expect(json.embeddings).toHaveLength(2);
  });
});

