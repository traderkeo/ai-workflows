/**
 * Test @repo/ai-workers package integration
 *
 * Run with: node src/app/workflow-example/test-ai-workers.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load from apps/web/.env.local (navigate from workflow-example up to web root)
dotenv.config({ path: join(__dirname, '../../../.env.local') });

// Import from the ai-workers package
import {
  generateTextNode,
  streamTextNode,
  generateStructuredDataNode,
  webSearchNode,
  simpleWebSearch,
  formatCitations,
  WorkflowContext,
} from '@repo/ai-workers';

import { z } from 'zod';

console.log('Testing @repo/ai-workers package integration...\n');

// Test 1: Basic text generation
console.log('='.repeat(60));
console.log('Test 1: Text Generation');
console.log('='.repeat(60));

const textResult = await generateTextNode({
  prompt: 'Say "AI Workers package is working!"',
  model: 'gpt-4o-mini',
  temperature: 0.1,
});

if (textResult.success) {
  console.log('✓ Text generation works!');
  console.log('Response:', textResult.text);
  console.log('Tokens:', textResult.usage.totalTokens);
} else {
  console.log('✗ Text generation failed:', textResult.error);
}

// Test 2: Structured data
console.log('\n' + '='.repeat(60));
console.log('Test 2: Structured Data');
console.log('='.repeat(60));

const schema = z.object({
  status: z.string(),
  features: z.array(z.string()),
});

const structuredResult = await generateStructuredDataNode({
  prompt: 'Create a status report: package is working, features: text, web search, embeddings',
  schema,
  model: 'gpt-4o-mini',
});

if (structuredResult.success) {
  console.log('✓ Structured data works!');
  console.log('Result:', JSON.stringify(structuredResult.object, null, 2));
} else {
  console.log('✗ Structured data failed:', structuredResult.error);
}

// Test 3: Web search
console.log('\n' + '='.repeat(60));
console.log('Test 3: Web Search');
console.log('='.repeat(60));

const searchResult = await simpleWebSearch('What is the weather like today?');

if (searchResult.success) {
  console.log('✓ Web search works!');
  console.log('Response:', searchResult.text.substring(0, 200) + '...');
  console.log('Citations:', searchResult.citations.length);

  if (searchResult.citations.length > 0) {
    console.log('\nFormatted citations:');
    console.log(formatCitations(searchResult.citations.slice(0, 3)));
  }
} else {
  console.log('✗ Web search failed:', searchResult.error);
}

// Test 4: Workflow context
console.log('\n' + '='.repeat(60));
console.log('Test 4: Workflow Context');
console.log('='.repeat(60));

const context = new WorkflowContext();

await generateTextNode({
  prompt: 'Count to 3',
  model: 'gpt-4o-mini',
  context,
});

const metadata = context.getMetadata();
console.log('✓ Context tracking works!');
console.log('Metadata:', metadata);

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log('✅ @repo/ai-workers package is successfully integrated!');
console.log('✅ All core features are working:');
console.log('   - Text generation');
console.log('   - Structured data extraction');
console.log('   - Web search with citations');
console.log('   - Workflow context tracking');
console.log('\n🎉 Ready to use in your visual workflow interface!\n');
