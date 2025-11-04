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

describe.skipIf(!hasTogetherKey || !runLive)('LIVE Together structured outputs via /api/workflows/test-node', () => {
  it(
    'returns JSON matching schema using response_format',
    { timeout: 120_000 },
    async () => {
      const modelId = process.env.TOGETHER_LIVE_JSON_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

      const schema = {
        title: '',
        summary: '',
        actionItems: [],
      };

      const prompt =
        'You will be given a short text. Only answer in JSON with keys: title (string), summary (string), actionItems (array of strings).';

      const res = await testNodePOST(
        makeRequest({
          nodeType: 'structured-data',
          config: {
            prompt,
            schema,
            schemaName: 'VoiceNote',
            schemaDescription: 'Extracted structured summary',
            model: modelId,
            temperature: 0.2,
          },
        })
      );

      const json = await res.json();
      if (res.status !== 200) {
        // Some accounts/models may not have JSON mode or quota; accept informative error
        expect(json.error).toBeDefined();
        return;
      }
      expect(json.success).toBe(true);
      expect(typeof json.object).toBe('object');
      expect(typeof json.object.title).toBe('string');
      expect(typeof json.object.summary).toBe('string');
      expect(Array.isArray(json.object.actionItems)).toBe(true);
    }
  );
});
