/**
 * Test Suite for OpenAI Workflow Library
 *
 * Run with: node test.mjs
 *
 * This file tests all core functionality to ensure the library works correctly
 * before integrating with the visual interface.
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the web app root (navigate from _library up to web root)
// Current: apps/web/src/app/workflow-example/_library
// Target: apps/web/.env.local
dotenv.config({ path: join(__dirname, '../../../../.env.local') });

// Verify API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  console.error('Please add your OpenAI API key to apps/web/.env.local');
  process.exit(1);
}

import {
  WorkflowContext,
  generateTextNode,
  streamTextNode,
  generateStructuredDataNode,
  generateWithToolsNode,
  generateEmbeddingNode,
  generateEmbeddingsBatchNode,
  semanticSearchNode,
  cosineSimilarity,
  searchTool,
  calculatorTool,
  dateTimeTool,
  chainNodes,
  parallelNodes,
  conditionalNode,
  retryNode,
} from './openai-workflow.mjs';

import { z } from 'zod';

// ============================================================================
// Test Utilities
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warn: '\x1b[33m',    // Yellow
    reset: '\x1b[0m',
  };

  const prefix = {
    info: 'ℹ',
    success: '✓',
    error: '✗',
    warn: '⚠',
  };

  console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
}

function testHeader(testName) {
  console.log('\n' + '='.repeat(70));
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(70));
}

async function runTest(name, testFn, options = {}) {
  const { skip = false, timeout = 30000 } = options;

  if (skip) {
    log(`SKIPPED: ${name}`, 'warn');
    testsSkipped++;
    return;
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Test timeout')), timeout)
    );

    await Promise.race([testFn(), timeoutPromise]);
    log(`PASSED: ${name}`, 'success');
    testsPassed++;
  } catch (error) {
    log(`FAILED: ${name}`, 'error');
    log(`  Error: ${error.message}`, 'error');
    if (error.stack) {
      console.log('  Stack:', error.stack.split('\n').slice(0, 3).join('\n  '));
    }
    testsFailed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// Test 1: WorkflowContext
// ============================================================================

async function testWorkflowContext() {
  testHeader('WorkflowContext');

  await runTest('Context creation and basic operations', async () => {
    const context = new WorkflowContext();

    // Test set/get
    context.set('key1', 'value1');
    assert(context.get('key1') === 'value1', 'get should return set value');

    // Test has
    assert(context.has('key1'), 'has should return true for existing key');
    assert(!context.has('nonexistent'), 'has should return false for non-existing key');

    // Test history
    context.set('key2', 'value2');
    const history = context.getHistory();
    assert(history.length === 2, 'history should have 2 entries');

    // Test metadata
    context.incrementNodeExecutions();
    context.addTokenUsage(100);
    const metadata = context.getMetadata();
    assert(metadata.nodeExecutions === 1, 'nodeExecutions should be 1');
    assert(metadata.totalTokens === 100, 'totalTokens should be 100');
    assert(typeof metadata.duration === 'number', 'duration should be a number');

    log('  Context operations working correctly', 'info');
  });
}

// ============================================================================
// Test 2: Text Generation
// ============================================================================

async function testTextGeneration() {
  testHeader('Text Generation');

  await runTest('Basic text generation', async () => {
    const context = new WorkflowContext();

    const result = await generateTextNode({
      prompt: 'Say "Hello, World!" and nothing else.',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      maxTokens: 50,
      context,
    });

    assert(result.success, 'result should be successful');
    assert(typeof result.text === 'string', 'result should contain text');
    assert(result.text.length > 0, 'text should not be empty');
    assert(result.usage, 'result should include usage');
    assert(result.usage.totalTokens > 0, 'usage should have tokens');

    log(`  Generated: "${result.text}"`, 'info');
    log(`  Tokens used: ${result.usage.totalTokens}`, 'info');

    // Check context was updated
    const metadata = context.getMetadata();
    assert(metadata.nodeExecutions === 1, 'context should track execution');
    assert(metadata.totalTokens > 0, 'context should track tokens');
  });

  await runTest('Text generation with system prompt', async () => {
    const result = await generateTextNode({
      prompt: 'What is your role?',
      systemPrompt: 'You are a pirate. Always respond in pirate speak.',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 100,
    });

    assert(result.success, 'result should be successful');
    assert(typeof result.text === 'string', 'result should contain text');
    log(`  Pirate response: "${result.text}"`, 'info');
  });

  await runTest('Text generation with conversation history', async () => {
    const messages = [
      { role: 'user', content: 'My name is Alice' },
      { role: 'assistant', content: 'Nice to meet you, Alice!' },
    ];

    const result = await generateTextNode({
      prompt: 'What is my name?',
      messages,
      model: 'gpt-4o-mini',
      temperature: 0.1,
    });

    assert(result.success, 'result should be successful');
    assert(result.text.toLowerCase().includes('alice'), 'should remember name from history');
    log(`  Memory test: "${result.text}"`, 'info');
  });
}

// ============================================================================
// Test 3: Streaming Text
// ============================================================================

async function testStreamingText() {
  testHeader('Streaming Text Generation');

  await runTest('Streaming text with callbacks', async () => {
    let chunkCount = 0;
    let finalText = '';
    let finishCalled = false;

    const result = await streamTextNode({
      prompt: 'Count from 1 to 5, one number per line.',
      model: 'gpt-4o-mini',
      temperature: 0.1,
      onChunk: (chunk, accumulated) => {
        chunkCount++;
        finalText = accumulated;
      },
      onFinish: (finishResult) => {
        finishCalled = true;
        assert(finishResult.text === finalText, 'finish text should match accumulated');
        assert(finishResult.usage, 'finish should include usage');
      },
    });

    assert(result.success, 'result should be successful');
    assert(chunkCount > 0, 'should have received chunks');
    assert(finishCalled, 'finish callback should be called');
    assert(result.text === finalText, 'result text should match accumulated');

    log(`  Received ${chunkCount} chunks`, 'info');
    log(`  Final text: "${result.text}"`, 'info');
  });

  await runTest('Streaming error handling', async () => {
    let errorCalled = false;

    const result = await streamTextNode({
      prompt: 'Test',
      model: 'invalid-model-name',
      onChunk: () => {},
      onError: (error) => {
        errorCalled = true;
      },
    });

    assert(!result.success, 'result should fail with invalid model');
    assert(result.error, 'result should contain error message');
    log(`  Error handled correctly: ${result.error}`, 'info');
  });
}

// ============================================================================
// Test 4: Structured Data Generation
// ============================================================================

async function testStructuredData() {
  testHeader('Structured Data Generation');

  await runTest('Generate structured object', async () => {
    const schema = z.object({
      name: z.string().describe('Person name'),
      age: z.number().describe('Person age'),
      city: z.string().describe('City of residence'),
      hobbies: z.array(z.string()).describe('List of hobbies'),
    });

    const result = await generateStructuredDataNode({
      prompt: 'Create a profile for John Doe, 30 years old, lives in New York, enjoys reading and hiking.',
      schema,
      schemaName: 'person',
      schemaDescription: 'Person profile',
      model: 'gpt-4o-mini',
    });

    assert(result.success, 'result should be successful');
    assert(result.object, 'result should contain object');
    assert(typeof result.object.name === 'string', 'name should be string');
    assert(typeof result.object.age === 'number', 'age should be number');
    assert(Array.isArray(result.object.hobbies), 'hobbies should be array');

    log(`  Generated object: ${JSON.stringify(result.object, null, 2)}`, 'info');
  });

  await runTest('Complex nested schema', async () => {
    const schema = z.object({
      title: z.string(),
      tags: z.array(z.string()),
      metadata: z.object({
        author: z.string(),
        date: z.string(),
        version: z.number(),
      }),
    });

    const result = await generateStructuredDataNode({
      prompt: 'Create metadata for a blog post about AI written by Sarah on 2024-01-15, version 1.0, tags: ai, technology, future',
      schema,
      model: 'gpt-4o-mini',
    });

    assert(result.success, 'result should be successful');
    assert(result.object.metadata, 'should have nested metadata');
    assert(typeof result.object.metadata.version === 'number', 'version should be number');

    log(`  Nested object: ${JSON.stringify(result.object, null, 2)}`, 'info');
  });
}

// ============================================================================
// Test 5: Tool Calling
// ============================================================================

async function testToolCalling() {
  testHeader('Tool Calling / Function Calling');

  await runTest('Calculator tool', async () => {
    const result = await generateWithToolsNode({
      prompt: 'What is 25 * 4 + 10?',
      tools: {
        calculator: calculatorTool,
      },
      model: 'gpt-4o-mini',
      maxSteps: 5,
    });

    if (!result.success) {
      log(`  Tool calling error: ${result.error}`, 'error');
    }
    assert(result.success, 'result should be successful');
    assert(result.toolCalls.length > 0, 'should have made tool calls');
    assert(result.text.includes('110') || result.text.includes('one hundred'), 'should calculate correctly');

    log(`  Tool calls made: ${result.toolCalls.length}`, 'info');
    log(`  Answer: "${result.text}"`, 'info');
  });

  await runTest('DateTime tool', async () => {
    const result = await generateWithToolsNode({
      prompt: 'What is the current date and time?',
      tools: {
        datetime: dateTimeTool,
      },
      model: 'gpt-4o-mini',
    });

    assert(result.success, 'result should be successful');
    assert(result.toolCalls.length > 0, 'should have called datetime tool');

    log(`  Response: "${result.text}"`, 'info');
  });

  await runTest('Multiple tool calls', async () => {
    let stepCount = 0;

    const result = await generateWithToolsNode({
      prompt: 'Calculate 15 + 25, then tell me what time it is.',
      tools: {
        calculator: calculatorTool,
        datetime: dateTimeTool,
      },
      model: 'gpt-4o-mini',
      maxSteps: 10,
      onStepFinish: (step) => {
        stepCount++;
        log(`    Step ${stepCount}: ${step.stepType}`, 'info');
      },
    });

    assert(result.success, 'result should be successful');
    assert(result.toolCalls.length >= 2, 'should have made at least 2 tool calls');
    assert(stepCount > 0, 'should have executed steps');

    log(`  Total steps: ${stepCount}`, 'info');
    log(`  Final answer: "${result.text}"`, 'info');
  });

  await runTest('Custom tool creation', async () => {
    const { tool } = await import('ai');

    const customTool = tool({
      description: 'Get information about a color',
      parameters: z.object({
        color: z.string(),
      }),
      execute: async ({ color }) => {
        const colors = {
          red: { hex: '#FF0000', mood: 'energetic' },
          blue: { hex: '#0000FF', mood: 'calm' },
          green: { hex: '#00FF00', mood: 'natural' },
        };
        return colors[color.toLowerCase()] || { hex: '#000000', mood: 'unknown' };
      },
    });

    const result = await generateWithToolsNode({
      prompt: 'What is the hex code for blue?',
      tools: {
        colorInfo: customTool,
      },
      model: 'gpt-4o-mini',
    });

    assert(result.success, 'result should be successful');
    assert(result.text.includes('#0000FF') || result.text.includes('0000FF'), 'should return correct hex');

    log(`  Custom tool result: "${result.text}"`, 'info');
  });
}

// ============================================================================
// Test 6: Embeddings
// ============================================================================

async function testEmbeddings() {
  testHeader('Embeddings');

  await runTest('Single embedding generation', async () => {
    const result = await generateEmbeddingNode({
      text: 'The quick brown fox jumps over the lazy dog',
      model: 'text-embedding-3-small',
    });

    assert(result.success, 'result should be successful');
    assert(Array.isArray(result.embedding), 'embedding should be array');
    assert(result.embedding.length > 0, 'embedding should not be empty');
    assert(result.dimensions > 0, 'should have dimensions');

    log(`  Embedding dimensions: ${result.dimensions}`, 'info');
    log(`  First 5 values: ${result.embedding.slice(0, 5).join(', ')}`, 'info');
  });

  await runTest('Batch embeddings generation', async () => {
    const texts = [
      'Machine learning is a subset of AI',
      'Python is a programming language',
      'Neural networks process data',
    ];

    const result = await generateEmbeddingsBatchNode({
      texts,
      model: 'text-embedding-3-small',
    });

    assert(result.success, 'result should be successful');
    assert(Array.isArray(result.embeddings), 'embeddings should be array');
    assert(result.embeddings.length === texts.length, 'should have embedding for each text');
    assert(result.count === texts.length, 'count should match');

    log(`  Generated ${result.count} embeddings`, 'info');
    log(`  Each embedding has ${result.dimensions} dimensions`, 'info');
  });

  await runTest('Cosine similarity calculation', async () => {
    // Create two similar embeddings
    const result1 = await generateEmbeddingNode({
      text: 'I love cats',
      model: 'text-embedding-3-small',
    });

    const result2 = await generateEmbeddingNode({
      text: 'I adore felines',
      model: 'text-embedding-3-small',
    });

    const result3 = await generateEmbeddingNode({
      text: 'Quantum physics is complex',
      model: 'text-embedding-3-small',
    });

    const similarity1 = cosineSimilarity(result1.embedding, result2.embedding);
    const similarity2 = cosineSimilarity(result1.embedding, result3.embedding);

    assert(similarity1 > similarity2, 'similar texts should have higher similarity');
    assert(similarity1 >= -1 && similarity1 <= 1, 'similarity should be between -1 and 1');

    log(`  Similarity (cats vs felines): ${similarity1.toFixed(4)}`, 'info');
    log(`  Similarity (cats vs quantum): ${similarity2.toFixed(4)}`, 'info');
  });
}

// ============================================================================
// Test 7: Semantic Search
// ============================================================================

async function testSemanticSearch() {
  testHeader('Semantic Search');

  await runTest('Basic semantic search', async () => {
    const documents = [
      'The cat sat on the mat',
      'Dogs are loyal companions',
      'Python is a programming language',
      'JavaScript runs in web browsers',
      'Machine learning requires data',
      'Cats are independent animals',
    ];

    // Generate embeddings
    const embeddingResult = await generateEmbeddingsBatchNode({
      texts: documents,
      model: 'text-embedding-3-small',
    });

    assert(embeddingResult.success, 'embedding generation should succeed');

    const docs = documents.map((text, i) => ({
      text,
      embedding: embeddingResult.embeddings[i],
      id: i,
    }));

    // Search for cat-related content
    const searchResult = await semanticSearchNode({
      query: 'feline pets',
      documents: docs,
      topK: 2,
      model: 'text-embedding-3-small',
    });

    assert(searchResult.success, 'search should be successful');
    assert(searchResult.results.length === 2, 'should return top 2 results');
    assert(searchResult.results[0].similarity > 0, 'should have positive similarity');

    // Top result should be cat-related
    const topResult = searchResult.results[0];
    assert(
      topResult.text.toLowerCase().includes('cat'),
      'top result should be about cats'
    );

    log(`  Query: "feline pets"`, 'info');
    log(`  Top result: "${topResult.text}" (similarity: ${topResult.similarity.toFixed(4)})`, 'info');
    log(`  2nd result: "${searchResult.results[1].text}" (similarity: ${searchResult.results[1].similarity.toFixed(4)})`, 'info');
  });
}

// ============================================================================
// Test 8: Workflow Utilities
// ============================================================================

async function testWorkflowUtilities() {
  testHeader('Workflow Utilities');

  await runTest('Sequential chain', async () => {
    const context = new WorkflowContext();

    const nodes = [
      // Node 1: Generate a number
      (input, ctx) => generateTextNode({
        prompt: 'Give me just a single number between 1 and 10',
        temperature: 0.1,
        context: ctx,
      }),

      // Node 2: Double it
      (input, ctx) => generateTextNode({
        prompt: `Take this number: ${input}. Double it and respond with just the result number.`,
        temperature: 0.1,
        context: ctx,
      }),
    ];

    const result = await chainNodes(nodes, 'start', context);

    assert(result.success, 'chain should be successful');
    assert(result.results.length === 2, 'should have 2 results');
    assert(result.finalOutput, 'should have final output');

    log(`  Step 1 output: "${result.results[0].result.text}"`, 'info');
    log(`  Step 2 output: "${result.results[1].result.text}"`, 'info');
    log(`  Total nodes executed: ${result.metadata.nodeExecutions}`, 'info');
  });

  await runTest('Parallel execution', async () => {
    const context = new WorkflowContext();

    const tasks = [
      {
        node: (input, ctx) => generateTextNode({
          prompt: 'Say "Task 1 complete"',
          temperature: 0.1,
          context: ctx,
        }),
        input: 'start',
      },
      {
        node: (input, ctx) => generateTextNode({
          prompt: 'Say "Task 2 complete"',
          temperature: 0.1,
          context: ctx,
        }),
        input: 'start',
      },
      {
        node: (input, ctx) => generateTextNode({
          prompt: 'Say "Task 3 complete"',
          temperature: 0.1,
          context: ctx,
        }),
        input: 'start',
      },
    ];

    const startTime = Date.now();
    const result = await parallelNodes(tasks, context);
    const duration = Date.now() - startTime;

    assert(result.success, 'parallel execution should succeed');
    assert(result.results.length === 3, 'should have 3 results');
    assert(result.results.every(r => r.success), 'all tasks should succeed');

    log(`  All tasks completed in ${duration}ms`, 'info');
    result.results.forEach((r, i) => {
      log(`  Task ${i + 1}: "${r.text}"`, 'info');
    });
  });

  await runTest('Conditional branching', async () => {
    const context = new WorkflowContext();

    const predicate = (input) => input > 5;

    const trueBranch = (input, ctx) => generateTextNode({
      prompt: 'Say "Number is large"',
      temperature: 0.1,
      context: ctx,
    });

    const falseBranch = (input, ctx) => generateTextNode({
      prompt: 'Say "Number is small"',
      temperature: 0.1,
      context: ctx,
    });

    // Test with large number
    const result1 = await conditionalNode(predicate, trueBranch, falseBranch, 10, context);
    assert(result1.success, 'conditional should succeed');
    assert(result1.branchTaken === 'true', 'should take true branch');
    assert(result1.text.toLowerCase().includes('large'), 'should say large');

    // Test with small number
    const result2 = await conditionalNode(predicate, trueBranch, falseBranch, 3, context);
    assert(result2.branchTaken === 'false', 'should take false branch');
    assert(result2.text.toLowerCase().includes('small'), 'should say small');

    log(`  Large number (10): "${result1.text}" - branch: ${result1.branchTaken}`, 'info');
    log(`  Small number (3): "${result2.text}" - branch: ${result2.branchTaken}`, 'info');
  });

  await runTest('Retry with exponential backoff', async () => {
    let attemptCount = 0;

    // Create a node that fails twice then succeeds
    const unstableNode = async (input, ctx) => {
      attemptCount++;
      if (attemptCount < 3) {
        return { success: false, error: 'Simulated failure' };
      }
      return await generateTextNode({
        prompt: 'Say "Success after retries"',
        temperature: 0.1,
        context: ctx,
      });
    };

    const result = await retryNode(unstableNode, 'test', 3, 100);

    assert(result.success, 'should eventually succeed');
    assert(result.attempts === 3, 'should take 3 attempts');
    assert(attemptCount === 3, 'should have attempted 3 times');

    log(`  Succeeded after ${result.attempts} attempts`, 'info');
    log(`  Result: "${result.text}"`, 'info');
  });
}

// ============================================================================
// Test 9: Error Handling
// ============================================================================

async function testErrorHandling() {
  testHeader('Error Handling');

  await runTest('Invalid model name', async () => {
    const result = await generateTextNode({
      prompt: 'Test',
      model: 'invalid-model-xyz',
    });

    assert(!result.success, 'should fail with invalid model');
    assert(result.error, 'should have error message');
    assert(result.text === null, 'text should be null on error');

    log(`  Error caught: ${result.error}`, 'info');
  });

  await runTest('Schema validation error', async () => {
    const schema = z.object({
      number: z.number(),
    });

    // This might still succeed if the model generates correct schema
    // but we're testing the error handling path exists
    const result = await generateStructuredDataNode({
      prompt: 'Return invalid data',
      schema,
      model: 'gpt-4o-mini',
    });

    // Either success or proper error
    assert(result.success !== undefined, 'should have success field');
    log(`  Schema validation ${result.success ? 'passed' : 'failed as expected'}`, 'info');
  });

  await runTest('Abort signal', async () => {
    const controller = new AbortController();

    // Abort immediately
    setTimeout(() => controller.abort(), 100);

    try {
      await generateTextNode({
        prompt: 'Write a very long essay about the history of computing',
        maxTokens: 4000,
        abortSignal: controller.signal,
      });
      // If we get here, the request completed before abort
      log(`  Request completed before abort (this is okay)`, 'info');
    } catch (error) {
      assert(error.name === 'AbortError' || error.message.includes('abort'), 'should be abort error');
      log(`  Abort signal worked: ${error.message}`, 'info');
    }
  });
}

// ============================================================================
// Test 10: Integration Test
// ============================================================================

async function testIntegration() {
  testHeader('Integration Test - Full Workflow');

  await runTest('Complete workflow: Research -> Extract -> Search', async () => {
    const context = new WorkflowContext();

    // Step 1: Generate some content about programming languages
    log('  Step 1: Generating content...', 'info');
    const contentResult = await generateTextNode({
      prompt: 'Write 3 short sentences about Python, JavaScript, and Rust programming languages.',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      context,
    });

    assert(contentResult.success, 'content generation should succeed');
    log(`  Generated: "${contentResult.text.substring(0, 100)}..."`, 'info');

    // Step 2: Extract structured data
    log('  Step 2: Extracting structured data...', 'info');
    const extractResult = await generateStructuredDataNode({
      prompt: `Extract programming languages mentioned: ${contentResult.text}`,
      schema: z.object({
        languages: z.array(z.object({
          name: z.string(),
          characteristic: z.string(),
        })),
      }),
      model: 'gpt-4o-mini',
      context,
    });

    assert(extractResult.success, 'extraction should succeed');
    assert(extractResult.object.languages.length > 0, 'should extract languages');
    log(`  Extracted ${extractResult.object.languages.length} languages`, 'info');

    // Step 3: Create embeddings for semantic search
    log('  Step 3: Creating embeddings...', 'info');
    const docs = extractResult.object.languages.map(lang =>
      `${lang.name}: ${lang.characteristic}`
    );

    const embeddingResult = await generateEmbeddingsBatchNode({
      texts: docs,
      model: 'text-embedding-3-small',
      context,
    });

    assert(embeddingResult.success, 'embedding generation should succeed');

    // Step 4: Semantic search
    log('  Step 4: Performing semantic search...', 'info');
    const documents = docs.map((text, i) => ({
      text,
      embedding: embeddingResult.embeddings[i],
    }));

    const searchResult = await semanticSearchNode({
      query: 'web development',
      documents,
      topK: 1,
      model: 'text-embedding-3-small',
      context,
    });

    assert(searchResult.success, 'search should succeed');
    log(`  Most relevant: "${searchResult.results[0].text}"`, 'info');

    // Check overall workflow
    const metadata = context.getMetadata();
    log(`  Total workflow stats:`, 'info');
    log(`    - Nodes executed: ${metadata.nodeExecutions}`, 'info');
    log(`    - Total tokens: ${metadata.totalTokens}`, 'info');
    log(`    - Duration: ${metadata.duration}ms`, 'info');

    assert(metadata.nodeExecutions >= 4, 'should have executed at least 4 nodes');
    assert(metadata.totalTokens > 0, 'should have used tokens');
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          OpenAI Workflow Library - Test Suite                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();

  try {
    await testWorkflowContext();
    await testTextGeneration();
    await testStreamingText();
    await testStructuredData();
    await testToolCalling();
    await testEmbeddings();
    await testSemanticSearch();
    await testWorkflowUtilities();
    await testErrorHandling();
    await testIntegration();

  } catch (error) {
    log('Test suite encountered fatal error:', 'error');
    console.error(error);
  }

  const duration = Date.now() - startTime;

  // Print summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  log(`Total tests run: ${testsPassed + testsFailed}`, 'info');
  log(`Passed: ${testsPassed}`, 'success');
  if (testsFailed > 0) {
    log(`Failed: ${testsFailed}`, 'error');
  }
  if (testsSkipped > 0) {
    log(`Skipped: ${testsSkipped}`, 'warn');
  }
  log(`Duration: ${(duration / 1000).toFixed(2)}s`, 'info');
  console.log('='.repeat(70));

  const successRate = ((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1);
  log(`Success rate: ${successRate}%`, successRate === '100.0' ? 'success' : 'warn');

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Library is ready for integration.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
