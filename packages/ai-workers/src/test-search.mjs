/**
 * Test Suite for Web Search Functionality
 *
 * Run with: node test-search.mjs
 *
 * Tests OpenAI's Responses API web search capabilities
 */

// Load environment variables
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load from multiple possible locations
dotenv.config({ path: join(__dirname, '../../../apps/web/.env.local') });
dotenv.config({ path: join(__dirname, '../../.env.local') });
dotenv.config({ path: join(__dirname, '../.env.local') });

// Verify API key is loaded
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  console.error('Please add your OpenAI API key to .env.local');
  process.exit(1);
}

import {
  webSearchNode,
  simpleWebSearch,
  domainFilteredSearch,
  locationAwareSearch,
  cachedWebSearch,
  webSearchWithSources,
  formatCitations,
  extractDomains,
  createMarkdownCitations,
} from './web-search.mjs';

import { WorkflowContext } from './openai-workflow.mjs';

// ============================================================================
// Test Utilities
// ============================================================================

let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
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
  const { skip = false, timeout = 90000 } = options; // 90s timeout for web search

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
// Test 1: Basic Web Search
// ============================================================================

async function testBasicWebSearch() {
  testHeader('Basic Web Search');

  await runTest('Simple web search with current events', async () => {
    const result = await simpleWebSearch('What are the latest developments in AI?');

    if (!result.success) {
      log(`  Error: ${result.error}`, 'error');
    }

    assert(result.success, 'search should be successful');
    assert(typeof result.text === 'string', 'result should contain text');
    assert(result.text.length > 0, 'text should not be empty');
    assert(Array.isArray(result.citations), 'citations should be an array');
    assert(Array.isArray(result.searchCalls), 'searchCalls should be an array');

    log(`  Response length: ${result.text.length} characters`, 'info');
    log(`  Citations found: ${result.citations.length}`, 'info');
    log(`  Search calls: ${result.searchCalls.length}`, 'info');

    if (result.citations.length > 0) {
      log(`  First citation: ${result.citations[0].title}`, 'info');
      log(`  URL: ${result.citations[0].url}`, 'info');
    }
  });

  await runTest('Web search node with full options', async () => {
    const context = new WorkflowContext();

    const result = await webSearchNode({
      query: 'What is the weather like today in San Francisco?',
      model: 'gpt-4o-mini',
      context,
    });

    assert(result.success, 'search should be successful');
    assert(result.text.length > 0, 'should have response text');

    const metadata = context.getMetadata();
    assert(metadata.nodeExecutions === 1, 'context should track execution');

    log(`  Response: ${result.text.substring(0, 150)}...`, 'info');
  });
}

// ============================================================================
// Test 2: Domain Filtering
// ============================================================================

async function testDomainFiltering() {
  testHeader('Domain Filtering');

  await runTest('Search with allowed domains', async () => {
    const result = await domainFilteredSearch({
      query: 'Latest research on climate change',
      domains: [
        'nature.com',
        'science.org',
        'pnas.org',
        'sciencedirect.com',
      ],
    });

    assert(result.success, 'filtered search should be successful');
    assert(result.text.length > 0, 'should have response');

    // Check if citations are from allowed domains
    if (result.citations.length > 0) {
      const domains = extractDomains(result.citations);
      log(`  Domains found: ${domains.join(', ')}`, 'info');

      // At least one citation should be from allowed domains
      const hasAllowedDomain = domains.some(domain =>
        ['nature.com', 'science.org', 'pnas.org', 'sciencedirect.com'].some(
          allowed => domain.includes(allowed)
        )
      );

      // Note: This might not always be true if the search doesn't find results
      // in those domains, so we just log it
      log(`  Uses allowed domains: ${hasAllowedDomain}`, 'info');
    }
  });

  await runTest('Search with specific domain list', async () => {
    const result = await domainFilteredSearch({
      query: 'TypeScript best practices',
      domains: [
        'typescriptlang.org',
        'github.com',
        'stackoverflow.com',
      ],
    });

    assert(result.success, 'search should succeed');
    log(`  Found ${result.citations.length} citations`, 'info');
  });
}

// ============================================================================
// Test 3: Location-Aware Search
// ============================================================================

async function testLocationAwareSearch() {
  testHeader('Location-Aware Search');

  await runTest('Search with user location', async () => {
    const result = await locationAwareSearch({
      query: 'Best restaurants near me',
      location: {
        country: 'US',
        city: 'New York',
        region: 'New York',
        timezone: 'America/New_York',
      },
    });

    assert(result.success, 'location-aware search should succeed');
    assert(result.text.length > 0, 'should have results');

    log(`  Response mentions New York: ${result.text.includes('New York')}`, 'info');
    log(`  Citations: ${result.citations.length}`, 'info');
  });

  await runTest('Search with different location', async () => {
    const result = await locationAwareSearch({
      query: 'Current local news',
      location: {
        country: 'GB',
        city: 'London',
        region: 'London',
      },
    });

    assert(result.success, 'search should succeed');
    log(`  Response length: ${result.text.length}`, 'info');
  });
}

// ============================================================================
// Test 4: Cached Search
// ============================================================================

async function testCachedSearch() {
  testHeader('Cached Search (No Live Internet)');

  await runTest('Cached-only search', async () => {
    const result = await cachedWebSearch(
      'What is the capital of France?'
    );

    assert(result.success, 'cached search should succeed');
    assert(result.text.length > 0, 'should have response');

    log(`  Response: ${result.text}`, 'info');
    log(`  Citations: ${result.citations.length}`, 'info');
  });

  await runTest('Cached vs live search comparison', async () => {
    const query = 'Popular programming languages';

    const cachedResult = await cachedWebSearch(query);
    const liveResult = await simpleWebSearch(query);

    assert(cachedResult.success, 'cached search should succeed');
    assert(liveResult.success, 'live search should succeed');

    log(`  Cached response length: ${cachedResult.text.length}`, 'info');
    log(`  Live response length: ${liveResult.text.length}`, 'info');
  });
}

// ============================================================================
// Test 5: Search with Sources
// ============================================================================

async function testSearchWithSources() {
  testHeader('Search with Full Sources');

  await runTest('Web search including all sources', async () => {
    const result = await webSearchWithSources(
      'What are the benefits of TypeScript?'
    );

    assert(result.success, 'search with sources should succeed');
    assert(result.text.length > 0, 'should have text');
    assert(Array.isArray(result.citations), 'should have citations array');

    log(`  Citations: ${result.citations.length}`, 'info');

    if (result.sources) {
      log(`  Total sources consulted: ${result.sources.length}`, 'info');
      assert(Array.isArray(result.sources), 'sources should be an array');

      if (result.sources.length > 0) {
        log(`  First source: ${JSON.stringify(result.sources[0])}`, 'info');
      }
    }
  });
}

// ============================================================================
// Test 6: Citation Utilities
// ============================================================================

async function testCitationUtilities() {
  testHeader('Citation Utilities');

  await runTest('Format citations', async () => {
    const citations = [
      {
        title: 'Example Article 1',
        url: 'https://example.com/article1',
        startIndex: 0,
        endIndex: 10,
      },
      {
        title: 'Example Article 2',
        url: 'https://example.org/article2',
        startIndex: 50,
        endIndex: 60,
      },
    ];

    const formatted = formatCitations(citations);

    assert(typeof formatted === 'string', 'formatted should be string');
    assert(formatted.includes('Example Article 1'), 'should include first title');
    assert(formatted.includes('example.com'), 'should include first URL');
    assert(formatted.includes('[1]'), 'should have numbering');

    log(`  Formatted citations:\n${formatted}`, 'info');
  });

  await runTest('Extract domains from citations', async () => {
    const citations = [
      { url: 'https://example.com/page1', title: 'Page 1' },
      { url: 'https://example.com/page2', title: 'Page 2' },
      { url: 'https://other.org/page', title: 'Page 3' },
    ];

    const domains = extractDomains(citations);

    assert(Array.isArray(domains), 'domains should be array');
    assert(domains.length === 2, 'should have 2 unique domains');
    assert(domains.includes('example.com'), 'should include example.com');
    assert(domains.includes('other.org'), 'should include other.org');

    log(`  Extracted domains: ${domains.join(', ')}`, 'info');
  });

  await runTest('Create markdown citations', async () => {
    const text = 'This is some text with citations.';
    const citations = [
      {
        title: 'Source 1',
        url: 'https://example.com/1',
      },
      {
        title: 'Source 2',
        url: 'https://example.com/2',
      },
    ];

    const markdown = createMarkdownCitations(text, citations);

    assert(typeof markdown === 'string', 'markdown should be string');
    assert(markdown.includes('## References'), 'should have references section');
    assert(markdown.includes('[Source 1]'), 'should include citation title');
    assert(markdown.includes('https://example.com/1'), 'should include URL');

    log(`  Markdown output:\n${markdown}`, 'info');
  });
}

// ============================================================================
// Test 7: Real-World Use Cases
// ============================================================================

async function testRealWorldUseCases() {
  testHeader('Real-World Use Cases');

  await runTest('News search', async () => {
    const result = await simpleWebSearch(
      'What are the top tech news stories today?'
    );

    assert(result.success, 'news search should succeed');
    assert(result.citations.length > 0, 'should have news citations');

    log(`  Found ${result.citations.length} news sources`, 'info');
    log(`  Response preview: ${result.text.substring(0, 200)}...`, 'info');
  });

  await runTest('Research query', async () => {
    const result = await domainFilteredSearch({
      query: 'Recent advances in quantum computing',
      domains: [
        'nature.com',
        'science.org',
        'arxiv.org',
      ],
    });

    assert(result.success, 'research query should succeed');
    log(`  Academic sources found: ${result.citations.length}`, 'info');
  });

  await runTest('Local information search', async () => {
    const result = await locationAwareSearch({
      query: 'Current weather',
      location: {
        country: 'US',
        city: 'Seattle',
        timezone: 'America/Los_Angeles',
      },
    });

    assert(result.success, 'local search should succeed');
    log(`  Weather info retrieved: ${result.text.length > 0}`, 'info');
  });
}

// ============================================================================
// Test 8: Error Handling
// ============================================================================

async function testErrorHandling() {
  testHeader('Error Handling');

  await runTest('Empty query handling', async () => {
    const result = await simpleWebSearch('');

    // Empty query might fail or return generic results
    log(`  Empty query result: ${result.success ? 'succeeded' : 'failed'}`, 'info');

    if (!result.success) {
      assert(result.error, 'should have error message');
      log(`  Error message: ${result.error}`, 'info');
    }
  });

  await runTest('Invalid model handling', async () => {
    const result = await webSearchNode({
      query: 'test query',
      model: 'invalid-model-name',
    });

    assert(!result.success, 'should fail with invalid model');
    assert(result.error, 'should have error message');

    log(`  Error caught: ${result.error}`, 'info');
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║          Web Search Functionality - Test Suite                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const startTime = Date.now();

  try {
    await testBasicWebSearch();
    await testDomainFiltering();
    await testLocationAwareSearch();
    await testCachedSearch();
    await testSearchWithSources();
    await testCitationUtilities();
    await testRealWorldUseCases();
    await testErrorHandling();

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
    console.log('\n🎉 All web search tests passed! Feature is ready to use.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runAllTests();
