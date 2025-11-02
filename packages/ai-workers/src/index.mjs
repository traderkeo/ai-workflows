/**
 * AI Workflow Library
 * Main entry point - supports multiple AI providers
 */

export {
  // Model Configuration
  SUPPORTED_MODELS,
  getModelInfo,

  // Context
  WorkflowContext,

  // Text Generation
  generateTextNode,
  streamTextNode,

  // Structured Data
  generateStructuredDataNode,
  streamStructuredDataNode,

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

// Provider Utilities
export {
  // Model Collections
  OPENAI_MODELS,
  OPENAI_CHAT_MODELS,
  OPENAI_EMBEDDING_MODELS,
  OPENAI_IMAGE_MODELS,
  OPENAI_AUDIO_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,

  // Capability System
  ModelCapabilities,
  getModelsByCapability,
  modelSupports,
  getChatModels,

  // Provider Functions
  getProviderModel,
  getModelsByProvider,
  getAllModelIds,
  isValidModel,
} from './providers.mjs';

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
