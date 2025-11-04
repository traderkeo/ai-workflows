import { defineConfig } from 'vitest/config';
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load environment variables for tests (Vitest doesn't load Next.js .env automatically)
const candidates = [
  // App-level first
  '.env.test.local',
  '.env.local',
  '.env',
  // Monorepo root fallbacks
  '../../.env.test.local',
  '../../.env.local',
  '../../.env',
];
for (const file of candidates) {
  try {
    dotenvConfig({ path: resolve(__dirname, file) });
  } catch {}
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    globals: true,
  },
});
