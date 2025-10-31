/**
 * OpenAI Workflow Library
 * Main entry point
 */

export {
  // Context
  WorkflowContext,

  // Text Generation
  generateTextNode,
  streamTextNode,

  // Structured Data
  generateStructuredDataNode,

  // Tool Calling
  generateWithToolsNode,

  // Embeddings
  generateEmbeddingNode,
  generateEmbeddingsBatchNode,
  semanticSearchNode,
  cosineSimilarity,

  // Pre-built Tools
  searchTool,
  calculatorTool,
  dateTimeTool,

  // Workflow Utilities
  chainNodes,
  parallelNodes,
  conditionalNode,
  retryNode,

  // Default export
  default,
} from './openai-workflow.mjs';

// Web Search
export {
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

// Re-export examples
export * as examples from './examples.mjs';
