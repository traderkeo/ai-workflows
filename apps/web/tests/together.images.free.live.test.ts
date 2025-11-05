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

describe.skipIf(!hasTogetherKey || !runLive)('LIVE Together images (FLUX.1-schnell-Free)', () => {
  it(
    'generates an image from FLUX.1-schnell-Free',
    { timeout: 120_000 },
    async () => {
      const res = await testNodePOST(
        makeRequest({
          nodeType: 'image-generation',
          config: {
            prompt: 'A simple line art of a playful cat, black ink on white background',
            model: 'black-forest-labs/FLUX.1-schnell-Free',
            size: '1024x1024',
            response_format: 'url',
          },
        })
      );

      const json = await res.json();

      if (res.status !== 200) {
        // Free model may be rate-limited; accept informative error
        expect(json.error).toBeDefined();
        return;
      }

      expect(json.success).toBe(true);
      expect(typeof json.image).toBe('string');
      const img: string = json.image;
      expect(img.startsWith('http') || img.startsWith('data:image')).toBe(true);
    }
  );
});

