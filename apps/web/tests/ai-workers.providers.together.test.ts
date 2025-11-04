import { describe, it, expect, beforeAll } from 'vitest';
import { getProviderModel, getModelInfo, isValidModel } from '@repo/ai-workers';

describe('ai-workers providers: Together routing', () => {
  beforeAll(() => {
    // Ensure an API key is present so the adapter config is complete
    process.env.TOGETHER_API_KEY ||= 'test_key';
  });

  it('recognizes Together-style model IDs as valid and labels provider', () => {
    const id = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo';
    expect(isValidModel(id)).toBe(true);
    const info = getModelInfo(id);
    expect(info.provider).toBe('together');
    expect(info.id).toBe(id);
  });

  it('returns a model instance for Together IDs without throwing', () => {
    const id = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
    const model = getProviderModel(id);
    expect(model).toBeDefined();
    expect(typeof model).toBe('object');
  });

  it('still returns a model instance for regular OpenAI IDs', () => {
    const model = getProviderModel('gpt-4o-mini');
    expect(model).toBeDefined();
    expect(typeof model).toBe('object');
  });
});

