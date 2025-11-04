import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/workflows/test-node/route';

// Mock @repo/ai-workers to simulate Together streaming without actual network
vi.mock('@repo/ai-workers', async () => {
  return {
    streamTextNode: async ({ onChunk, onFinish }) => {
      onChunk?.('A', 'A');
      onChunk?.('B', 'AB');
      onFinish?.({
        text: 'AB',
        usage: { totalTokens: 42, promptTokens: 30, completionTokens: 12 },
        finishReason: 'stop',
      });
      return { success: true, text: 'AB' };
    },
  };
});

describe('API: /api/workflows/test-node done payload (Together model)', () => {
  it('includes done: true, text, and usage fields in the final event', async () => {
    const body = {
      nodeType: 'text-generation',
      config: {
        prompt: 'Say AB',
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        temperature: 0,
        maxTokens: 16,
      },
    };

    const req = new Request('http://localhost/api/workflows/test-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await POST(req as any);
    const reader = (res.body as ReadableStream).getReader();
    const decoder = new TextDecoder();
    let aggregated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aggregated += decoder.decode(value);
    }

    const events = aggregated
      .split('\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => JSON.parse(l.slice(6)));

    const final = events.find((e) => e.done === true);
    expect(final).toBeDefined();
    expect(final.text).toBe('AB');
    expect(final.usage).toBeDefined();
    expect(final.usage.totalTokens).toBe(42);
    expect(final.usage.promptTokens).toBe(30);
    expect(final.usage.completionTokens).toBe(12);
  });
});

