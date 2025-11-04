import { describe, it, expect, vi } from 'vitest';
import { POST } from '../src/app/api/workflows/test-node/route';

// Mock @repo/ai-workers to simulate Together streaming without network access
vi.mock('@repo/ai-workers', async () => {
  return {
    // streamTextNode signature used by the route
    streamTextNode: async ({ onChunk, onFinish }) => {
      // Simulate a few streamed chunks and a finish event
      onChunk?.('Hello', 'Hello');
      onChunk?.(' world', 'Hello world');
      onFinish?.({ text: 'Hello world', usage: { totalTokens: 10 } });
      return { success: true, text: 'Hello world' };
    },
  };
});

describe('API: /api/workflows/test-node (Together model)', () => {
  it('streams SSE data and completes for Together-style model IDs', async () => {
    const body = {
      nodeType: 'text-generation',
      config: {
        prompt: 'Say hello',
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
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = (res.body as ReadableStream).getReader();
    const decoder = new TextDecoder();
    let aggregated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aggregated += decoder.decode(value);
    }

    // Expect at least two data events and a done event
    const events = aggregated
      .split('\n')
      .filter((l) => l.startsWith('data: '))
      .map((l) => JSON.parse(l.slice(6)));

    expect(events.length).toBeGreaterThanOrEqual(3);
    // First chunks
    expect(events[0].fullText).toBeDefined();
    // Done event contains final text
    expect(events.some((e) => e.done && e.text === 'Hello world')).toBe(true);
  });
});

