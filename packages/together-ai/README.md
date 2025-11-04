# @repo/together-ai

OpenAI-compatible Together.ai provider wrapper for the ai-workflows monorepo. This package exposes a minimal client to access Together-hosted models via the Vercel AI SDK.

## Install

The package is part of the workspace. Ensure your root `pnpm-workspace.yaml` includes `packages/*` (already present).

## Environment

Set the following variables for local/dev usage (e.g., in `apps/web/.env.local`):

- `TOGETHER_API_KEY=your_api_key`
- `TOGETHER_BASE_URL=https://api.together.xyz/v1` (optional; defaults to this value)

## Usage

```ts
import { together, createTogether, getTogetherModel } from '@repo/together-ai';
import { generateText } from 'ai';

// 1) Quick model instance from env-configured client
const model = getTogetherModel('meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo');
const result = await generateText({
  model,
  messages: [
    { role: 'system', content: 'You are helpful.' },
    { role: 'user', content: 'Write a haiku about oceans.' },
  ],
});

// 2) Custom client
const t = createTogether({ apiKey: process.env.TOGETHER_API_KEY });
const model2 = t.model('meta-llama/Meta-Llama-3.1-8B-Instruct');
```

## Notes

- Together.ai supports an OpenAI-compatible API for chat/completions and embeddings. This wrapper intentionally focuses on text first.
- For image generation or other modalities, prefer using a raw OpenAI client configured with Together’s base URL until a generic helper is added:

```ts
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY!,
  baseURL: process.env.TOGETHER_BASE_URL || 'https://api.together.xyz/v1',
});

// Example (API shape may differ per model)
// const image = await client.images.generate({ model: '...', prompt: '...' });
```

## Integrating with @repo/ai-workers

After adding your Together key, you can enable dynamic Together models by updating `packages/ai-workers/src/providers.mjs` to detect model IDs that look like Together (contain a `/`) and route them to a Together-configured OpenAI adapter. See the suggested patch in the repo’s PR notes.

