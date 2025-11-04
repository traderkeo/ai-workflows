import { describe, it, expect } from 'vitest';
import { POST as testNodePOST } from '../src/app/api/workflows/test-node/route';

const hasTogetherKey = !!process.env.TOGETHER_API_KEY;
// Opt-in automatically when a Together key is present
const runLive = process.env.RUN_LIVE_TOGETHER_TESTS === '1' || hasTogetherKey;

function makeRequest(body: any) {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe.skipIf(!hasTogetherKey || !runLive)('LIVE Together images via /api/workflows/test-node', () => {
  it(
    'generates an image URL from FLUX.1 Schnell',
    { timeout: 120_000 },
    async () => {
      const modelId = 'black-forest-labs/FLUX.1-schnell';
      const res = await testNodePOST(
        makeRequest({
          nodeType: 'image-generation',
          config: {
            prompt: 'A serene mountain landscape at sunset with a lake reflection',
            model: modelId,
            size: '1024x1024',
            steps: 4,
            response_format: 'url',
          },
        })
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(typeof json.image).toBe('string');
      // Should be a URL
      expect(json.image.startsWith('http')).toBe(true);
    }
  );
});
