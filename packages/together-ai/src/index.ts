import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText, type CoreMessage } from 'ai';

export type TogetherConfig = {
  apiKey?: string;
  baseURL?: string;
};

// Create a Together client using OpenAI-compatible adapter
export function createTogether(config: TogetherConfig = {}) {
  const apiKey = config.apiKey ?? process.env.TOGETHER_API_KEY ?? '';
  const baseURL = config.baseURL ?? process.env.TOGETHER_BASE_URL ?? 'https://api.together.xyz/v1';

  const together = createOpenAI({ apiKey, baseURL });

  return {
    // Return an AI SDK model instance for any Together model id
    model(modelId: string) {
      return together(modelId);
    },

    // Convenience: text generation with messages API
    async generateText(params: {
      model: string;
      messages: CoreMessage[];
      temperature?: number;
      maxTokens?: number;
      abortSignal?: AbortSignal | null;
    }) {
      const { model, messages, temperature, maxTokens, abortSignal } = params;
      const m = together(model);
      return generateText({ model: m, messages, temperature, maxTokens, abortSignal: abortSignal ?? undefined });
    },

    // Convenience: streaming text
    async streamText(params: {
      model: string;
      messages: CoreMessage[];
      temperature?: number;
      maxTokens?: number;
      abortSignal?: AbortSignal | null;
      onChunk?: (chunk: string) => void;
    }) {
      const { model, messages, temperature, maxTokens, abortSignal } = params;
      const m = together(model);
      const stream = await streamText({ model: m, messages, temperature, maxTokens, abortSignal: abortSignal ?? undefined });
      return stream;
    },
  };
}

// Default client configured from environment variables
export const together = createTogether();

// Helper to fetch a Together model instance directly
export function getTogetherModel(modelId: string) {
  return together.model(modelId);
}

export default together;

