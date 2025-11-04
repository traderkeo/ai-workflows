import { describe, it, expect, beforeAll } from 'vitest';
import { POST as embeddingsPOST } from '../src/app/api/workflows/embeddings/route';

const hasKey = !!process.env.OPENAI_API_KEY;
const runLive = process.env.RUN_LIVE_OPENAI_TESTS === '1';

function makeRequest(body: any) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe.skipIf(!hasKey || !runLive)('LIVE Embeddings API', () => {
  beforeAll(() => {
    // keep test light and cheap
  });

  it('generates embeddings for short texts', { timeout: 60000 }, async () => {
    const res = await embeddingsPOST(makeRequest({
      texts: ['hello', 'world'],
      model: 'text-embedding-3-small',
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.embeddings)).toBe(true);
    expect(json.embeddings.length).toBe(2);
    expect(Array.isArray(json.embeddings[0])).toBe(true);
    expect(typeof json.embeddings[0][0]).toBe('number');
  });
});

